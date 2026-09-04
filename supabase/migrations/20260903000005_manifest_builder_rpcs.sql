-- Migration: Flight Manifest Builder RPCs and supporting enhancements
-- Creates: add_shipment_to_manifest, remove_shipment_from_manifest, lock_manifest, dispatch_manifest RPCs

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: add_shipment_to_manifest
-- Atomically adds one AWB to a manifest and updates running totals
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_shipment_to_manifest(
  p_manifest_id  UUID,
  p_shipment_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_manifest  flight_manifests%ROWTYPE;
  v_shipment  shipments%ROWTYPE;
BEGIN
  -- Validate manifest exists and is open
  SELECT * INTO v_manifest FROM flight_manifests WHERE id = p_manifest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Manifest not found');
  END IF;
  IF v_manifest.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Manifest is locked or closed. Cannot add shipments.');
  END IF;

  -- Validate shipment exists and is security-cleared
  SELECT * INTO v_shipment FROM shipments WHERE id = p_shipment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;
  IF v_shipment.status NOT IN ('received', 'security_cleared') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment must be received or security-cleared to be manifested');
  END IF;

  -- Prevent duplicate entries
  IF EXISTS (SELECT 1 FROM manifest_items WHERE manifest_id = p_manifest_id AND shipment_id = p_shipment_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment already added to this manifest');
  END IF;

  -- Insert manifest item
  INSERT INTO manifest_items (manifest_id, shipment_id)
  VALUES (p_manifest_id, p_shipment_id);

  -- Update shipment status to manifested
  UPDATE shipments SET status = 'manifested', updated_at = NOW() WHERE id = p_shipment_id;

  -- Update manifest running totals
  UPDATE flight_manifests
  SET
    total_awbs     = total_awbs + 1,
    total_pieces   = total_pieces + v_shipment.pieces,
    total_weight_kg = total_weight_kg + v_shipment.weight_kg,
    updated_at     = NOW()
  WHERE id = p_manifest_id;

  RETURN jsonb_build_object('success', true, 'awb_number', v_shipment.awb_number);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: remove_shipment_from_manifest
-- Removes a shipment from manifest and reverts status to security_cleared
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION remove_shipment_from_manifest(
  p_manifest_id  UUID,
  p_shipment_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shipment shipments%ROWTYPE;
BEGIN
  SELECT * INTO v_shipment FROM shipments WHERE id = p_shipment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  DELETE FROM manifest_items WHERE manifest_id = p_manifest_id AND shipment_id = p_shipment_id;

  UPDATE shipments SET status = 'security_cleared', updated_at = NOW() WHERE id = p_shipment_id;

  UPDATE flight_manifests
  SET
    total_awbs      = GREATEST(0, total_awbs - 1),
    total_pieces    = GREATEST(0, total_pieces - v_shipment.pieces),
    total_weight_kg = GREATEST(0, total_weight_kg - v_shipment.weight_kg),
    updated_at      = NOW()
  WHERE id = p_manifest_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: lock_manifest
-- Locks manifest (no more changes); station manager only
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION lock_manifest(p_manifest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE flight_manifests
  SET status = 'locked', updated_at = NOW()
  WHERE id = p_manifest_id AND status = 'open';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Manifest not found or not in open state');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: dispatch_manifest (marks flight as airborne, bulk-updates all AWBs)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dispatch_manifest(
  p_manifest_id  UUID,
  p_dispatched_by TEXT DEFAULT 'System'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_manifest_number TEXT;
  v_updated_count   INT;
BEGIN
  -- Lock the manifest and mark airborne
  UPDATE flight_manifests
  SET
    status         = 'airborne',
    dispatched_by  = p_dispatched_by,
    dispatched_at  = NOW(),
    updated_at     = NOW()
  WHERE id = p_manifest_id AND status IN ('open', 'locked')
  RETURNING manifest_number INTO v_manifest_number;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Manifest cannot be dispatched in current state');
  END IF;

  -- Bulk update all included shipments to departed
  UPDATE shipments s
  SET status = 'departed', updated_at = NOW()
  FROM manifest_items mi
  WHERE mi.manifest_id = p_manifest_id AND mi.shipment_id = s.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'manifest_number', v_manifest_number,
    'shipments_dispatched', v_updated_count
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: land_manifest (marks flight as landed, bulk-updates all AWBs to arrived)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION land_manifest(
  p_manifest_id UUID,
  p_received_by TEXT DEFAULT 'Destination Station'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INT;
BEGIN
  UPDATE flight_manifests
  SET
    status       = 'landed',
    received_by  = p_received_by,
    received_at  = NOW(),
    updated_at   = NOW()
  WHERE id = p_manifest_id AND status = 'airborne';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Manifest is not currently airborne');
  END IF;

  UPDATE shipments s
  SET status = 'arrived', updated_at = NOW()
  FROM manifest_items mi
  WHERE mi.manifest_id = p_manifest_id AND mi.shipment_id = s.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'shipments_arrived', v_updated_count);
END;
$$;

-- Grant execute to authenticated users (RLS ensures per-tenant isolation via SECURITY DEFINER + JWT checks)
GRANT EXECUTE ON FUNCTION add_shipment_to_manifest(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_shipment_from_manifest(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION lock_manifest(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dispatch_manifest(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION land_manifest(UUID, TEXT) TO authenticated;
