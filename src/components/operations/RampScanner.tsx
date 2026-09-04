import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Scan, QrCode, Search, CheckCircle2, AlertTriangle,
  Package, Send, Zap, CameraOff, List,
} from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import { queueSyncItem } from "@/lib/offline/sync";
import type { Shipment, ShipmentStatus } from "@/lib/types/database";

// ── Status transition map ─────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  draft:            ["received"],
  received:         ["security_cleared"],
  security_cleared: ["manifested"],
  manifested:       ["departed"],
  departed:         ["arrived"],
  arrived:          ["delivered"],
  delivered:        [],
  returned:         [],
};

const STATUS_TONE: Record<ShipmentStatus, any> = {
  draft:            "neutral",
  received:         "neutral",
  security_cleared: "info",
  manifested:       "amber",
  departed:         "info",
  arrived:          "success",
  delivered:        "success",
  returned:         "error",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScannedItem {
  id: string;
  awb: string;
  shipment: Shipment;
  targetStatus: ShipmentStatus;
  committed: boolean;
  error?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface RampScannerProps {
  tenantId?: string;
  stationCode?: string;
}

export const RampScanner: React.FC<RampScannerProps> = ({
  tenantId: _tenantId = "demo-tenant",
  stationCode = "LOS",
}) => {
  const [mode, setMode] = useState<"idle" | "scanning" | "batch">("idle");
  const [manualInput, setManualInput] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [looking, setLooking] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [committing, setCommitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [commitResult, setCommitResult] = useState<string | null>(null);

  // Keyboard barcode scanner buffer
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  const lookupShipment = useCallback(async (awb: string): Promise<Shipment | null> => {
    const clean = awb.trim().toUpperCase();
    try {
      const found = await offlineDb.local_shipments.where("awb_number").equals(clean).first();
      return found ?? null;
    } catch {
      return null;
    }
  }, []);

  const processScannedAwb = useCallback(async (rawValue: string) => {
    const awb = rawValue.trim().toUpperCase();
    if (!awb || awb.length < 5) return;

    // Duplicate check
    if (scannedItems.some((i) => i.awb === awb)) {
      setLastFeedback({ ok: false, msg: `${awb} already in batch` });
      setTimeout(() => setLastFeedback(null), 2000);
      return;
    }

    setLooking(true);
    setLastFeedback(null);
    const shipment = await lookupShipment(awb);

    if (!shipment) {
      setLastFeedback({ ok: false, msg: `AWB "${awb}" not found in station records` });
      setLooking(false);
      setTimeout(() => setLastFeedback(null), 3000);
      return;
    }

    const nextStatuses = ALLOWED_TRANSITIONS[shipment.status];
    if (!nextStatuses.length) {
      setLastFeedback({ ok: false, msg: `${awb} is at final status "${shipment.status}"` });
      setLooking(false);
      setTimeout(() => setLastFeedback(null), 3000);
      return;
    }

    const targetStatus = nextStatuses[0];
    const item: ScannedItem = {
      id: crypto.randomUUID(),
      awb,
      shipment,
      targetStatus,
      committed: false,
    };
    setScannedItems((prev) => [item, ...prev]);
    setLastFeedback({ ok: true, msg: `\u2713 ${awb} \u2014 Ready to mark ${targetStatus.replace("_", " ").toUpperCase()}` });
    setLooking(false);
    setTimeout(() => setLastFeedback(null), 2500);
  }, [scannedItems, lookupShipment]);

  // Keyboard scanner detection
  useEffect(() => {
    if (mode !== "scanning") return;

    const handleKey = (e: KeyboardEvent) => {
      const now = Date.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const scanned = bufferRef.current.trim();
        bufferRef.current = "";
        if (scanned.length >= 5) processScannedAwb(scanned);
        return;
      }
      if (delta > 80 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }
      if (e.key.length === 1) bufferRef.current += e.key;
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mode, processScannedAwb]);

  const handleManualAdd = async () => {
    if (!manualInput.trim()) return;
    await processScannedAwb(manualInput);
    setManualInput("");
  };

  const removeItem = (id: string) => {
    setScannedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCommitAll = async () => {
    setCommitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of scannedItems.filter((i) => !i.committed)) {
      try {
        // Queue for offline sync
        await queueSyncItem(
          "shipments",
          "UPDATE",
          {
            id: item.shipment.id,
            status: item.targetStatus,
            updated_at: new Date().toISOString(),
          }
        );

        // Optimistic local update
        await offlineDb.local_shipments
          .where("id").equals(item.shipment.id)
          .modify({ status: item.targetStatus, updated_at: new Date().toISOString() });

        setScannedItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, committed: true } : i))
        );
        successCount++;
      } catch (err) {
        setScannedItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, error: "Sync failed" } : i))
        );
        failCount++;
      }
    }

    setCommitResult(
      failCount === 0
        ? `\u2713 ${successCount} shipment${successCount !== 1 ? "s" : ""} updated successfully and queued for sync.`
        : `${successCount} updated, ${failCount} failed. Failed items will retry on next sync.`
    );
    setCommitting(false);
    setShowConfirm(false);
  };

  const uncommitted = scannedItems.filter((i) => !i.committed);
  const committed = scannedItems.filter((i) => i.committed);

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Scan size={20} className="text-accent-amber" />
            Ramp Barcode Scanner
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Scan cargo AWB barcodes on the tarmac to batch-update shipment statuses. Works offline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={mode === "scanning" ? "success" : "neutral"} dot>
            {mode === "scanning" ? "Scanner Active" : "Scanner Off"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: scanner controls */}
        <div className="lg:col-span-5 flex flex-col gap-5">

          {/* Scanner toggle */}
          <Card className={mode === "scanning" ? "border-success/40 ring-1 ring-success/20" : ""}>
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all ${
                mode === "scanning"
                  ? "bg-success/10 border-success text-success animate-pulse"
                  : "bg-surface-2 border-border text-muted"
              }`}>
                {mode === "scanning" ? <Scan size={36} /> : <QrCode size={36} />}
              </div>

              {mode === "scanning" ? (
                <>
                  <div>
                    <div className="font-bold text-foreground">Scanner is Active</div>
                    <div className="text-xs text-muted mt-1">Point your barcode scanner at any cargo AWB label.</div>
                  </div>
                  <Button variant="destructive" iconLeft={CameraOff} onClick={() => setMode("idle")}>
                    Stop Scanning
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <div className="font-bold text-foreground">USB / Bluetooth Scanner</div>
                    <div className="text-xs text-muted mt-1">Connect your barcode scanner and click Start. Scan multiple AWBs, then commit all at once.</div>
                  </div>
                  <Button variant="primary" iconLeft={Scan} onClick={() => setMode("scanning")}>
                    Start Scanning
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Manual entry */}
          <Card header={<span className="text-sm font-bold text-foreground flex items-center gap-2"><Search size={14} className="text-accent-amber" />Manual AWB Lookup</span>}>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <TextField
                  label="Enter AWB Number"
                  placeholder="e.g. LOS-2026-000492"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                  mono
                />
              </div>
              <Button variant="secondary" size="md" iconLeft={Search} loading={looking} loadingLabel="..." onClick={handleManualAdd} className="shrink-0">
                Find
              </Button>
            </div>
          </Card>

          {/* Scan feedback */}
          {lastFeedback && (
            <div className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
              lastFeedback.ok
                ? "bg-success-bg border-success-border text-success-fg"
                : "bg-error-bg border-error-border text-error-fg"
            }`}>
              {lastFeedback.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {lastFeedback.msg}
            </div>
          )}

          {/* Commit result */}
          {commitResult && (
            <div className="p-3 rounded-xl bg-success-bg border border-success-border text-success-fg text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              {commitResult}
            </div>
          )}

          {/* Commit button */}
          {uncommitted.length > 0 && (
            <Card className="border-accent-amber/30 ring-1 ring-accent-amber/10">
              <div className="flex flex-col gap-3">
                <div className="text-xs text-muted">
                  <strong className="text-foreground">{uncommitted.length}</strong> shipment{uncommitted.length !== 1 ? "s" : ""} ready to commit. Once committed, statuses will be updated and synced to the server.
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  iconLeft={Send}
                  onClick={() => setShowConfirm(true)}
                >
                  Commit {uncommitted.length} Status Update{uncommitted.length !== 1 ? "s" : ""}
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setScannedItems([])}
                >
                  Clear All
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right: scanned items list */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <List size={15} className="text-accent-amber" />
                  Scanned Batch — {scannedItems.length} Item{scannedItems.length !== 1 ? "s" : ""}
                </span>
                {committed.length > 0 && (
                  <Badge tone="success" size="sm">{committed.length} committed</Badge>
                )}
              </div>
            }
          >
            {scannedItems.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center gap-3 text-muted">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
                  <Scan size={24} className="text-muted" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">No scans yet</div>
                  <div className="text-xs text-muted mt-1">
                    Activate the scanner and scan AWB barcodes on cargo labels to build a batch.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border-subtle">
                {scannedItems.map((item) => (
                  <div key={item.id} className={`flex items-center gap-3 py-3 px-1 group ${item.committed ? "opacity-60" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      item.committed ? "bg-success-bg border-success-border text-success-fg"
                      : item.error ? "bg-error-bg border-error-border text-error-fg"
                      : "bg-accent-amber/10 border-accent-amber/30 text-accent-amber"
                    }`}>
                      {item.committed ? <CheckCircle2 size={14} /> : item.error ? <AlertTriangle size={14} /> : <Package size={14} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">{item.awb}</span>
                        <Badge tone={STATUS_TONE[item.shipment.status]} size="sm">{item.shipment.status.replace("_", " ")}</Badge>
                        {!item.committed && !item.error && (
                          <>
                            <span className="text-muted text-xs">\u2192</span>
                            <Badge tone="amber" size="sm">{item.targetStatus.replace("_", " ")}</Badge>
                          </>
                        )}
                        {item.committed && <Badge tone="success" size="sm">Updated</Badge>}
                        {item.error && <Badge tone="error" size="sm">{item.error}</Badge>}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 truncate">
                        {item.shipment.consignee_name} \u00b7 {item.shipment.pieces} pcs \u00b7 {item.shipment.weight_kg} kg
                      </div>
                    </div>

                    {!item.committed && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-all p-1 rounded text-xs shrink-0 cursor-pointer"
                        title="Remove from batch"
                      >
                        \u2715
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick status guide */}
          <Card header={<span className="text-sm font-bold text-foreground flex items-center gap-2"><Zap size={14} className="text-accent-amber" />Status Flow Guide</span>}>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["received", "security_cleared", "manifested", "departed", "arrived", "delivered"] as ShipmentStatus[]).map((status, idx, arr) => (
                <React.Fragment key={status}>
                  <Badge tone={STATUS_TONE[status]} size="sm">{status.replace("_", " ")}</Badge>
                  {idx < arr.length - 1 && <span className="text-muted self-center">\u2192</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-3">
              The scanner auto-detects the correct next status for each AWB. Scan security-cleared cargo at the ramp to batch-mark it as MANIFESTED or DEPARTED.
            </p>
          </Card>
        </div>
      </div>

      {/* Commit Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Commit Status Updates"
        description={`Update ${uncommitted.length} shipment${uncommitted.length !== 1 ? "s" : ""} and sync to server?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="primary" iconLeft={Send} loading={committing} loadingLabel="Committing..." onClick={handleCommitAll}>
              Commit {uncommitted.length} Update{uncommitted.length !== 1 ? "s" : ""}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface-sunken border border-border-subtle">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-muted">Shipments</div><div className="font-mono font-black text-lg text-foreground">{uncommitted.length}</div></div>
              <div><div className="text-muted">Station</div><div className="font-mono font-black text-lg text-foreground">{stationCode}</div></div>
              <div><div className="text-muted">Time</div><div className="font-mono font-bold text-foreground">{new Date().toLocaleTimeString()}</div></div>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
            {uncommitted.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-border-subtle">
                <span className="font-mono font-bold text-foreground">{item.awb}</span>
                <div className="flex items-center gap-1.5">
                  <Badge tone={STATUS_TONE[item.shipment.status]} size="sm">{item.shipment.status.replace("_", " ")}</Badge>
                  <span className="text-muted">\u2192</span>
                  <Badge tone="amber" size="sm">{item.targetStatus.replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted">
            Changes are applied locally and queued for server sync. If offline, they will sync automatically when connectivity is restored.
          </p>
        </div>
      </Modal>
    </div>
  );
};
