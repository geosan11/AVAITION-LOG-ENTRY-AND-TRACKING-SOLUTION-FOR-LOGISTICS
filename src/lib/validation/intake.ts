export interface IntakeFormData {
  destinationCode: string;
  shipmentType: string;
  flightNumber: string;
  senderName: string;
  senderPhone: string;
  consigneeName: string;
  consigneePhone: string;
  pieces: number;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
  contentType: string;
}

export interface IntakeValidationErrors {
  destinationCode?: string;
  senderName?: string;
  senderPhone?: string;
  consigneeName?: string;
  consigneePhone?: string;
  pieces?: string;
  weightKg?: string;
  contentType?: string;
  declaredValue?: string;
}

export const NIGERIAN_PHONE_REGEX = /^(?:(?:\+?234)|0)([789][01]\d{8})$/;

export function normalizeNigerianPhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

export function isValidNigerianPhone(phone: string): boolean {
  const clean = normalizeNigerianPhone(phone);
  return NIGERIAN_PHONE_REGEX.test(clean);
}

export function validateIntakeForm(data: IntakeFormData): {
  isValid: boolean;
  errors: IntakeValidationErrors;
} {
  const errors: IntakeValidationErrors = {};

  if (!data.destinationCode || data.destinationCode.trim().length === 0) {
    errors.destinationCode = 'Choose a destination';
  }

  if (!data.senderName || data.senderName.trim().length < 3) {
    errors.senderName = 'Enter the sender name';
  }

  if (!data.senderPhone || !isValidNigerianPhone(data.senderPhone)) {
    errors.senderPhone = 'Enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)';
  }

  if (!data.consigneeName || data.consigneeName.trim().length < 3) {
    errors.consigneeName = 'Enter the recipient name';
  }

  if (!data.consigneePhone || !isValidNigerianPhone(data.consigneePhone)) {
    errors.consigneePhone = 'Enter a valid phone number for the recipient';
  }

  if (!data.pieces || data.pieces < 1) {
    errors.pieces = 'Enter at least 1 item';
  } else if (!Number.isInteger(data.pieces)) {
    errors.pieces = 'Number of items must be a whole number';
  } else if (data.pieces > 999) {
    errors.pieces = 'Maximum 999 items';
  }

  if (!data.weightKg || data.weightKg <= 0) {
    errors.weightKg = 'Enter a weight above 0 kg';
  } else if (data.weightKg > 5000) {
    errors.weightKg = 'Maximum weight is 5,000 kg';
  }

  if (!data.contentType || data.contentType.trim().length < 2) {
    errors.contentType = 'Say what is in the shipment';
  }

  if (data.declaredValue !== undefined && data.declaredValue < 0) {
    errors.declaredValue = 'Value cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
