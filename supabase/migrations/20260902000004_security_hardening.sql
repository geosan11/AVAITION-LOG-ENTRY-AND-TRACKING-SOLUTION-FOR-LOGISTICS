-- ============================================================================
-- Migration 04: Security Hardening, Atomic AWB Sequences & Role Guards
-- ============================================================================

-- ── 1. JWT-BASED TENANT HELPERS (zero DB subquery overhead) ──────────────
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID,
        (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        'desk_officer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() IN ('super_admin', 'tenant_admin', 'station_manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() IN ('super_admin', 'tenant_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ── 2. DROP DANGEROUS BLANKET POLICY, ADD SCOPED NON-PII TRACKING VIEW ───
DROP POLICY IF EXISTS "Public tracking by awb_number" ON shipments;

CREATE OR REPLACE VIEW public_shipment_tracking AS
    SELECT
        s.awb_number,
        s.type,
        s.status,
        s.pieces,
        s.weight_kg,
        s.flight_number,
        s.flight_date,
        s.delivered_at,
        oh.code  AS origin_code,
        oh.city  AS origin_city,
        dh.code  AS destination_code,
        dh.city  AS destination_city
    FROM shipments s
    JOIN hubs oh ON oh.id = s.origin_hub_id
    JOIN hubs dh ON dh.id = s.destination_hub_id;

GRANT SELECT ON public_shipment_tracking TO anon;
GRANT SELECT ON public_shipment_tracking TO authenticated;

CREATE OR REPLACE FUNCTION track_shipment(p_awb_number TEXT)
RETURNS TABLE (
    awb_number       TEXT,
    type             TEXT,
    status           TEXT,
    pieces           INTEGER,
    weight_kg        NUMERIC,
    flight_number    TEXT,
    flight_date      DATE,
    delivered_at     TIMESTAMPTZ,
    origin_code      TEXT,
    origin_city      TEXT,
    destination_code TEXT,
    destination_city TEXT
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT pst.awb_number, pst.type, pst.status, pst.pieces, pst.weight_kg,
           pst.flight_number, pst.flight_date, pst.delivered_at,
           pst.origin_code, pst.origin_city, pst.destination_code, pst.destination_city
    FROM public_shipment_tracking pst
    WHERE pst.awb_number = p_awb_number;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION track_shipment(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION track_shipment(TEXT) TO authenticated;


-- ── 3. SUBSCRIPTION ENFORCEMENT IN INSERT POLICY ─────────────────────────
DROP POLICY IF EXISTS "Staff can create shipments" ON shipments;

CREATE POLICY "Active subscription required to create shipments"
    ON shipments FOR INSERT
    WITH CHECK (
        tenant_id = current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.tenant_id = current_tenant_id()
              AND s.status IN ('trialing', 'active', 'past_due')
              AND (s.status != 'past_due' OR s.grace_period_end > NOW())
        )
    );

CREATE POLICY "Only managers can delete shipments"
    ON shipments FOR DELETE
    USING (tenant_id = current_tenant_id() AND is_manager_or_above());

DROP POLICY IF EXISTS "Subscriptions visible to tenant admins" ON subscriptions;
CREATE POLICY "Subscriptions visible to tenant members"
    ON subscriptions FOR SELECT
    USING (tenant_id = current_tenant_id());
CREATE POLICY "Subscriptions writable by admins only"
    ON subscriptions FOR ALL
    USING (tenant_id = current_tenant_id() AND is_tenant_admin());


-- ── 4. AWB MONTHLY USAGE COUNTER ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_awb_usage (
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    year_month  VARCHAR(7) NOT NULL,
    awb_count   INTEGER NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, year_month)
);

ALTER TABLE tenant_awb_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AWB usage visible to tenant admins"
    ON tenant_awb_usage FOR SELECT
    USING (tenant_id = current_tenant_id() AND is_manager_or_above());

CREATE OR REPLACE FUNCTION increment_awb_usage()
RETURNS TRIGGER AS $$
DECLARE v_month VARCHAR(7);
BEGIN
    v_month := TO_CHAR(NOW(), 'YYYY-MM');
    INSERT INTO tenant_awb_usage (tenant_id, year_month, awb_count, updated_at)
    VALUES (NEW.tenant_id, v_month, 1, NOW())
    ON CONFLICT (tenant_id, year_month)
    DO UPDATE SET awb_count = tenant_awb_usage.awb_count + 1, updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_awb_usage ON shipments;
CREATE TRIGGER trg_increment_awb_usage
    AFTER INSERT ON shipments FOR EACH ROW
    EXECUTE FUNCTION increment_awb_usage();


-- ── 5. ATOMIC AWB SEQUENCES ───────────────────────────────────────────────
DROP TABLE IF EXISTS hub_awb_counters CASCADE;

CREATE OR REPLACE FUNCTION ensure_hub_awb_sequence(p_hub_code TEXT, p_year TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY'))
RETURNS VOID AS $$
DECLARE v_seq_name TEXT;
BEGIN
    v_seq_name := 'awb_seq_' || lower(regexp_replace(p_hub_code, '[^a-zA-Z0-9]', '_', 'g')) || '_' || p_year;
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START WITH 1 INCREMENT BY 1 NO CYCLE CACHE 1', v_seq_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS generate_next_awb(UUID, UUID);

CREATE OR REPLACE FUNCTION generate_next_awb(p_tenant_id UUID, p_hub_id UUID)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_hub_code TEXT;
    v_year     TEXT;
    v_seq_name TEXT;
    v_next_val BIGINT;
BEGIN
    SELECT code INTO v_hub_code FROM hubs WHERE id = p_hub_id AND tenant_id = p_tenant_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Hub not found or does not belong to this tenant.'; END IF;

    v_year     := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_seq_name := 'awb_seq_' || lower(regexp_replace(v_hub_code, '[^a-zA-Z0-9]', '_', 'g')) || '_' || v_year;

    PERFORM ensure_hub_awb_sequence(v_hub_code, v_year);
    EXECUTE format('SELECT nextval(%L)', v_seq_name) INTO v_next_val;

    RETURN upper(v_hub_code) || '-' || v_year || '-' || LPAD(v_next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_create_hub_sequences()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_hub_awb_sequence(NEW.code, TO_CHAR(CURRENT_DATE, 'YYYY'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_hub_awb_sequence_init ON hubs;
CREATE TRIGGER trg_hub_awb_sequence_init
    AFTER INSERT ON hubs FOR EACH ROW
    EXECUTE FUNCTION trg_create_hub_sequences();


-- ── 6. RATE CARDS TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_cards (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    origin_hub_code        VARCHAR(10),
    destination_hub_code   VARCHAR(10),
    shipment_type          VARCHAR(50) CHECK (shipment_type IS NULL OR shipment_type IN ('air_cargo','express_parcel','excess_baggage','marketing_cargo')),
    rate_per_kg            NUMERIC(10,2) NOT NULL CHECK (rate_per_kg > 0),
    minimum_charge         NUMERIC(10,2) NOT NULL DEFAULT 3500,
    handling_fee_per_piece NUMERIC(10,2) NOT NULL DEFAULT 300,
    security_fee_flat      NUMERIC(10,2) NOT NULL DEFAULT 500,
    peak_surcharge_pct     NUMERIC(5,2)  NOT NULL DEFAULT 0,
    label                  VARCHAR(100)  NOT NULL DEFAULT 'Standard Rate',
    effective_from         DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until        DATE,
    is_active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_by             UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_cards_lookup ON rate_cards
    (tenant_id, origin_hub_code, destination_hub_code, shipment_type, effective_from);

ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rate cards: tenant members read" ON rate_cards FOR SELECT
    USING (tenant_id = current_tenant_id());
CREATE POLICY "Rate cards: managers write" ON rate_cards FOR ALL
    USING (tenant_id = current_tenant_id() AND is_manager_or_above());

CREATE OR REPLACE FUNCTION get_rate_card(p_tenant_id UUID, p_origin TEXT, p_destination TEXT, p_type TEXT DEFAULT NULL)
RETURNS TABLE (rate_per_kg NUMERIC, minimum_charge NUMERIC, handling_fee_per_piece NUMERIC, security_fee_flat NUMERIC, peak_surcharge_pct NUMERIC, label TEXT)
AS $$
BEGIN
    RETURN QUERY
    SELECT rc.rate_per_kg, rc.minimum_charge, rc.handling_fee_per_piece,
           rc.security_fee_flat, rc.peak_surcharge_pct, rc.label
    FROM rate_cards rc
    WHERE rc.tenant_id = p_tenant_id AND rc.is_active = TRUE
      AND rc.effective_from <= CURRENT_DATE
      AND (rc.effective_until IS NULL OR rc.effective_until >= CURRENT_DATE)
      AND (rc.origin_hub_code = p_origin OR rc.origin_hub_code IS NULL)
      AND (rc.destination_hub_code = p_destination OR rc.destination_hub_code IS NULL)
      AND (rc.shipment_type = p_type OR rc.shipment_type IS NULL)
    ORDER BY
        (rc.origin_hub_code IS NOT NULL)::INT DESC,
        (rc.destination_hub_code IS NOT NULL)::INT DESC,
        (rc.shipment_type IS NOT NULL)::INT DESC,
        rc.effective_from DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ── 7. CORPORATE CLIENT CREDIT LEDGER ────────────────────────────────────
CREATE TABLE IF NOT EXISTS corporate_clients (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name   VARCHAR(255) NOT NULL,
    contact_name   VARCHAR(255),
    contact_phone  VARCHAR(50),
    contact_email  VARCHAR(255),
    credit_limit   NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    payment_terms  INTEGER NOT NULL DEFAULT 30,
    notes          TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Corporate clients scoped to tenant" ON corporate_clients FOR ALL
    USING (tenant_id = current_tenant_id());

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL;

-- Audit log policy
DROP POLICY IF EXISTS "Audit log read" ON audit_logs;
CREATE POLICY "Audit logs: managers read only" ON audit_logs FOR SELECT
    USING (tenant_id = current_tenant_id() AND is_manager_or_above());
