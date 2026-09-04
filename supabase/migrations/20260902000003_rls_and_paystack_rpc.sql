-- ============================================================================
-- Migration 03: Row-Level Security (RLS) & Stored Procedures (RPC)
-- ============================================================================

-- Helper function to extract user tenant_id
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM user_profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifest_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE eod_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ── 1. TENANTS POLICIES ───────────────────────────────────────────────────
CREATE POLICY "Tenants are visible to their members"
    ON tenants FOR SELECT
    USING (id = current_tenant_id());

CREATE POLICY "Super admins can update tenants"
    ON tenants FOR UPDATE
    USING (id = current_tenant_id());

-- ── 2. SUBSCRIPTIONS POLICIES ─────────────────────────────────────────────
CREATE POLICY "Subscriptions visible to tenant admins"
    ON subscriptions FOR SELECT
    USING (tenant_id = current_tenant_id());

-- ── 3. HUBS POLICIES ──────────────────────────────────────────────────────
CREATE POLICY "Hubs visible to tenant members"
    ON hubs FOR SELECT
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Hubs manageable by tenant admins"
    ON hubs FOR ALL
    USING (tenant_id = current_tenant_id());

-- ── 4. USER PROFILES POLICIES ─────────────────────────────────────────────
CREATE POLICY "Profiles visible within same tenant"
    ON user_profiles FOR SELECT
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Admins manage profiles in their tenant"
    ON user_profiles FOR ALL
    USING (tenant_id = current_tenant_id());

-- ── 5. SHIPMENTS POLICIES ─────────────────────────────────────────────────
CREATE POLICY "Shipments visible to tenant members"
    ON shipments FOR SELECT
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Staff can create shipments"
    ON shipments FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Staff can update shipments"
    ON shipments FOR UPDATE
    USING (tenant_id = current_tenant_id());

-- Public Tracking Policy (Allows consignees to track by AWB number)
CREATE POLICY "Public tracking by awb_number"
    ON shipments FOR SELECT
    USING (TRUE);

-- ── 6. FLIGHT MANIFESTS POLICIES ──────────────────────────────────────────
CREATE POLICY "Manifests visible to tenant members"
    ON flight_manifests FOR ALL
    USING (tenant_id = current_tenant_id());

-- ── 7. PAYMENTS & SETTLEMENTS POLICIES ────────────────────────────────────
CREATE POLICY "Payments scoped to tenant"
    ON payments FOR ALL
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Settlements scoped to tenant"
    ON eod_settlements FOR ALL
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- RPC: Atomic Sequential AWB Generation per Hub
-- ============================================================================
CREATE TABLE IF NOT EXISTS hub_awb_counters (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    year_code VARCHAR(4) NOT NULL,
    current_counter INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, hub_id, year_code)
);

CREATE OR REPLACE FUNCTION generate_next_awb(
    p_tenant_id UUID,
    p_hub_id UUID
)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_hub_code VARCHAR(10);
    v_awb_prefix VARCHAR(20);
    v_year_code VARCHAR(4);
    v_next_val INTEGER;
    v_final_awb VARCHAR(100);
BEGIN
    -- Fetch hub metadata
    SELECT code, awb_prefix INTO v_hub_code, v_awb_prefix
    FROM hubs
    WHERE id = p_hub_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Station Hub not found for this tenant.';
    END IF;

    v_year_code := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Atomically lock and increment counter
    INSERT INTO hub_awb_counters (tenant_id, hub_id, year_code, current_counter, updated_at)
    VALUES (p_tenant_id, p_hub_id, v_year_code, 1, NOW())
    ON CONFLICT (tenant_id, hub_id, year_code)
    DO UPDATE SET 
        current_counter = hub_awb_counters.current_counter + 1,
        updated_at = NOW()
    RETURNING current_counter INTO v_next_val;

    -- Format: e.g. LOS-2026-000492
    v_final_awb := v_hub_code || '-' || v_year_code || '-' || LPAD(v_next_val::TEXT, 6, '0');
    
    RETURN v_final_awb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
