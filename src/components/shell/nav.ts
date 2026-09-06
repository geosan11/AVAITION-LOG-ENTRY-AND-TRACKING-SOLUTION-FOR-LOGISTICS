export type ViewId =
  | 'terminal'
  | 'manifest'
  | 'scanner'
  | 'tracking'
  | 'audit'
  | 'corporate'
  | 'admin'
  | 'tiers'
  | 'onboarding';

export interface NavItem {
  id: ViewId;
  label: string;
  /** Material Symbols glyph — kept distinct from every in-screen section icon. */
  icon: string;
  group: 'operations' | 'commercial' | 'platform';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'terminal',   label: 'Desk Terminal',  icon: 'point_of_sale',     group: 'operations' },
  { id: 'manifest',   label: 'Manifest',       icon: 'assignment',        group: 'operations' },
  { id: 'scanner',    label: 'Ramp Scan',      icon: 'barcode_scanner',   group: 'operations' },
  { id: 'tracking',   label: 'Cargo Tracking', icon: 'radar',             group: 'operations' },
  { id: 'audit',      label: 'Weight Audit',   icon: 'scale',             group: 'operations' },
  { id: 'corporate',  label: 'B2B Ledger',     icon: 'account_balance',   group: 'commercial' },
  { id: 'admin',      label: 'Rate Cards',     icon: 'sell',              group: 'commercial' },
  { id: 'tiers',      label: 'SaaS Tiers',     icon: 'workspace_premium', group: 'platform' },
  { id: 'onboarding', label: 'Onboarding',     icon: 'rocket_launch',     group: 'platform' },
];

export const GROUP_LABELS: Record<NavItem['group'], string> = {
  operations: 'RAMP OPERATIONS',
  commercial: 'COMMERCIAL',
  platform: 'PLATFORM',
};

export interface ViewMeta {
  title: string;
  subtitle: string;
  breadcrumb: string;
}

export const VIEW_META: Record<ViewId, ViewMeta> = {
  terminal: {
    title: 'Air Cargo Intake Desk',
    subtitle: 'AIR WAYBILL CREATION · VOLUMETRIC AUDIT & INSTANT MANIFESTING',
    breadcrumb: 'TERMINAL MMA2 CARGO BAY A · INTAKE DESK #04',
  },
  manifest: {
    title: 'Flight Manifest Builder',
    subtitle: 'BATCH CARGO · LOCK & DISPATCH · BULK STATUS TRANSITIONS',
    breadcrumb: 'TERMINAL MMA2 · DISPATCH CONTROL',
  },
  scanner: {
    title: 'Ramp Barcode Scanner',
    subtitle: 'TARMAC AWB CAPTURE · OFFLINE BATCH STATUS UPDATES',
    breadcrumb: 'TERMINAL MMA2 · RAMP APRON',
  },
  tracking: {
    title: 'Cargo Tracking Portal',
    subtitle: 'LIVE FLIGHT TRANSIT STATUS · ARRIVAL VERIFICATION',
    breadcrumb: 'PUBLIC · CONSIGNEE SELF-SERVICE',
  },
  audit: {
    title: 'Ramp Weight Audit',
    subtitle: 'SCALE RECONCILIATION · REVENUE RECOVERY ENGINE',
    breadcrumb: 'TERMINAL MMA2 · AIRCRAFT HOLD',
  },
  corporate: {
    title: 'B2B Corporate Ledger',
    subtitle: 'CREDIT TERMS · MONTHLY STATEMENTS · CREDIT HOLDS',
    breadcrumb: 'HQ · ACCOUNTS RECEIVABLE',
  },
  admin: {
    title: 'Rate Card Management',
    subtitle: 'FREIGHT TARIFFS · ROUTE OVERRIDES · SURCHARGES',
    breadcrumb: 'HQ · REVENUE ADMIN',
  },
  tiers: {
    title: 'SaaS Subscription Tiers',
    subtitle: 'PAYSTACK LIFECYCLE · RLS-ENFORCED PLAN LIMITS',
    breadcrumb: 'PLATFORM · BILLING',
  },
  onboarding: {
    title: 'Tenant Onboarding',
    subtitle: 'FIRST-RUN SETUP · COMPANY · HUB · RATES · TEAM',
    breadcrumb: 'PLATFORM · PROVISIONING',
  },
};
