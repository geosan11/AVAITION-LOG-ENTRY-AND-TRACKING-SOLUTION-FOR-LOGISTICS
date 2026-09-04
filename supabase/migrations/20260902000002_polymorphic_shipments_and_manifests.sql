-- ============================================================================
-- Migration 02: Polymorphic Shipments, Flight Manifests & Financials
-- ============================================================================

-- 1. Polymorphic Shipments Table (Solves the 4-table fragmentation problem)
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    origin_hub_id UUID NOT NULL REFERENCES hubs(id),
    destination_hub_id UUID NOT NULL REFERENCES hubs(id),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Sequential Air Waybill Identifier
    awb_number VARCHAR(100) NOT NULL,
    
    -- Polymorphic Category Discriminator
    type VARCHAR(50) NOT NULL DEFAULT 'air_cargo' 
        CHECK (type IN ('air_cargo', 'express_parcel', 'excess_baggage', 'marketing_cargo')),
    
    -- Aviation & Flight Metadata
    airline_code VARCHAR(10), -- e.g. N2, W3, Q9, VK
    flight_number VARCHAR(20), -- e.g. VK-204
    flight_date DATE,
    
    -- Shipper / Consignee Contacts
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    sender_email VARCHAR(255),
    
    consignee_name VARCHAR(255) NOT NULL,
    consignee_phone VARCHAR(50) NOT NULL,
    consignee_address TEXT,
    
    -- Cargo Specifications
    pieces INTEGER NOT NULL DEFAULT 1 CHECK (pieces > 0),
    weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (weight_kg >= 0),
    volumetric_weight_kg NUMERIC(10, 2) DEFAULT 0.00,
    chargeable_weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    declared_value NUMERIC(15, 2) DEFAULT 0.00,
    content_type VARCHAR(100) NOT NULL DEFAULT 'General Cargo',
    remarks TEXT,
    
    -- Financials & Pricing Calculation
    freight_charge NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    handling_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    security_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    insurance_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(15, 2) GENERATED ALWAYS AS (amount_total - amount_paid) STORED,
    
    payment_status VARCHAR(50) NOT NULL DEFAULT 'paid' 
        CHECK (payment_status IN ('paid', 'partial', 'pending_transfer', 'debt', 'refunded')),
    
    -- Tracking & Operational State Machine
    status VARCHAR(50) NOT NULL DEFAULT 'received' 
        CHECK (status IN ('draft', 'received', 'security_cleared', 'manifested', 'departed', 'arrived', 'delivered', 'returned')),
    
    -- Security & Delivery Verification
    pickup_pin VARCHAR(10),
    security_screened_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    security_screened_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    proof_of_delivery_signature TEXT,
    proof_of_delivery_recipient VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (tenant_id, awb_number)
);

-- 2. Flight Manifests Table (Batching cargo onto specific departures)
CREATE TABLE IF NOT EXISTS flight_manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    manifest_number VARCHAR(100) NOT NULL,
    
    origin_hub_id UUID NOT NULL REFERENCES hubs(id),
    destination_hub_id UUID NOT NULL REFERENCES hubs(id),
    
    airline_code VARCHAR(10) NOT NULL,
    flight_number VARCHAR(50) NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    
    total_awbs INTEGER NOT NULL DEFAULT 0,
    total_pieces INTEGER NOT NULL DEFAULT 0,
    total_weight_kg NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    status VARCHAR(50) NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'locked', 'airborne', 'landed', 'closed')),
        
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    dispatched_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ,
    received_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    received_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (tenant_id, manifest_number)
);

-- 3. Manifest Item Association
CREATE TABLE IF NOT EXISTS manifest_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_id UUID NOT NULL REFERENCES flight_manifests(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scanned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    UNIQUE (manifest_id, shipment_id)
);

-- 4. Payments Ledger Table (Split Payments & Cashier Attribution)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    hub_id UUID NOT NULL REFERENCES hubs(id),
    received_by UUID NOT NULL REFERENCES user_profiles(id),
    
    payment_mode VARCHAR(50) NOT NULL 
        CHECK (payment_mode IN ('Cash', 'POS', 'Transfer', 'Wallet', 'Debt Settlement')),
    
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    pos_terminal_id VARCHAR(100),
    pos_reference VARCHAR(100),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    transfer_reference VARCHAR(100),
    narration TEXT,
    
    is_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    confirmed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. End-of-Day Cashier Settlements Table
CREATE TABLE IF NOT EXISTS eod_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES hubs(id),
    cashier_id UUID NOT NULL REFERENCES user_profiles(id),
    supervisor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Calculated System Totals
    system_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    system_pos NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    system_transfer NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    system_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Actual Physical Counted Amounts
    physical_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    pos_slip_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    bank_statement_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Discrepancy
    discrepancy_amount NUMERIC(15, 2) GENERATED ALWAYS AS (
        (physical_cash + pos_slip_total + bank_statement_total) - system_total
    ) STORED,
    discrepancy_reason TEXT,
    
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' 
        CHECK (status IN ('submitted', 'verified', 'disputed', 'closed')),
        
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit Logs Table (Tamper-evident Security Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'SHIPMENT_CREATED', 'PAYMENT_RECEIVED', 'MANIFEST_DISPATCHED'
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
