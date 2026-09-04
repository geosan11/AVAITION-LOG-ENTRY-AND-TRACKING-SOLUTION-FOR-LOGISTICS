export type TenantTier = 'starter' | 'growth' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';
export type UserRole = 'super_admin' | 'tenant_admin' | 'station_manager' | 'desk_officer' | 'ramp_agent' | 'accountant';
export type ShipmentType = 'air_cargo' | 'express_parcel' | 'excess_baggage' | 'marketing_cargo';
export type ShipmentStatus = 'draft' | 'received' | 'security_cleared' | 'manifested' | 'departed' | 'arrived' | 'delivered' | 'returned';
export type PaymentStatus = 'paid' | 'partial' | 'pending_transfer' | 'debt' | 'refunded';
export type PaymentMode = 'Cash' | 'POS' | 'Transfer' | 'Wallet' | 'Debt Settlement';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: TenantTier;
  logo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  white_label_enabled: boolean;
  custom_sms_sender_id?: string | null;
  receipt_header?: string | null;
  receipt_footer?: string | null;
  max_hubs: number;
  max_staff: number;
  max_monthly_awb: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  tier: TenantTier;
  billing_cycle: 'monthly' | 'annual';
  status: SubscriptionStatus;
  paystack_customer_code?: string | null;
  paystack_subscription_code?: string | null;
  paystack_plan_code?: string | null;
  trial_start_at?: string | null;
  trial_end_at?: string | null;
  current_period_start: string;
  current_period_end: string;
  grace_period_end?: string | null;
  cancelled_at?: string | null;
  amount_paid: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Hub {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  station_type: 'airport_cargo_desk' | 'city_dropoff_hub' | 'ramp_transit_office';
  awb_prefix: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  assigned_hub_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  tenant_id: string;
  origin_hub_id: string;
  destination_hub_id: string;
  created_by?: string | null;
  awb_number: string;
  type: ShipmentType;
  airline_code?: string | null;
  flight_number?: string | null;
  flight_date?: string | null;
  sender_name: string;
  sender_phone: string;
  sender_email?: string | null;
  consignee_name: string;
  consignee_phone: string;
  consignee_address?: string | null;
  pieces: number;
  weight_kg: number;
  volumetric_weight_kg?: number | null;
  chargeable_weight_kg: number;
  declared_value: number;
  content_type: string;
  remarks?: string | null;
  freight_charge: number;
  handling_fee: number;
  security_fee: number;
  insurance_fee: number;
  amount_total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  status: ShipmentStatus;
  pickup_pin?: string | null;
  security_screened_by?: string | null;
  security_screened_at?: string | null;
  delivered_at?: string | null;
  proof_of_delivery_signature?: string | null;
  proof_of_delivery_recipient?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlightManifest {
  id: string;
  tenant_id: string;
  manifest_number: string;
  origin_hub_id: string;
  destination_hub_id: string;
  airline_code: string;
  flight_number: string;
  departure_time: string;
  total_awbs: number;
  total_pieces: number;
  total_weight_kg: number;
  status: 'open' | 'locked' | 'airborne' | 'landed' | 'closed';
  created_by?: string | null;
  dispatched_by?: string | null;
  dispatched_at?: string | null;
  received_by?: string | null;
  received_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  shipment_id?: string | null;
  hub_id: string;
  received_by: string;
  payment_mode: PaymentMode;
  amount: number;
  pos_terminal_id?: string | null;
  pos_reference?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  transfer_reference?: string | null;
  narration?: string | null;
  is_confirmed: boolean;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  created_at: string;
}
