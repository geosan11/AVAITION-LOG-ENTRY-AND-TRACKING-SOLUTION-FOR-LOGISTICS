import { supabase } from "./supabase";

export interface PricingInput {
  tenantId: string;
  originCode: string;
  destinationCode: string;
  actualWeightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  pieces: number;
  shipmentType?: string;
  declaredValue?: number;
}

export interface PricingBreakdown {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  baseRatePerKg: number;
  peakSurchargePct: number;
  freightCharge: number;
  handlingFee: number;
  securityFee: number;
  insuranceFee: number;
  amountTotal: number;
  rateLabel: string;
}

// ─── Fallback rates used ONLY if no rate card exists in DB yet ────────────
const FALLBACK_RATES: Record<string, number> = {
  "LOS-ABV": 450, "LOS-PHC": 500, "LOS-KAN": 550,
  "LOS-ENU": 520, "LOS-BNI": 400, "ABV-LOS": 450,
  "ABV-PHC": 500, "ABV-KAN": 420, DEFAULT: 500,
};

export function calculateVolumetricWeight(l = 0, w = 0, h = 0): number {
  if (!l || !w || !h) return 0;
  return Math.round(((l * w * h) / 6000) * 100) / 100;
}

/** Fetch rate card from DB; falls back to hardcoded defaults if none exist */
export async function fetchRateCard(
  tenantId: string,
  originCode: string,
  destinationCode: string,
  shipmentType?: string
): Promise<{
  rate_per_kg: number;
  minimum_charge: number;
  handling_fee_per_piece: number;
  security_fee_flat: number;
  peak_surcharge_pct: number;
  label: string;
}> {
  const { data } = await supabase.rpc("get_rate_card", {
    p_tenant_id:   tenantId,
    p_origin:      originCode,
    p_destination: destinationCode,
    p_type:        shipmentType ?? null,
  });

  if (data && data.length > 0) return data[0];

  // Fallback: return sensible defaults so the intake terminal always works
  const key = `${originCode}-${destinationCode}`;
  return {
    rate_per_kg:            FALLBACK_RATES[key] ?? FALLBACK_RATES["DEFAULT"],
    minimum_charge:         3500,
    handling_fee_per_piece: 300,
    security_fee_flat:      500,
    peak_surcharge_pct:     0,
    label:                  "Standard Rate (Default)",
  };
}

/** Synchronous pricing calc — used for live preview with a pre-fetched rate card */
export function calculateCargoPricing(
  input: PricingInput & {
    rateCard: {
      rate_per_kg: number;
      minimum_charge: number;
      handling_fee_per_piece: number;
      security_fee_flat: number;
      peak_surcharge_pct: number;
      label: string;
    };
  }
): PricingBreakdown {
  const { rateCard } = input;

  const volumetricWeightKg = calculateVolumetricWeight(
    input.lengthCm, input.widthCm, input.heightCm
  );

  const rawChargeable = Math.max(input.actualWeightKg, volumetricWeightKg);
  // Round up to nearest 0.5 kg (aviation billing standard)
  const chargeableWeightKg = Math.max(1, Math.ceil(rawChargeable * 2) / 2);

  // Weight-bracket volume discounts
  let bracketMultiplier = 1.0;
  if (chargeableWeightKg > 50) bracketMultiplier = 0.85;
  else if (chargeableWeightKg > 20) bracketMultiplier = 0.92;

  const effectiveRate = Math.round(rateCard.rate_per_kg * bracketMultiplier);
  const rawFreight    = chargeableWeightKg * effectiveRate;
  const surcharge     = rawFreight * (rateCard.peak_surcharge_pct / 100);
  const freightCharge = Math.max(rateCard.minimum_charge, rawFreight + surcharge);

  const handlingFee  = input.pieces * rateCard.handling_fee_per_piece;
  const securityFee  = rateCard.security_fee_flat;
  const insuranceFee = (input.declaredValue ?? 0) > 50000
    ? Math.round((input.declaredValue ?? 0) * 0.005)
    : 0;

  const amountTotal = freightCharge + handlingFee + securityFee + insuranceFee;

  return {
    actualWeightKg:    input.actualWeightKg,
    volumetricWeightKg,
    chargeableWeightKg,
    baseRatePerKg:     effectiveRate,
    peakSurchargePct:  rateCard.peak_surcharge_pct,
    freightCharge,
    handlingFee,
    securityFee,
    insuranceFee,
    amountTotal,
    rateLabel:         rateCard.label,
  };
}
