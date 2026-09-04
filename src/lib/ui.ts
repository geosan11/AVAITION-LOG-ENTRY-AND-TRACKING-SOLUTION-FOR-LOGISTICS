/**
 * Standardized 5-step Icon Size Scale
 * Restricts icon sizes across the entire platform to prevent random sizing.
 */
export const ICON = {
  xs: 12, // Badges, compact inline metadata, chips
  sm: 14, // Secondary actions, table rows, input prefixes
  md: 16, // Standard buttons, card headers, tabs
  lg: 20, // Section headers, primary actions, nav items
  xl: 24, // Hero headers, modal icons, empty state illustrations
} as const;

export type IconSize = typeof ICON[keyof typeof ICON];

/**
 * Standard Aviation Airports / Station Codes (Default Nigerian Flight Hubs)
 */
export const AIRPORT_HUBS = [
  { code: 'LOS', name: 'Murtala Muhammed Airport', city: 'Lagos', state: 'Lagos' },
  { code: 'ABV', name: 'Nnamdi Azikiwe Int Airport', city: 'Abuja', state: 'FCT' },
  { code: 'PHC', name: 'Port Harcourt Int Airport', city: 'Port Harcourt', state: 'Rivers' },
  { code: 'KAN', name: 'Mallam Aminu Kano Int Airport', city: 'Kano', state: 'Kano' },
  { code: 'ENU', name: 'Akanu Ibiam Int Airport', city: 'Enugu', state: 'Enugu' },
  { code: 'BNI', name: 'Benin Airport', city: 'Benin City', state: 'Edo' },
  { code: 'OWR', name: 'Sam Mbakwe Cargo Airport', city: 'Owerri', state: 'Imo' },
  { code: 'ASB', name: 'Asaba Int Airport', city: 'Asaba', state: 'Delta' },
  { code: 'ILR', name: 'Ilorin Int Airport', city: 'Ilorin', state: 'Kwara' },
  { code: 'CBQ', name: 'Margaret Ekpo Int Airport', city: 'Calabar', state: 'Cross River' },
  { code: 'QUO', name: 'Victor Attah Int Airport', city: 'Uyo', state: 'Akwa Ibom' },
  { code: 'YOL', name: 'Yola Airport', city: 'Yola', state: 'Adamawa' },
] as const;

/**
 * Format currency with Naira (₦) or USD ($) symbol
 */
export function formatCurrency(amount: number, currency: 'NGN' | 'USD' = 'NGN'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
  return '₦' + new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
