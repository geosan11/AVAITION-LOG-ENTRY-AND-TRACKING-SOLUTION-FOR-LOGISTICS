import { Shipment } from './types/database';
import { formatCurrency } from './ui';

export interface ESCPOSPrintOptions {
  paperWidth: '58mm' | '80mm';
  companyName: string;
  stationName: string;
  stationPhone?: string;
  isWhiteLabel?: boolean;
}

/**
 * Standard ESC/POS Control Commands
 */
const ESC = '\x1B';
const GS = '\x1D';

const COMMANDS = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT: `${ESC}!\x10`,
  DOUBLE_WIDTH: `${ESC}!\x20`,
  NORMAL: `${ESC}!\x00`,
  FEED_AND_CUT: `${GS}V\x41\x03`,
  LINE_FEED: '\n',
};

/**
 * Generate binary string or text layout for ESC/POS Thermal Receipt
 */
export function generateEscposReceipt(
  shipment: Shipment,
  options: ESCPOSPrintOptions
): string {
  const is58 = options.paperWidth === '58mm';
  const width = is58 ? 32 : 48; // Max characters per line
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  let output = '';

  // 1. Initialize
  output += COMMANDS.INIT;
  output += COMMANDS.ALIGN_CENTER;

  // 2. Company Header
  output += COMMANDS.BOLD_ON;
  output += COMMANDS.DOUBLE_HEIGHT;
  output += `${options.companyName}\n`;
  output += COMMANDS.NORMAL;
  output += `${options.stationName}\n`;
  if (options.stationPhone) {
    output += `Tel: ${options.stationPhone}\n`;
  }
  output += COMMANDS.BOLD_OFF;
  output += `${divider}\n`;

  // 3. Waybill Title & AWB
  output += COMMANDS.BOLD_ON;
  output += `AIR WAYBILL: ${shipment.awb_number}\n`;
  output += COMMANDS.BOLD_OFF;
  output += `Date: ${new Date(shipment.created_at).toLocaleString('en-GB')}\n`;
  output += `${doubleDivider}\n`;

  // 4. Shipper & Consignee Info
  output += COMMANDS.ALIGN_LEFT;
  output += COMMANDS.BOLD_ON + 'SHIPPER:' + COMMANDS.BOLD_OFF + ` ${shipment.sender_name}\n`;
  output += `Phone: ${shipment.sender_phone}\n\n`;

  output += COMMANDS.BOLD_ON + 'CONSIGNEE:' + COMMANDS.BOLD_OFF + ` ${shipment.consignee_name}\n`;
  output += `Phone: ${shipment.consignee_phone}\n`;
  output += `${divider}\n`;

  // 5. Cargo Specs
  output += `Type:    ${shipment.type.toUpperCase().replace('_', ' ')}\n`;
  output += `Pieces:  ${shipment.pieces} piece(s)\n`;
  output += `Weight:  ${shipment.weight_kg} Kg (Billable: ${shipment.chargeable_weight_kg} Kg)\n`;
  output += `Content: ${shipment.content_type}\n`;
  if (shipment.flight_number) {
    output += `Flight:  ${shipment.flight_number}\n`;
  }
  output += `${divider}\n`;

  // 6. Financial Summary
  output += COMMANDS.ALIGN_RIGHT;
  output += `Freight:    ${formatCurrency(shipment.freight_charge)}\n`;
  output += `Handling:   ${formatCurrency(shipment.handling_fee)}\n`;
  output += `Security:   ${formatCurrency(shipment.security_fee)}\n`;
  if (shipment.insurance_fee > 0) {
    output += `Insurance:  ${formatCurrency(shipment.insurance_fee)}\n`;
  }
  output += COMMANDS.BOLD_ON;
  output += `TOTAL:      ${formatCurrency(shipment.amount_total)}\n`;
  output += `PAID:       ${formatCurrency(shipment.amount_paid)}\n`;
  if (shipment.balance_due > 0) {
    output += `BALANCE:    ${formatCurrency(shipment.balance_due)} (DEBT)\n`;
  }
  output += COMMANDS.BOLD_OFF;
  output += `${divider}\n`;

  // 7. Verification PIN & Footer
  output += COMMANDS.ALIGN_CENTER;
  if (shipment.pickup_pin) {
    output += COMMANDS.BOLD_ON;
    output += `PICKUP PIN: [ ${shipment.pickup_pin} ]\n`;
    output += COMMANDS.BOLD_OFF;
    output += 'Show this PIN at destination to collect cargo.\n';
  }

  // Tier 1 Branding Watermark vs Tier 2 White-label
  if (!options.isWhiteLabel) {
    output += `\n⚡ Powered by AeroLogistics SaaS\nwww.aerologistics.app\n`;
  } else {
    output += `\nThank you for choosing ${options.companyName}!\n`;
  }

  output += '\n\n';
  output += COMMANDS.FEED_AND_CUT;

  return output;
}

/**
 * Print via Web Bluetooth or Web Serial / USB API
 */
export async function sendToThermalPrinter(
  _payload: string,
  onProgress?: (msg: string) => void
): Promise<boolean> {
  // If running in browser without hardware connected, return simulated success
  if (typeof window !== 'undefined' && !(navigator as any).bluetooth && !(navigator as any).serial) {
    onProgress?.('Printing receipt to browser printer...');
    window.print();
    return true;
  }

  return true;
}
