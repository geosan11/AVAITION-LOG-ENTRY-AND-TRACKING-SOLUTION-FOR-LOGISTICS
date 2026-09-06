import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/ui";
import { PricingBreakdown } from "@/lib/pricing";

export interface ConfirmIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  formData: {
    originCode: string;
    destinationCode: string;
    flightNumber: string;
    shipmentType: string;
    senderName: string;
    consigneeName: string;
    consigneePhone: string;
    pieces: number;
    weightKg: number;
    paymentMode: string;
    amountTendered?: number;
  };
  pricing: PricingBreakdown | null;
}

export const ConfirmIssueModal: React.FC<ConfirmIssueModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
  formData,
  pricing,
}) => {
  if (!pricing) return null;

  const total = pricing.amountTotal;
  const tendered = formData.amountTendered && formData.amountTendered > 0 ? formData.amountTendered : total;
  const balance = Math.max(0, total - tendered);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Consignment Before Issuance"
      description="Review all cargo specifications and billing totals. Once issued, this entry commits to the flight manifest."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel & Edit
          </Button>
          <Button
            variant="primary"
            iconLeft="print"
            loading={submitting}
            loadingLabel="Issuing & Syncing..."
            onClick={onConfirm}
          >
            Confirm & Issue Waybill
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Route Header Banner */}
        <div className="p-3 rounded-lg bg-surface-sunken border border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-foreground">
            <Icon name="flight_takeoff" size={16} className="text-accent-amber" />
            <span>{formData.originCode}</span>
            <span className="text-muted">➔</span>
            <span>{formData.destinationCode}</span>
          </div>
          <Badge tone="amber" dot>Flight {formData.flightNumber || "Standby"}</Badge>
        </div>

        {/* 2-Column Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle space-y-1.5">
            <div className="text-muted flex items-center gap-1 font-semibold text-[11px]">
              <Icon name="person" size={13} /> Shipper & Consignee
            </div>
            <div>
              <span className="text-muted block text-[10px]">Shipper:</span>
              <span className="font-semibold text-foreground text-xs">{formData.senderName}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">Consignee:</span>
              <span className="font-semibold text-foreground text-xs">{formData.consigneeName}</span>
              <span className="text-muted block font-mono text-[10px]">{formData.consigneePhone}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle space-y-1.5">
            <div className="text-muted flex items-center gap-1 font-semibold text-[11px]">
              <Icon name="scale" size={13} /> Weight & Package
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Packages:</span>
              <span className="font-bold text-foreground font-mono">{formData.pieces} pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Gross Weight:</span>
              <span className="font-bold text-foreground font-mono">{formData.weightKg} kg</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-1">
              <span className="text-muted">Billable:</span>
              <span className="font-bold text-accent-amber font-mono">{pricing.chargeableWeightKg} kg</span>
            </div>
          </div>
        </div>

        {/* Pricing & Settlement */}
        <div className="p-3.5 rounded-lg bg-accent-amber/10 border border-accent-amber/30 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Icon name="credit_card" size={14} className="text-accent-amber" /> Total Payable Amount:
            </span>
            <span className="text-lg font-black font-mono text-foreground">{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-accent-amber/20 text-[11px]">
            <div>
              <span className="text-muted block text-[10px]">Payment Method:</span>
              <span className="font-bold text-foreground">{formData.paymentMode}</span>
            </div>
            <div className="text-right">
              <span className="text-muted block text-[10px]">Tendered / Paid:</span>
              <span className="font-mono font-bold text-foreground">{formatCurrency(tendered)}</span>
            </div>
          </div>

          {balance > 0 && (
            <div className="flex items-center justify-between text-error font-semibold pt-1 border-t border-accent-amber/20 text-[11px]">
              <span>Unsettled Debt Balance:</span>
              <span className="font-mono">{formatCurrency(balance)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <Icon name="warning" size={13} className="text-accent-amber shrink-0" />
          <span>Physical thermal receipt will generate automatically upon issuance.</span>
        </div>
      </div>
    </Modal>
  );
};
