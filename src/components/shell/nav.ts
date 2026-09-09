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
  group: 'daily' | 'billing' | 'setup';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'terminal',   label: 'New shipment',   icon: 'point_of_sale',     group: 'daily' },
  { id: 'manifest',   label: 'Flights',        icon: 'assignment',        group: 'daily' },
  { id: 'scanner',    label: 'Scan cargo',     icon: 'barcode_scanner',   group: 'daily' },
  { id: 'tracking',   label: 'Track shipment', icon: 'radar',             group: 'daily' },
  { id: 'audit',      label: 'Weight check',   icon: 'scale',             group: 'daily' },
  { id: 'corporate',  label: 'Business accounts', icon: 'account_balance', group: 'billing' },
  { id: 'admin',      label: 'Pricing',        icon: 'sell',              group: 'billing' },
  { id: 'tiers',      label: 'Plans & billing', icon: 'workspace_premium', group: 'billing' },
  { id: 'onboarding', label: 'Setup guide',    icon: 'rocket_launch',     group: 'setup' },
];

export const GROUP_LABELS: Record<NavItem['group'], string> = {
  daily: 'DAILY WORK',
  billing: 'BILLING',
  setup: 'SETUP',
};

export interface ViewMeta {
  title: string;
  /** One plain sentence — shown under the title on every screen. */
  subtitle: string;
}

export const VIEW_META: Record<ViewId, ViewMeta> = {
  terminal: {
    title: 'New shipment',
    subtitle: 'Take in a shipment, check its size and price, and get a tracking number.',
  },
  manifest: {
    title: 'Flights & loading',
    subtitle: 'Add shipments to a flight, then lock and send it off.',
  },
  scanner: {
    title: 'Scan cargo',
    subtitle: 'Scan shipment barcodes to move them to the next step. Works offline.',
  },
  tracking: {
    title: 'Track a shipment',
    subtitle: 'Enter a tracking number to see where a shipment is.',
  },
  audit: {
    title: 'Weight check',
    subtitle: 'Compare the weight measured at the aircraft with the weight recorded at the desk.',
  },
  corporate: {
    title: 'Business accounts',
    subtitle: 'Set credit limits, send monthly statements, and put accounts on hold.',
  },
  admin: {
    title: 'Pricing',
    subtitle: 'Set the price per kilogram for each route.',
  },
  tiers: {
    title: 'Plans & billing',
    subtitle: 'Choose a plan. Billed through Paystack.',
  },
  onboarding: {
    title: 'Setup guide',
    subtitle: 'Add your company, first location, prices, and team.',
  },
};
