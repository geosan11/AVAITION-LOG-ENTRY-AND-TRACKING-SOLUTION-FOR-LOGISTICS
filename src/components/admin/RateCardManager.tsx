import { useState } from "react";
import { Button, TextField, Select, Card, Badge } from "@/components/ui";
import { Plus, DollarSign, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
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
            <TrendingUp size={16} className="text-accent-amber" /> Rate Card Management
          </h2>
          <p className="text-xs text-muted mt-0.5">Operators control freight rates here — no code changes required.</p>
        </div>
        <Button variant="primary" size="sm" iconLeft={showForm ? ChevronUp : Plus} onClick={() => setShowForm(v => !v)}>
          {showForm ? "Cancel" : "Add Rate Card"}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-accent-amber/30 ring-1 ring-accent-amber/10">
          <div className="p-1 flex flex-col gap-4">
            <div className="text-xs font-bold text-accent-amber flex items-center gap-1.5">
              <DollarSign size={13} /> New Rate Card
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Origin Hub" value={form.originCode ?? ""} onChange={e => set("originCode", e.target.value)} options={HUB_OPTIONS} />
              <Select label="Destination Hub" value={form.destinationCode ?? ""} onChange={e => set("destinationCode", e.target.value)} options={DEST_OPTIONS} />
              <Select label="Cargo Type" value={form.shipmentType ?? ""} onChange={e => set("shipmentType", e.target.value)} options={SHIPMENT_TYPE_OPTIONS} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <TextField label="Rate / Kg (₦)" type="number" value={form.ratePerKg} onChange={e => set("ratePerKg", Number(e.target.value))} mono />
              <TextField label="Minimum Charge (₦)" type="number" value={form.minimumCharge} onChange={e => set("minimumCharge", Number(e.target.value))} mono />
              <TextField label="Handling Fee / Piece (₦)" type="number" value={form.handlingFeePerPiece} onChange={e => set("handlingFeePerPiece", Number(e.target.value))} mono />
              <TextField label="Security Fee Flat (₦)" type="number" value={form.securityFeeFlat} onChange={e => set("securityFeeFlat", Number(e.target.value))} mono />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField label="Card Label / Name" value={form.label} onChange={e => set("label", e.target.value)} placeholder="e.g. Peak Season Rate" />
              <TextField label="Effective From" type="date" value={form.effectiveFrom} onChange={e => set("effectiveFrom", e.target.value)} mono />
              <TextField label="Effective Until (optional)" type="date" value={form.effectiveUntil ?? ""} onChange={e => set("effectiveUntil", e.target.value)} mono hint="Leave blank = no expiry" />
            </div>
            <div className="flex items-center gap-4">
              <TextField label="Peak Surcharge %" type="number" step="0.5" value={form.peakSurchargePct} onChange={e => set("peakSurchargePct", Number(e.target.value))} mono hint="0 = no surcharge" />
              <div className="flex-1" />
              <Button variant="primary" onClick={handleSave}>Save Rate Card</Button>
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
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Label</th>
                <th className="text-right py-3 px-4">Rate / Kg</th>
                <th className="text-right py-3 px-4">Min Charge</th>
                <th className="text-right py-3 px-4">Surcharge</th>
                <th className="text-left py-3 px-4">Valid From</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {cards.map(card => (
                <tr key={card.id} className={`transition-colors hover:bg-surface-hover ${!card.isActive ? "opacity-50" : ""}`}>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{routeLabel(card)}</td>
                  <td className="py-3 px-4 text-muted">{card.shipmentType ?? "All"}</td>
                  <td className="py-3 px-4 text-foreground">{card.label}</td>
                  <td className="py-3 px-4 text-right font-mono text-foreground">{formatCurrency(card.ratePerKg)}</td>
                  <td className="py-3 px-4 text-right font-mono text-foreground">{formatCurrency(card.minimumCharge)}</td>
                  <td className="py-3 px-4 text-right font-mono text-foreground">
                    {card.peakSurchargePct > 0
                      ? <span className="text-accent-amber font-bold">+{card.peakSurchargePct}%</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted">{card.effectiveFrom}</td>
                  <td className="py-3 px-4 text-center">
                    {card.isActive
                      ? <Badge tone="success" size="sm">Active</Badge>
                      : <Badge tone="neutral" size="sm">Inactive</Badge>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(card.id)}
                      className="text-muted hover:text-accent-amber transition-colors cursor-pointer"
                      title={card.isActive ? "Deactivate" : "Activate"}
                    >
                      {card.isActive
                        ? <ToggleRight size={20} className="text-accent-amber" />
                        : <ToggleLeft size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-muted text-xs">
                    No rate cards yet. Add your first rate card above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border-subtle text-[11px] text-muted flex items-center gap-1.5">
          <ChevronDown size={12} /> Most-specific route wins. Wildcard cards are the global fallback.
        </div>
      </Card>
    </div>
  );
};
