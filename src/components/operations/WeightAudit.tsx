import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Disclosure } from "@/components/ui/Disclosure";
import { InfoHint } from "@/components/ui/InfoHint";
import { formatCurrency } from "@/lib/ui";

export interface WeightAuditRecord {
  id: string;
  awbNumber: string;
  consigneeName: string;
  originHub: string;
  destinationHub: string;
  intakeWeightKg: number;
  rampWeightKg: number;
  discrepancyKg: number;
  chargeShortfall: number;
  status: "discrepancy_flagged" | "supplementary_debited" | "verified_ok";
  scannedAt: string;
  auditorName: string;
}

const SAMPLE_AUDIT_LOGS: WeightAuditRecord[] = [
  {
    id: "aud-1",
    awbNumber: "LOS-2026-000481",
    consigneeName: "Aliko Logistics Terminal",
    originHub: "LOS",
    destinationHub: "KAN",
    intakeWeightKg: 42.0,
    rampWeightKg: 47.5,
    discrepancyKg: 5.5,
    chargeShortfall: 4125,
    status: "discrepancy_flagged",
    scannedAt: "10 mins ago",
    auditorName: "Ramp Officer Chidi",
  },
  {
    id: "aud-2",
    awbNumber: "LOS-2026-000475",
    consigneeName: "Mainland Electronics Hub",
    originHub: "LOS",
    destinationHub: "ABV",
    intakeWeightKg: 18.5,
    rampWeightKg: 21.0,
    discrepancyKg: 2.5,
    chargeShortfall: 1875,
    status: "supplementary_debited",
    scannedAt: "35 mins ago",
    auditorName: "Ramp Officer Chidi",
  },
  {
    id: "aud-3",
    awbNumber: "LOS-2026-000469",
    consigneeName: "Federal Medical Supplies",
    originHub: "LOS",
    destinationHub: "PHC",
    intakeWeightKg: 85.0,
    rampWeightKg: 85.2,
    discrepancyKg: 0.2,
    chargeShortfall: 0,
    status: "verified_ok",
    scannedAt: "1 hour ago",
    auditorName: "Ramp Officer Ahmed",
  },
];

export const WeightAudit: React.FC = () => {
  const [logs, setLogs] = useState<WeightAuditRecord[]>(SAMPLE_AUDIT_LOGS);
  const [intakeWeight, setIntakeWeight] = useState(15.0);
  const [rampScaleWeight, setRampScaleWeight] = useState(18.5);
  const [activeAwb, setActiveAwb] = useState("LOS-2026-000492");
  const [ratePerKg] = useState(750);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<WeightAuditRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalRecoveredRevenue = logs.reduce(
    (acc, l) => acc + (l.status === "supplementary_debited" ? l.chargeShortfall : 0),
    0
  );
  const totalPendingShortfall = logs.reduce(
    (acc, l) => acc + (l.status === "discrepancy_flagged" ? l.chargeShortfall : 0),
    0
  );

  const discrepancy = Math.max(0, Math.round((rampScaleWeight - intakeWeight) * 100) / 100);
  const calculatedShortfall = Math.round(discrepancy * ratePerKg);

  const handleCommitAudit = () => {
    if (!activeAwb.trim()) return;

    const newRecord: WeightAuditRecord = {
      id: crypto.randomUUID(),
      awbNumber: activeAwb.trim().toUpperCase(),
      consigneeName: "Awaiting Lookup",
      originHub: "LOS",
      destinationHub: "ABV",
      intakeWeightKg: intakeWeight,
      rampWeightKg: rampScaleWeight,
      discrepancyKg: discrepancy,
      chargeShortfall: calculatedShortfall,
      status: discrepancy > 0.5 ? "discrepancy_flagged" : "verified_ok",
      scannedAt: "Just now",
      auditorName: "Active Ramp Inspector",
    };

    setLogs((prev) => [newRecord, ...prev]);
    if (discrepancy > 0.5) {
      setSelectedAudit(newRecord);
      setShowDebitModal(true);
    }
  };

  const handleAuthorizeDebit = (id: string) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "supplementary_debited" } : l))
    );
    setShowDebitModal(false);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 bg-surface-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Extra charges billed this month</span>
            <Icon name="paid" size={16} className="text-success" />
          </div>
          <div className="text-2xl font-black font-mono text-success mt-2">
            {formatCurrency(totalRecoveredRevenue)}
          </div>
          <p className="text-[11px] text-muted mt-1">Billed to senders for underweight shipments</p>
        </Card>

        <Card className="p-4 bg-surface-card border-error/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Differences not yet billed</span>
            <Icon name="report" size={16} className="text-error" />
          </div>
          <div className="text-2xl font-black font-mono text-error mt-2">
            {formatCurrency(totalPendingShortfall)}
          </div>
          <p className="text-[11px] text-muted mt-1">Waiting for a manager to add the charge</p>
        </Card>
      </div>

      <Disclosure label="More stats" persistKey="audit-more-stats">
        <div className="pt-2 flex items-baseline justify-between text-xs">
          <span className="text-muted">Average weight under-reported at the desk</span>
          <span className="font-mono font-bold text-foreground">+3.2 kg (6.8%)</span>
        </div>
      </Disclosure>

      {/* Weight check entry */}
      <Card
        className="border-accent-amber/40 ring-1 ring-accent-amber/15"
        header={
          <span className="text-sm font-bold text-foreground flex items-center gap-2">
            <Icon name="scale" size={16} className="text-accent-amber" />
            Check a shipment's weight
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <TextField
            label="Tracking number"
            value={activeAwb}
            onChange={(e) => setActiveAwb(e.target.value)}
            placeholder="LOS-2026-000492"
            iconLeft="search"
            mono
          />

          <TextField
            label="Weight recorded at desk (kg)"
            type="number"
            step="0.1"
            value={intakeWeight}
            onChange={(e) => setIntakeWeight(parseFloat(e.target.value) || 0)}
            mono
          />

          <TextField
            label="Weight measured at aircraft (kg)"
            type="number"
            step="0.1"
            value={rampScaleWeight}
            onChange={(e) => setRampScaleWeight(parseFloat(e.target.value) || 0)}
            mono
            hint={discrepancy > 0 ? `${discrepancy} kg heavier` : "Same"}
          />

          <Button
            variant="primary"
            size="md"
            iconLeft="scale"
            onClick={handleCommitAudit}
            className="w-full"
          >
            Save check
          </Button>
        </div>

        {discrepancy > 0.5 && (
          <div className="mt-4 p-3 rounded-xl bg-error-bg border border-error-border text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-error-fg font-medium">
              <Icon name="gpp_maybe" size={16} className="shrink-0" />
              <span>
                This shipment is <strong>{discrepancy} kg</strong> heavier than paid for. Extra charge:{" "}
                <strong>{formatCurrency(calculatedShortfall)}</strong>.
                <InfoHint term="supplementaryDebit" size={12} className="ml-1" />
              </span>
            </div>
            <Badge tone="error" size="sm">
              Needs a charge
            </Badge>
          </div>
        )}
      </Card>

      {/* Recent checks */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-foreground">Recent checks</span>
            <Badge tone="info">{logs.length} checked</Badge>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted font-semibold">
                <th className="text-left py-3 px-4">Tracking number</th>
                <th className="text-right py-3 px-4">Difference</th>
                <th className="text-right py-3 px-4">Extra charge</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {logs.map((log) => {
                const open = expandedId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{log.awbNumber}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {log.discrepancyKg > 0.5 ? (
                          <span className="text-error font-bold">+{log.discrepancyKg} kg</span>
                        ) : (
                          <span className="text-success">Same</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {log.chargeShortfall > 0 ? formatCurrency(log.chargeShortfall) : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {log.status === "supplementary_debited" ? (
                          <Badge tone="success" size="sm" dot>Charged</Badge>
                        ) : log.status === "discrepancy_flagged" ? (
                          <Badge tone="error" size="sm" dot>Needs a charge</Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">Weight OK</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.status === "discrepancy_flagged" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedAudit(log);
                              setShowDebitModal(true);
                            }}
                          >
                            Add charge
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : log.id)}
                          aria-expanded={open}
                          aria-label={open ? "Hide details" : "Show details"}
                          className="ml-2 p-1 rounded text-muted hover:text-foreground cursor-pointer align-middle"
                        >
                          <Icon
                            name="expand_more"
                            size={16}
                            className={`transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-surface-container/40">
                        <td colSpan={5} className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-x-8 gap-y-1.5 text-[11px] text-muted">
                            <span>
                              Route:{" "}
                              <strong className="font-mono text-foreground">
                                {log.originHub} ➔ {log.destinationHub}
                              </strong>
                            </span>
                            <span>
                              At desk:{" "}
                              <strong className="font-mono text-foreground">{log.intakeWeightKg} kg</strong>
                            </span>
                            <span>
                              At aircraft:{" "}
                              <strong className="font-mono text-foreground">{log.rampWeightKg} kg</strong>
                            </span>
                            <span>
                              Checked by <strong className="text-foreground">{log.auditorName}</strong>,{" "}
                              {log.scannedAt}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supplementary Debit Modal */}
      {selectedAudit && (
        <Modal
          isOpen={showDebitModal}
          onClose={() => setShowDebitModal(false)}
          title="Add extra charge"
          description={`${selectedAudit.awbNumber} is ${selectedAudit.discrepancyKg} kg heavier than paid for.`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowDebitModal(false)}>
                Not now
              </Button>
              <Button
                variant="primary"
                iconLeft="paid"
                onClick={() => handleAuthorizeDebit(selectedAudit.id)}
              >
                Add charge ({formatCurrency(selectedAudit.chargeShortfall)})
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-sunken border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted uppercase font-bold">Tracking number</span>
                <div className="font-mono font-bold text-sm text-foreground">{selectedAudit.awbNumber}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted uppercase font-bold">Weight difference</span>
                <div className="font-mono font-bold text-error text-sm">+{selectedAudit.discrepancyKg} kg</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-accent-amber/10 border border-accent-amber/30 space-y-1.5">
              <div className="flex justify-between items-center text-foreground font-semibold">
                <span>Extra charge</span>
                <span className="text-lg font-black font-mono text-foreground">
                  {formatCurrency(selectedAudit.chargeShortfall)}
                </span>
              </div>
              <p className="text-[11px] text-muted">
                This bills the sender for the extra weight and holds the shipment at the destination until it's paid.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
