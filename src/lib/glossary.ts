/**
 * Plain-language glossary.
 *
 * The UI convention is "plain label first, industry term in parentheses", with a
 * one-sentence `definition` surfaced through <InfoHint term="…" />. This map is
 * the single source of truth for both.
 */
export interface GlossaryEntry {
  /** Everyday label shown as the primary text. */
  plain: string;
  /** The air-cargo / SaaS term trained staff expect. */
  term: string;
  /** One sentence, no jargon — shown in the InfoHint popover. */
  definition: string;
}

export const GLOSSARY = {
  awb: {
    plain: 'Tracking number',
    term: 'Air Waybill (AWB)',
    definition:
      'The unique number for this shipment. The sender and recipient use it to track and collect it.',
  },
  sender: {
    plain: 'Sender',
    term: 'Shipper',
    definition: 'The person or company sending the goods.',
  },
  recipient: {
    plain: 'Recipient',
    term: 'Consignee',
    definition: 'The person or company receiving the goods at the destination.',
  },
  grossWeight: {
    plain: 'Weight',
    term: 'Gross weight',
    definition: 'What the shipment actually weighs on the scale.',
  },
  volumetricWeight: {
    plain: 'Size-based weight',
    term: 'Volumetric weight',
    definition:
      'Large light items are billed by the space they take up: length × width × height ÷ 6000.',
  },
  chargeableWeight: {
    plain: 'Billed weight',
    term: 'Chargeable weight',
    definition:
      'Whichever is higher — the scale weight or the size-based weight. This is what you pay for.',
  },
  declaredValue: {
    plain: 'Item value',
    term: 'Declared value',
    definition: 'What the goods are worth. Used only to work out optional insurance.',
  },
  securityFee: {
    plain: 'Security screening',
    term: 'AVSEC screening',
    definition: 'Mandatory airport security scan of the cargo.',
  },
  handlingFee: {
    plain: 'Handling & tagging',
    term: 'Ground handling',
    definition: 'Labelling and moving the shipment on the ground.',
  },
  freightCharge: {
    plain: 'Air freight',
    term: 'Freight charge',
    definition: 'The cost of flying the shipment.',
  },
  manifest: {
    plain: 'Flight load list',
    term: 'Manifest',
    definition: 'The list of every shipment loaded on one flight.',
  },
  pickupPin: {
    plain: 'Collection PIN',
    term: 'Pickup PIN',
    definition: 'The 4-digit code the recipient shows to collect the shipment.',
  },
  payloadCapacity: {
    plain: 'Weight limit',
    term: 'Payload capacity',
    definition: 'The maximum cargo weight the aircraft can carry.',
  },
  discrepancy: {
    plain: 'Weight difference',
    term: 'Discrepancy',
    definition:
      'The gap between the weight recorded at the desk and the weight measured at the aircraft.',
  },
  supplementaryDebit: {
    plain: 'Extra charge',
    term: 'Supplementary debit',
    definition: 'An extra bill raised when the real weight is higher than what was paid for.',
  },
  gracePeriod: {
    plain: 'Grace period',
    term: '72-hour grace period',
    definition: 'The time you have to fix a failed renewal payment before access is paused.',
  },
  awbPrefix: {
    plain: 'Tracking number prefix',
    term: 'AWB prefix',
    definition: 'The letters at the start of every tracking number from this hub, e.g. LOS-.',
  },
  peakSurcharge: {
    plain: 'Busy-period surcharge',
    term: 'Peak surcharge',
    definition: 'An extra percentage added to the price during busy seasons.',
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;

/** Everyday label, e.g. "Recipient". */
export const plainLabel = (key: GlossaryKey): string => GLOSSARY[key].plain;

/** Everyday label with the industry term appended, e.g. "Recipient (consignee)". */
export const termLabel = (key: GlossaryKey): string =>
  `${GLOSSARY[key].plain} (${GLOSSARY[key].term.toLowerCase()})`;

/** One-sentence plain definition. */
export const definitionOf = (key: GlossaryKey): string => GLOSSARY[key].definition;
