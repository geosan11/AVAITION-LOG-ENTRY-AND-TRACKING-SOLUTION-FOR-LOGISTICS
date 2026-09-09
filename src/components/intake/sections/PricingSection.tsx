import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { InfoHint } from "@/components/ui/InfoHint";
import { Disclosure } from "@/components/ui/Disclosure";
import { formatCurrency } from "@/lib/ui";
import { PricingBreakdown } from "@/lib/pricing";
import { PaymentMode } from "@/lib/types/database";

export interface PricingSectionProps {
  stationCode: string;
  destinationCode: string;
  pieces: number;
  pricing: PricingBreakdown | null;
  loadingRate: boolean;
  rateCard: any;
  paymentMode: PaymentMode;
  setPaymentMode: (val: PaymentMode) => void;
  paymentAmount: number;
  setPaymentAmount: (val: number) => void;
  submitting: boolean;
  onRequestIssue: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  stationCode,
  destinationCode,
  pieces,
  pricing,
  loadingRate,
  rateCard,
  paymentMode,
  setPaymentMode,
  paymentAmount,
  setPaymentAmount,
  submitting,
  onRequestIssue,
}) => {
  const total = pricing?.amountTotal ?? 0;
  const paymentModes: PaymentMode[] = ["Cash", "POS", "Transfer"];
  const showSizeChip = Boolean(pricing && pricing.volumetricWeightKg > 0);

  return (
    <Card
      className="border-accent-amber/30 ring-1 ring-accent-amber/10 sticky top-20"
      header={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-bold text-foreground flex items-center gap-2">
            <Icon name="receipt_long" size={15} className="text-accent-amber" />
            Price
          </span>
          <Badge tone="amber" dot>
            {stationCode} ➔ {destinationCode}
          </Badge>
        </div>
      }
      footer={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          loadingLabel="Working…"
          iconLeft="print"
          onClick={onRequestIssue}
        >
          Review &amp; create shipment
        </Button>
      }
    >
      {!pricing || loadingRate ? (
        <div className="text-xs text-muted py-8 text-center flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-muted">
            <Icon name="receipt_long" size={16} />
          </div>
          <span>{loadingRate ? "Getting prices…" : "Enter the route and weight to see the price"}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Headline total */}
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-foreground flex items-center gap-1">
              Total to pay
              <InfoHint term="chargeableWeight" label="How is this worked out?" />
            </span>
            <span className="text-2xl font-black font-mono text-foreground tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Breakdown (collapsed by default) */}
          <Disclosure label="See price breakdown" persistKey="intake-price-breakdown">
            <div className="flex flex-col gap-3 pt-2">
              {showSizeChip && (
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-sunken border border-border-subtle text-center text-[11px]">
                  <div>
                    <div className="text-muted">On the scale</div>
                    <div className="font-bold font-mono text-foreground mt-0.5">{pricing.actualWeightKg} kg</div>
                  </div>
                  <div>
                    <div className="text-muted">By size</div>
                    <div className="font-bold font-mono text-foreground mt-0.5">
                      {pricing.volumetricWeightKg} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-muted flex items-center justify-center gap-0.5">
                      Billed <InfoHint term="chargeableWeight" size={12} />
                    </div>
                    <div className="font-bold font-mono text-accent-amber mt-0.5">{pricing.chargeableWeightKg} kg</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 text-xs text-text-secondary">
                <div className="flex justify-between items-center">
                  <span>
                    Air freight ({pricing.chargeableWeightKg} kg @ ₦{pricing.baseRatePerKg}/kg
                    {pricing.peakSurchargePct > 0 ? ` +${pricing.peakSurchargePct}%` : ""})
                  </span>
                  <span className="font-mono font-semibold text-foreground">{formatCurrency(pricing.freightCharge)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    Handling &amp; tagging ({pieces} × ₦{rateCard?.handling_fee_per_piece ?? 300})
                  </span>
                  <span className="font-mono font-semibold text-foreground">{formatCurrency(pricing.handlingFee)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Security screening <InfoHint term="securityFee" size={12} />
                  </span>
                  <span className="font-mono font-semibold text-foreground">{formatCurrency(pricing.securityFee)}</span>
                </div>

                {pricing.insuranceFee > 0 && (
                  <div className="flex justify-between items-center text-accent-amber">
                    <span className="flex items-center gap-1">
                      <Icon name="verified_user" size={13} /> Insurance (0.5%)
                    </span>
                    <span className="font-mono font-semibold">{formatCurrency(pricing.insuranceFee)}</span>
                  </div>
                )}

                {pricing.rateLabel && (
                  <div className="text-[10px] text-muted text-right">Price used: {pricing.rateLabel}</div>
                )}
              </div>
            </div>
          </Disclosure>

          {/* Payment */}
          <div className="border-t border-border-subtle pt-3 flex flex-col gap-2.5">
            <div className="text-xs font-semibold text-text-secondary">How is it being paid?</div>

            <div className="grid grid-cols-3 gap-2">
              {paymentModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    paymentMode === mode
                      ? "bg-accent-amber text-on-accent border-accent-amber shadow-sm"
                      : "bg-surface-2 text-foreground border-border hover:bg-surface-3"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <TextField
              label="Amount received (₦)"
              type="number"
              value={paymentAmount || ""}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              placeholder={`Full amount: ${formatCurrency(total)}`}
              hint="Leave blank if paid in full"
              mono
            />
          </div>
        </div>
      )}
    </Card>
  );
};
