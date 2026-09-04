import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Scale,
  Search,
  TrendingUp,
  FileWarning,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="text-accent-amber" size={20} />
            Ramp Weight Audit & Revenue Recovery Engine
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Audit tarmac scale weights against desk booking entries to eliminate cargo weight leakage and recover lost freight revenue.
          </p>
        </div>

        <Badge tone="amber" dot size="md">
          ICAO Annex 18 & NCAA Safety Compliant
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Recovered Revenue This Month</span>
            <DollarSign size={16} className="text-success" />
          </div>
          <div className="text-2xl font-black font-mono text-success mt-2">
            {formatCurrency(totalRecoveredRevenue)}
          </div>
          <p className="text-[11px] text-muted mt-1">Supplementary debits billed to shippers</p>
        </Card>

        <Card className="p-4 bg-surface-card border-error/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Pending Undeclared Discrepancies</span>
            <FileWarning size={16} className="text-error" />
          </div>
          <div className="text-2xl font-black font-mono text-error mt-2">
            {formatCurrency(totalPendingShortfall)}
          </div>
          <p className="text-[11px] text-muted mt-1">Weight variance awaiting authorization</p>
        </Card>

        <Card className="p-4 bg-surface-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Tarmac Weight Leakage Rate</span>
            <Scale size={16} className="text-accent-amber" />
          </div>
          <div className="text-2xl font-black font-mono text-foreground mt-2">6.8% Variance</div>
          <p className="text-[11px] text-muted mt-1">Avg +3.2 kg under-reported at counter</p>
        </Card>
      </div>

      {/* Quick Ramp Audit Entry Box */}
      <Card
        className="border-accent-amber/40 ring-1 ring-accent-amber/15"
        header={
          <span className="text-sm font-bold text-foreground flex items-center gap-2">
            <Scale size={16} className="text-accent-amber" />
            Live Aircraft Hold Scale Re-Weigh Inspector
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <TextField
            label="Scanned Air Waybill"
            value={activeAwb}
            onChange={(e) => setActiveAwb(e.target.value)}
            placeholder="LOS-2026-000492"
            iconLeft={Search}
            mono
          />

          <TextField
            label="Counter Intake Weight (Kg)"
            type="number"
            step="0.1"
            value={intakeWeight}
            onChange={(e) => setIntakeWeight(parseFloat(e.target.value) || 0)}
            mono
          />

          <TextField
            label="Ramp Scale Reading (Kg)"
            type="number"
            step="0.1"
            value={rampScaleWeight}
            onChange={(e) => setRampScaleWeight(parseFloat(e.target.value) || 0)}
            mono
            hint={discrepancy > 0 ? `+${discrepancy} kg discrepancy detected` : "Matched"}
          />

          <Button
            variant="primary"
            size="md"
            iconLeft={Scale}
            onClick={handleCommitAudit}
            className="w-full"
          >
            Log Ramp Audit
          </Button>
        </div>

        {discrepancy > 0.5 && (
          <div className="mt-4 p-3 rounded-xl bg-error-bg border border-error-border text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-error-fg font-medium">
              <ShieldAlert size={16} />
              <span>
                Weight Discrepancy Detected: <strong>+{discrepancy} Kg</strong> overweight. Uncollected Freight Shortfall:{" "}
                <strong>{formatCurrency(calculatedShortfall)}</strong>.
              </span>
            </div>
            <Badge tone="error" size="sm">
              ACTION REQUIRED
            </Badge>
          </div>
        )}
      </Card>

      {/* Audit Log Table */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-foreground">Recent Ramp Weight Verification Logs</span>
            <Badge tone="info">{logs.length} Consignments Screened</Badge>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted font-semibold">
                <th className="text-left py-3 px-4">Waybill Number</th>
                <th className="text-left py-3 px-4">Routing</th>
                <th className="text-right py-3 px-4">Desk Weight</th>
                <th className="text-right py-3 px-4">Ramp Scale</th>
                <th className="text-right py-3 px-4">Variance (Kg)</th>
                <th className="text-right py-3 px-4">Freight Shortfall</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{log.awbNumber}</td>
                  <td className="py-3 px-4 font-mono text-muted">
                    {log.originHub} ➔ {log.destinationHub}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-muted">{log.intakeWeightKg} kg</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                    {log.rampWeightKg} kg
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {log.discrepancyKg > 0.5 ? (
                      <span className="text-error font-bold">+{log.discrepancyKg} kg</span>
                    ) : (
                      <span className="text-success">OK (0.0 kg)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                    {log.chargeShortfall > 0 ? formatCurrency(log.chargeShortfall) : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {log.status === "supplementary_debited" ? (
                      <Badge tone="success" size="sm" dot>
                        Debited & Billed
                      </Badge>
                    ) : log.status === "discrepancy_flagged" ? (
                      <Badge tone="error" size="sm" dot>
                        Flagged Shortfall
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        Verified Match
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.status === "discrepancy_flagged" ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedAudit(log);
                          setShowDebitModal(true);
                        }}
                      >
                        Issue Debit
                      </Button>
                    ) : (
                      <span className="text-muted text-[11px]">Reconciled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supplementary Debit Modal */}
      {selectedAudit && (
        <Modal
          isOpen={showDebitModal}
          onClose={() => setShowDebitModal(false)}
          title="Issue Supplementary Freight Debit"
          description={`Weight discrepancy of +${selectedAudit.discrepancyKg} kg detected on ${selectedAudit.awbNumber}.`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowDebitModal(false)}>
                Ignore Variance
              </Button>
              <Button
                variant="primary"
                iconLeft={DollarSign}
                onClick={() => handleAuthorizeDebit(selectedAudit.id)}
              >
                Authorize Debit ({formatCurrency(selectedAudit.chargeShortfall)})
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-sunken border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted uppercase font-bold">PRIMARY AIR WAYBILL</span>
                <div className="font-mono font-bold text-sm text-foreground">{selectedAudit.awbNumber}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted uppercase font-bold">WEIGHT DISCREPANCY</span>
                <div className="font-mono font-bold text-error text-sm">+{selectedAudit.discrepancyKg} Kg</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-accent-amber/10 border border-accent-amber/30 space-y-1.5">
              <div className="flex justify-between items-center text-foreground font-semibold">
                <span>Supplementary Under-Weight Fee:</span>
                <span className="text-lg font-black font-mono text-foreground">
                  {formatCurrency(selectedAudit.chargeShortfall)}
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Authorizing this will generate a supplementary debit notice against the shipper and prevent cargo release at destination until settled.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
