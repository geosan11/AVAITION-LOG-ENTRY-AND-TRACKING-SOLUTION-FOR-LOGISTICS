import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
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
      setLastFeedback({ ok: false, msg: `${awb} is already in the list` });
      setTimeout(() => setLastFeedback(null), 2000);
      return;
    }

    setLooking(true);
    setLastFeedback(null);
    const shipment = await lookupShipment(awb);

    if (!shipment) {
      setLastFeedback({ ok: false, msg: `Tracking number ${awb} not found` });
      setLooking(false);
      setTimeout(() => setLastFeedback(null), 3000);
      return;
    }

    const nextStatuses = ALLOWED_TRANSITIONS[shipment.status];
    if (!nextStatuses.length) {
      setLastFeedback({ ok: false, msg: `${awb} is already at the last step` });
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
    setLastFeedback({ ok: true, msg: `✓ ${awb} — will move to ${targetStatus.replace("_", " ")}` });
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
          prev.map((i) => (i.id === item.id ? { ...i, error: "Could not save" } : i))
        );
        failCount++;
      }
    }

    setCommitResult(
      failCount === 0
        ? `✓ ${successCount} shipment${successCount !== 1 ? "s" : ""} updated. Syncs when online.`
        : `${successCount} updated, ${failCount} failed. Failed ones will retry on the next sync.`
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
            <Icon name="barcode_scanner" size={20} className="text-accent-amber" />
            Scan cargo
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Scan shipment barcodes to move them to the next step. Works offline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={mode === "scanning" ? "success" : "neutral"} dot>
            {mode === "scanning" ? "Scanning" : "Not scanning"}
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
                {mode === "scanning" ? <Icon name="barcode_scanner" size={36} /> : <Icon name="qr_code_2" size={36} />}
              </div>

              {mode === "scanning" ? (
                <>
                  <div>
                    <div className="font-bold text-foreground">Scanning</div>
                    <div className="text-xs text-muted mt-1">Point the scanner at a shipment barcode.</div>
                  </div>
                  <Button variant="destructive" iconLeft="videocam_off" onClick={() => setMode("idle")}>
                    Stop
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <div className="font-bold text-foreground">Barcode scanner</div>
                    <div className="text-xs text-muted mt-1">Connect your scanner and press Start. Scan several shipments, then save them all at once.</div>
                  </div>
                  <Button variant="primary" iconLeft="barcode_scanner" onClick={() => setMode("scanning")}>
                    Start
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Manual entry */}
          <Card header={<span className="text-sm font-bold text-foreground flex items-center gap-2"><Icon name="search" size={14} className="text-accent-amber" />Type a tracking number</span>}>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <TextField
                  label="Tracking number"
                  placeholder="e.g. LOS-2026-000492"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                  mono
                />
              </div>
              <Button variant="secondary" size="md" iconLeft="search" loading={looking} loadingLabel="…" onClick={handleManualAdd} className="shrink-0">
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
              {lastFeedback.ok ? <Icon name="check_circle" size={16} /> : <Icon name="warning" size={16} />}
              {lastFeedback.msg}
            </div>
          )}

          {/* Commit result */}
          {commitResult && (
            <div className="p-3 rounded-xl bg-success-bg border border-success-border text-success-fg text-sm flex items-center gap-2">
              <Icon name="check_circle" size={16} />
              {commitResult}
            </div>
          )}

          {/* Commit button */}
          {uncommitted.length > 0 && (
            <Card className="border-accent-amber/30 ring-1 ring-accent-amber/10">
              <div className="flex flex-col gap-3">
                <div className="text-xs text-muted">
                  <strong className="text-foreground">{uncommitted.length}</strong> ready. Saving updates their status and syncs when online.
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  iconLeft="send"
                  onClick={() => setShowConfirm(true)}
                >
                  Save {uncommitted.length} update{uncommitted.length !== 1 ? "s" : ""}
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setScannedItems([])}
                >
                  Clear list
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
                  <Icon name="list_alt" size={15} className="text-accent-amber" />
                  Scanned — {scannedItems.length}
                </span>
                {committed.length > 0 && (
                  <Badge tone="success" size="sm">{committed.length} saved</Badge>
                )}
              </div>
            }
          >
            {scannedItems.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center gap-3 text-muted">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
                  <Icon name="barcode_scanner" size={24} className="text-muted" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">Nothing scanned yet</div>
                  <div className="text-xs text-muted mt-1">
                    Turn on the scanner and scan shipment barcodes.
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
                      {item.committed ? <Icon name="check_circle" size={14} /> : item.error ? <Icon name="warning" size={14} /> : <Icon name="package_2" size={14} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">{item.awb}</span>
                        <Badge tone={STATUS_TONE[item.shipment.status]} size="sm">{item.shipment.status.replace("_", " ")}</Badge>
                        {!item.committed && !item.error && (
                          <>
                            <span className="text-muted text-xs">→</span>
                            <Badge tone="amber" size="sm">{item.targetStatus.replace("_", " ")}</Badge>
                          </>
                        )}
                        {item.committed && <Badge tone="success" size="sm">Updated</Badge>}
                        {item.error && <Badge tone="error" size="sm">{item.error}</Badge>}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 truncate">
                        {item.shipment.consignee_name} · {item.shipment.pieces} items · {item.shipment.weight_kg} kg
                      </div>
                    </div>

                    {!item.committed && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-all p-1 rounded text-xs shrink-0 cursor-pointer"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick status guide */}
          <Card header={<span className="text-sm font-bold text-foreground flex items-center gap-2"><Icon name="bolt" size={14} className="text-accent-amber" />What the statuses mean</span>}>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["received", "security_cleared", "manifested", "departed", "arrived", "delivered"] as ShipmentStatus[]).map((status, idx, arr) => (
                <React.Fragment key={status}>
                  <Badge tone={STATUS_TONE[status]} size="sm">{status.replace("_", " ")}</Badge>
                  {idx < arr.length - 1 && <span className="text-muted self-center">→</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-3">
              The scanner picks the right next step for each shipment automatically.
            </p>
          </Card>
        </div>
      </div>

      {/* Commit Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Update shipments?"
        description={`This moves ${uncommitted.length} shipment${uncommitted.length !== 1 ? "s" : ""} to the next step, and syncs when online.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="primary" iconLeft="send" loading={committing} loadingLabel="Saving…" onClick={handleCommitAll}>
              Update {uncommitted.length}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface-sunken border border-border-subtle">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-muted">Shipments</div><div className="font-mono font-black text-lg text-foreground">{uncommitted.length}</div></div>
              <div><div className="text-muted">Location</div><div className="font-mono font-black text-lg text-foreground">{stationCode}</div></div>
              <div><div className="text-muted">Time</div><div className="font-mono font-bold text-foreground">{new Date().toLocaleTimeString()}</div></div>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
            {uncommitted.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-border-subtle">
                <span className="font-mono font-bold text-foreground">{item.awb}</span>
                <div className="flex items-center gap-1.5">
                  <Badge tone={STATUS_TONE[item.shipment.status]} size="sm">{item.shipment.status.replace("_", " ")}</Badge>
                  <span className="text-muted">→</span>
                  <Badge tone="amber" size="sm">{item.targetStatus.replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted">
            Saved on this device now. Syncs automatically when you're back online.
          </p>
        </div>
      </Modal>
    </div>
  );
};
