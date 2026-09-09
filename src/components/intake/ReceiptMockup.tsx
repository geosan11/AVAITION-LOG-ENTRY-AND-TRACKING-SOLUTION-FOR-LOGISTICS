import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/ui";
import { Shipment } from "@/lib/types/database";

export interface ReceiptMockupProps {
  shipment: Shipment;
  tenantName?: string;
  isWhiteLabel?: boolean;
  onClose?: () => void;
}

export const ReceiptMockup: React.FC<ReceiptMockupProps> = ({
  shipment,
  tenantName = "SpeedWings Express Aviation",
  isWhiteLabel = false,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/track/${shipment.awb_number}`
    : `https://aerologistics.app/track/${shipment.awb_number}`;

  const handleCopyAwb = () => {
    navigator.clipboard.writeText(shipment.awb_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Thermal Receipt Paper Container */}
      <div
        id="printable-thermal-receipt"
        className="w-full bg-white text-neutral-900 font-mono text-[12px] leading-relaxed p-6 rounded-lg shadow-xl border border-neutral-300 select-all print:shadow-none print:border-none print:m-0 print:p-4"
        style={{ maxWidth: "380px" }}
      >
        {/* Header */}
        <div className="text-center pb-3 border-b-2 border-dashed border-neutral-400">
          <div className="text-base font-black tracking-tight uppercase">{tenantName}</div>
          <div className="text-[11px] text-neutral-600">AIR CARGO & LOGISTICS WAYBILL</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">IATA CARGO AGENT NO: 92-4-7128</div>
        </div>

        {/* Barcode / AWB Block */}
        <div className="py-3 text-center border-b border-dashed border-neutral-300">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Air Waybill Number</div>
          <div className="text-xl font-black tracking-wider text-black mt-0.5">
            {shipment.awb_number.startsWith("PENDING-") ? (
              <span className="text-amber-700 text-sm">PENDING CLOUD SYNC</span>
            ) : (
              shipment.awb_number
            )}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Date: {new Date(shipment.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
          </div>
        </div>

        {/* Flight & Routing */}
        <div className="py-2.5 border-b border-dashed border-neutral-300 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-neutral-500 block text-[10px]">ORIGIN:</span>
            <span className="font-bold text-black">{shipment.origin_hub_id}</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block text-[10px]">DESTINATION:</span>
            <span className="font-bold text-black">{shipment.destination_hub_id}</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px]">FLIGHT NO:</span>
            <span className="font-bold text-black">{shipment.flight_number || "STANDBY"}</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block text-[10px]">TYPE:</span>
            <span className="font-bold uppercase text-black">{shipment.type.replace("_", " ")}</span>
          </div>
        </div>

        {/* Shipper & Consignee */}
        <div className="py-2.5 border-b border-dashed border-neutral-300 text-[11px] space-y-2">
          <div>
            <span className="text-neutral-500 block text-[10px]">SHIPPER:</span>
            <span className="font-bold text-black">{shipment.sender_name}</span>
            <span className="text-neutral-600 block text-[10px]">{shipment.sender_phone}</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px]">CONSIGNEE:</span>
            <span className="font-bold text-black">{shipment.consignee_name}</span>
            <span className="text-neutral-600 block text-[10px]">{shipment.consignee_phone}</span>
          </div>
        </div>

        {/* Cargo Specs */}
        <div className="py-2.5 border-b border-dashed border-neutral-300 text-[11px]">
          <div className="flex justify-between">
            <span>Pieces:</span>
            <span className="font-bold">{shipment.pieces} PKG</span>
          </div>
          <div className="flex justify-between">
            <span>Actual Weight:</span>
            <span>{shipment.weight_kg} Kg</span>
          </div>
          <div className="flex justify-between">
            <span>Volumetric Weight:</span>
            <span>{shipment.volumetric_weight_kg || 0} Kg</span>
          </div>
          <div className="flex justify-between font-bold text-black border-t border-dotted border-neutral-300 pt-1 mt-1">
            <span>Chargeable Weight:</span>
            <span>{shipment.chargeable_weight_kg} Kg</span>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-600 mt-1">
            <span>Contents:</span>
            <span>{shipment.content_type}</span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="py-2.5 border-b-2 border-dashed border-neutral-400 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span>Freight Charge:</span>
            <span>{formatCurrency(shipment.freight_charge)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ground Handling:</span>
            <span>{formatCurrency(shipment.handling_fee)}</span>
          </div>
          <div className="flex justify-between">
            <span>AVSEC Security:</span>
            <span>{formatCurrency(shipment.security_fee)}</span>
          </div>
          {shipment.insurance_fee > 0 && (
            <div className="flex justify-between">
              <span>Cargo Insurance:</span>
              <span>{formatCurrency(shipment.insurance_fee)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-black pt-2 border-t border-neutral-300">
            <span>TOTAL CHARGES:</span>
            <span>{formatCurrency(shipment.amount_total)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-700">
            <span>Amount Paid:</span>
            <span className="font-semibold">{formatCurrency(shipment.amount_paid)}</span>
          </div>
          {shipment.balance_due > 0 && (
            <div className="flex justify-between text-[11px] font-bold text-red-600">
              <span>BALANCE DUE:</span>
              <span>{formatCurrency(shipment.balance_due)}</span>
            </div>
          )}
        </div>

        {/* Security Pickup PIN & QR Code */}
        <div className="py-4 flex items-center justify-between gap-4 border-b border-dashed border-neutral-300">
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-neutral-500 block">PICKUP PIN:</span>
            <span className="text-2xl font-black tracking-widest text-black bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 inline-block">
              {shipment.pickup_pin || "----"}
            </span>
            <p className="text-[9px] text-neutral-500 leading-tight">Consignee must present this PIN upon delivery verification.</p>
          </div>
          <div className="shrink-0 p-1.5 bg-white border border-neutral-300 rounded">
            <QRCodeSVG value={trackingUrl} size={64} level="M" />
          </div>
        </div>

        {/* Thermal Receipt Footer */}
        <div className="pt-3 text-center text-[10px] text-neutral-500 space-y-1">
          <p>Scan QR code or visit aerologistics.app/track to track live flight progress.</p>
          <p className="font-bold text-neutral-700">Thank you for your business!</p>
          {!isWhiteLabel && (
            <div className="pt-2 text-[9px] text-neutral-400 tracking-wider">
              ⚡ POWERED BY AEROLOGISTICS SAAS
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="flex gap-2.5 w-full justify-center print:hidden">
        <Button variant="primary" iconLeft="print" onClick={handlePrint}>
          Print receipt (80mm)
        </Button>
        <Button variant="secondary" iconLeft={copied ? "check" : "content_copy"} onClick={handleCopyAwb}>
          {copied ? "Copied!" : "Copy tracking number"}
        </Button>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
};
