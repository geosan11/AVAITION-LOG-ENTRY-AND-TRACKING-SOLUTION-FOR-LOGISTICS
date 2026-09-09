import React, { useState } from "react";
import { Button, TextField, Select, Card, Icon, InfoHint } from "@/components/ui";
import { AIRPORT_HUBS, formatCurrency } from "@/lib/ui";

interface LocalRateCard {
  id: string;
  originCode: string | null;
  destinationCode: string | null;
  shipmentType: string | null;
  ratePerKg: number;
  minimumCharge: number;
  handlingFeePerPiece: number;
  securityFeeFlat: number;
  peakSurchargePct: number;
  label: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  isActive: boolean;
}

const DEFAULT_CARDS: LocalRateCard[] = [
  { id: "1", originCode: "LOS", destinationCode: "ABV", shipmentType: null, ratePerKg: 450, minimumCharge: 3500, handlingFeePerPiece: 300, securityFeeFlat: 500, peakSurchargePct: 0, label: "Standard Rate", effectiveFrom: "2026-01-01", effectiveUntil: null, isActive: true },
  { id: "2", originCode: "LOS", destinationCode: "PHC", shipmentType: null, ratePerKg: 500, minimumCharge: 3500, handlingFeePerPiece: 300, securityFeeFlat: 500, peakSurchargePct: 0, label: "Standard Rate", effectiveFrom: "2026-01-01", effectiveUntil: null, isActive: true },
  { id: "3", originCode: null, destinationCode: null, shipmentType: null, ratePerKg: 500, minimumCharge: 3500, handlingFeePerPiece: 300, securityFeeFlat: 500, peakSurchargePct: 0, label: "Global Default Rate", effectiveFrom: "2026-01-01", effectiveUntil: null, isActive: true },
];

const SHIPMENT_TYPE_OPTIONS = [
  { value: "",                label: "All Types (Wildcard)" },
  { value: "air_cargo",       label: "Air Cargo"            },
  { value: "express_parcel",  label: "Express Parcel"       },
  { value: "excess_baggage",  label: "Excess Baggage"       },
  { value: "marketing_cargo", label: "Bulk Marketing Cargo" },
];

const HUB_OPTIONS = [
  { value: "", label: "Any origin (Wildcard)" },
  ...AIRPORT_HUBS.map(h => ({ value: h.code, label: `${h.code} — ${h.city}` })),
];

const DEST_OPTIONS = [
  { value: "", label: "Any destination (Wildcard)" },
  ...AIRPORT_HUBS.map(h => ({ value: h.code, label: `${h.code} — ${h.city}` })),
];

const blank = (): Omit<LocalRateCard, "id" | "isActive"> => ({
  originCode: null, destinationCode: null, shipmentType: null,
  ratePerKg: 500, minimumCharge: 3500, handlingFeePerPiece: 300,
  securityFeeFlat: 500, peakSurchargePct: 0,
  label: "Standard Rate",
  effectiveFrom: new Date().toISOString().split("T")[0],
  effectiveUntil: null,
});

export const RateCardManager: React.FC = () => {
  const [cards, setCards]       = useState<LocalRateCard[]>(DEFAULT_CARDS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(blank());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value === "" ? null : value }));

  const handleSave = () => {
    setCards(prev => [...prev, { ...form, id: crypto.randomUUID(), isActive: true }]);
    setForm(blank());
    setShowForm(false);
  };

  const toggleActive = (id: string) =>
    setCards(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));

  const routeLabel = (c: LocalRateCard) =>
    `${c.originCode ?? "ANY"} → ${c.destinationCode ?? "ANY"}`;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Icon name="trending_up" size={16} className="text-accent-amber" /> Pricing
          </h2>
          <p className="text-xs text-muted mt-0.5">Set the price per kilogram for each route.</p>
        </div>
        <Button variant="primary" size="sm" iconLeft={showForm ? "expand_less" : "add"} onClick={() => setShowForm(v => !v)}>
          {showForm ? "Cancel" : "Add a price"}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-accent-amber/30 ring-1 ring-accent-amber/10">
          <div className="p-1 flex flex-col gap-4">
            <div className="text-xs font-bold text-accent-amber flex items-center gap-1.5">
              <Icon name="payments" size={13} /> New price
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="From" value={form.originCode ?? ""} onChange={e => set("originCode", e.target.value)} options={HUB_OPTIONS} />
              <Select label="To" value={form.destinationCode ?? ""} onChange={e => set("destinationCode", e.target.value)} options={DEST_OPTIONS} />
              <Select label="Shipment type" value={form.shipmentType ?? ""} onChange={e => set("shipmentType", e.target.value)} options={SHIPMENT_TYPE_OPTIONS} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <TextField label="Price per kg (₦)" type="number" value={form.ratePerKg} onChange={e => set("ratePerKg", Number(e.target.value))} mono />
              <TextField label="Minimum price (₦)" type="number" value={form.minimumCharge} onChange={e => set("minimumCharge", Number(e.target.value))} mono />
              <TextField label="Handling fee per item (₦)" type="number" value={form.handlingFeePerPiece} onChange={e => set("handlingFeePerPiece", Number(e.target.value))} mono />
              <TextField label="Security fee (₦)" type="number" value={form.securityFeeFlat} onChange={e => set("securityFeeFlat", Number(e.target.value))} mono />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField label="Name" value={form.label} onChange={e => set("label", e.target.value)} placeholder="e.g. Busy season" />
              <TextField label="Starts" type="date" value={form.effectiveFrom} onChange={e => set("effectiveFrom", e.target.value)} mono />
              <TextField label="Ends" type="date" value={form.effectiveUntil ?? ""} onChange={e => set("effectiveUntil", e.target.value)} mono hint="Leave blank for no end date" />
            </div>
            <div className="flex items-center gap-4">
              <TextField
                label={<span className="flex items-center gap-1">Busy-period surcharge % <InfoHint term="peakSurcharge" /></span>}
                type="number" step="0.5" value={form.peakSurchargePct}
                onChange={e => set("peakSurchargePct", Number(e.target.value))} mono hint="0 = none"
              />
              <div className="flex-1" />
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Cards Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted font-semibold">
                <th className="text-left py-3 px-4">Route</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-right py-3 px-4">Per kg</th>
                <th className="text-right py-3 px-4">Minimum</th>
                <th className="text-center py-3 px-4">On</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {cards.map(card => {
                const open = expandedId === card.id;
                return (
                  <React.Fragment key={card.id}>
                    <tr className={`transition-colors hover:bg-surface-hover ${!card.isActive ? "opacity-50" : ""}`}>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{routeLabel(card)}</td>
                      <td className="py-3 px-4 text-foreground">{card.label}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground">{formatCurrency(card.ratePerKg)}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground">{formatCurrency(card.minimumCharge)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(card.id)}
                          className="text-muted hover:text-accent-amber transition-colors cursor-pointer align-middle"
                          title={card.isActive ? "Turn off" : "Turn on"}
                        >
                          {card.isActive
                            ? <Icon name="toggle_on" size={20} fill className="text-accent-amber" />
                            : <Icon name="toggle_off" size={20} />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : card.id)}
                          aria-expanded={open}
                          aria-label={open ? "Hide details" : "Show details"}
                          className="p-1 rounded text-muted hover:text-foreground cursor-pointer align-middle"
                        >
                          <Icon name="expand_more" size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-surface-container/40">
                        <td colSpan={6} className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-x-8 gap-y-1.5 text-[11px] text-muted">
                            <span>Shipment type: <strong className="text-foreground">{card.shipmentType ?? "All"}</strong></span>
                            <span>Handling fee per item: <strong className="font-mono text-foreground">{formatCurrency(card.handlingFeePerPiece)}</strong></span>
                            <span>Security fee: <strong className="font-mono text-foreground">{formatCurrency(card.securityFeeFlat)}</strong></span>
                            <span>
                              Busy-period surcharge:{" "}
                              <strong className="font-mono text-foreground">
                                {card.peakSurchargePct > 0 ? `+${card.peakSurchargePct}%` : "none"}
                              </strong>
                            </span>
                            <span>Starts: <strong className="font-mono text-foreground">{card.effectiveFrom}</strong></span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted text-xs">
                    No prices yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border-subtle text-[11px] text-muted flex items-center gap-1.5">
          <Icon name="south" size={12} /> If two prices match a route, the more specific one is used.
        </div>
      </Card>
    </div>
  );
};
