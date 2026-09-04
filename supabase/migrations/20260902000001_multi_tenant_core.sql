-- ============================================================================
-- Migration 01: Multi-Tenant Core, Subscriptions, Hubs & User Profiles
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tenants Table (Isolated Logistics Operators)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'enterprise')),
    logo_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    
    -- Branding Settings
    white_label_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    custom_sms_sender_id VARCHAR(11) DEFAULT 'CARGO-ALERT',
    receipt_header TEXT,
    receipt_footer TEXT,
    
    -- Active Limits
    max_hubs INTEGER NOT NULL DEFAULT 1,
    max_staff INTEGER NOT NULL DEFAULT 3,
    max_monthly_awb INTEGER NOT NULL DEFAULT 500,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Subscriptions Table (Paystack Automation & Lifecycle State Machine)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('starter', 'growth', 'enterprise')),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    
    -- State Machine: trialing -> active -> past_due -> suspended -> cancelled
    status VARCHAR(50) NOT NULL DEFAULT 'trialing' 
        CHECK (status IN ('trialing', 'active', 'past_due', 'suspended', 'cancelled')),
    
    -- Paystack Codes
    paystack_customer_code VARCHAR(100),
    paystack_subscription_code VARCHAR(100),
    paystack_plan_code VARCHAR(100),
    paystack_authorization_code VARCHAR(100),
    
    -- Lifecycle Timestamps
    trial_start_at TIMESTAMPTZ DEFAULT NOW(),
    trial_end_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    grace_period_end TIMESTAMPTZ, -- Set to 72 hours upon payment failure
    cancelled_at TIMESTAMPTZ,
    
    amount_paid NUMERIC(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'NGN',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Hubs / Airport Stations Table
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL, -- Airport code e.g. LOS, ABV, PHC
    name VARCHAR(255) NOT NULL, -- e.g. Murtala Muhammed Cargo Station
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    station_type VARCHAR(50) NOT NULL DEFAULT 'airport_cargo_desk' 
        CHECK (station_type IN ('airport_cargo_desk', 'city_dropoff_hub', 'ramp_transit_office')),
    awb_prefix VARCHAR(20) NOT NULL DEFAULT 'AWB',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (tenant_id, code)
);

-- 4. User Profiles Table (Tenant-Scoped RBAC)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL,
    
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- RBAC Roles
    role VARCHAR(50) NOT NULL DEFAULT 'desk_officer' 
        CHECK (role IN ('super_admin', 'tenant_admin', 'station_manager', 'desk_officer', 'ramp_agent', 'accountant')),
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
