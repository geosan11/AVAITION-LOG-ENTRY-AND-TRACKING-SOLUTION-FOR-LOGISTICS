import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Disclosure } from "@/components/ui/Disclosure";
import { InfoHint } from "@/components/ui/InfoHint";
import { formatCurrency, AIRPORT_HUBS } from "@/lib/ui";
import { useManifestBuilder } from "./useManifestBuilder";
import { useAwbScannerKeyboard } from "@/lib/useAwbScanner";

const STATUS_CFG: Record<string, { label: string; tone: any; icon: string }> = {
  open:     { label: "Open — adding shipments", tone: "success", icon: "inventory_2"     },
  locked:   { label: "Locked — ready to fly",  tone: "amber",   icon: "lock"            },
  airborne: { label: "In the air",             tone: "info",    icon: "flight_takeoff"  },
  landed:   { label: "Landed",                 tone: "purple",  icon: "flight_land"     },
  closed:   { label: "Closed",                 tone: "neutral", icon: "check_circle"    },
};

const AIRCRAFT_OPTIONS = [
  { value: "Boeing 737-300F", label: "Boeing 737-300F (12,000 kg)" },
  { value: "Boeing 727-200F", label: "Boeing 727-200F  (8,000 kg)"  },
  { value: "ATR 72-500",      label: "ATR 72-500       (6,800 kg)"  },
  { value: "Cessna 208B",     label: "Cessna 208B Caravan (1,700 kg)" },
  { value: "Fokker F27-400",  label: "Fokker F27-400   (5,500 kg)"  },
  { value: "Custom",          label: "Custom / Charter"              },
];

const DEFAULT_CAPACITIES: Record<string, number> = {
  "Boeing 737-300F": 12000, "Boeing 727-200F": 8000,
  "ATR 72-500": 6800, "Cessna 208B": 1700, "Fokker F27-400": 5500, "Custom": 5000,
};

interface FlightManifestBuilderProps {
  tenantId?: string; stationCode?: string; tenantName?: string;
}

export const FlightManifestBuilder: React.FC<FlightManifestBuilderProps> = ({
  tenantId = "demo-tenant", stationCode = "LOS", tenantName: _tenantName = "SpeedWings Express Aviation",
}) => {
  const {
    manifest, manifests, createManifest, selectManifest,
    addAwbToManifest, removeAwbFromManifest, lockManifest,
    dispatchManifest, landManifest,
    totalWeightKg, totalPieces, utilizationPct, isOverloaded,
  } = useManifestBuilder(tenantId, stationCode);

  const [awbInput, setAwbInput] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrigin, setNewOrigin] = useState(stationCode);
  const [newDest, setNewDest] = useState("ABV");
  const [newAirline, setNewAirline] = useState("VK");
  const [newFlight, setNewFlight] = useState("VK-402");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("14:30");
  const [newAircraft, setNewAircraft] = useState("Boeing 737-300F");
  const [newCapacity, setNewCapacity] = useState(12000);
  const [showDispatch, setShowDispatch] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const { scanning, toggleScanning } = useAwbScannerKeyboard({
    onScan: (value) => handleAddAwb(value),
  });

  const handleAddAwb = async (awb?: string) => {
    const value = (awb ?? awbInput).trim().toUpperCase();
    if (!value) return;
    setAdding(true); setScanFeedback(null);
    const result = await addAwbToManifest(value);
    setScanFeedback({ ok: result.success, msg: result.success ? `✓ ${value} added` : (result.error ?? "Something went wrong") });
    if (result.success) setAwbInput("");
    setAdding(false);
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handleCreateManifest = () => {
    createManifest({ originHub: newOrigin, destinationHub: newDest, airlineCode: newAirline,
      flightNumber: newFlight, departureDate: newDate, departureTime: newTime,
      aircraftType: newAircraft, payloadCapacityKg: newCapacity });
    setShowCreate(false);
  };

  const handleDispatch = async () => {
    setDispatching(true);
    const result = await dispatchManifest();
    setDispatchResult(`Flight ${manifest?.flight_number} sent off. ${result.dispatchedCount} shipments marked as departed.`);
    setDispatching(false);
  };

  const barColor = utilizationPct >= 100 ? "bg-error" : utilizationPct >= 85 ? "bg-accent-amber" : "bg-success";
  const hubOptions = AIRPORT_HUBS.map((h) => ({ value: h.code, label: `${h.code} — ${h.city}` }));
  const statusCfg = manifest ? STATUS_CFG[manifest.status] : null;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Icon name="flight_takeoff" size={20} className="text-accent-amber" /> Flights &amp; loading
          </h2>
          <p className="text-xs text-muted mt-0.5">Add shipments to a flight, then lock it and send it off.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" iconLeft="list_alt" onClick={() => setShowList(true)}>All flights ({manifests.length})</Button>
          <Button variant="primary" size="sm" iconLeft="add" onClick={() => setShowCreate(true)}>New flight</Button>
        </div>
      </div>

      {manifest ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-5">

            {/* Flight header */}
            <Card className="border-accent-amber/30 ring-1 ring-accent-amber/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-amber/15 border border-accent-amber/30 text-accent-amber flex items-center justify-center shrink-0">
                    <Icon name="flight_takeoff" size={22} />
                  </div>
                  <div>
                    <div className="font-mono font-black text-lg text-foreground tracking-wide">
                      {manifest.origin_hub_id}<span className="text-accent-amber mx-2">→</span>{manifest.destination_hub_id}
                    </div>
                    <div className="text-xs text-muted">
                      <span className="font-semibold text-foreground">{manifest.flight_number}</span>
                      {" · "}{manifest.departure_date} at {manifest.departure_time}
                      {" · "}{manifest.aircraft_type}
                    </div>
                    <div className="text-[11px] text-muted font-mono mt-0.5">{manifest.manifest_number}</div>
                  </div>
                </div>
                {statusCfg && <Badge tone={statusCfg.tone} dot size="md">{statusCfg.label}</Badge>}
              </div>
              <div className="mt-4 pt-4 border-t border-border-subtle space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-semibold flex items-center gap-1">
                    Weight used <InfoHint term="payloadCapacity" size={12} />
                  </span>
                  <span className={`font-mono font-bold ${isOverloaded ? "text-error" : "text-foreground"}`}>
                    {totalWeightKg.toFixed(1)} / {manifest.payload_capacity_kg.toLocaleString()} kg ({utilizationPct}%)
                    {isOverloaded && " — over the limit"}
                  </span>
                </div>
                <div className="w-full bg-surface-sunken h-3 rounded-full overflow-hidden border border-border-subtle">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, utilizationPct)}%` }} />
                </div>
                <div className="text-[11px] text-muted">
                  <strong className="text-foreground font-mono">{manifest.items.length}</strong> shipments
                  {" · "}<strong className="text-foreground font-mono">{totalPieces}</strong> items
                  {" · "}<strong className="text-foreground font-mono">{(manifest.payload_capacity_kg - totalWeightKg).toFixed(1)} kg</strong> left
                </div>
              </div>
            </Card>

            {/* Add shipment */}
            {manifest.status === "open" && (
              <Card header={
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold text-foreground flex items-center gap-2"><Icon name="barcode_scanner" size={15} className="text-accent-amber" />Add a shipment</span>
                  <button type="button" onClick={toggleScanning}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${scanning ? "bg-accent-amber text-on-accent border-accent-amber" : "text-muted border-border hover:text-foreground"}`}>
                    {scanning ? "● Scanner on" : "Use a scanner"}
                  </button>
                </div>
              }>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <TextField label="Tracking number" placeholder="e.g. LOS-2026-000492"
                      value={awbInput} onChange={(e) => setAwbInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddAwb()}
                      iconLeft={scanning ? "barcode_scanner" : "search"} mono />
                  </div>
                  <Button variant="primary" size="md" iconLeft="add" loading={adding} loadingLabel="Adding…" onClick={() => handleAddAwb()} className="shrink-0">Add</Button>
                </div>
                {scanFeedback && (
                  <div className={`mt-3 p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${scanFeedback.ok ? "bg-success-bg border-success-border text-success-fg" : "bg-error-bg border-error-border text-error-fg"}`}>
                    {scanFeedback.ok ? <Icon name="check_circle" size={14} /> : <Icon name="warning" size={14} />}
                    {scanFeedback.msg}
                  </div>
                )}
                {scanning && (
                  <div className="mt-3 p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-[11px] text-foreground flex items-center gap-2">
                    <Icon name="barcode_scanner" size={14} className="text-accent-amber shrink-0" />
                    Scanner on. Point it at a shipment barcode.
                  </div>
                )}
              </Card>
            )}

            {/* Shipments table */}
            <Card header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-bold text-foreground">Shipments on this flight — {manifest.items.length}</span>
                {manifest.items.length > 0 && <Button variant="secondary" size="sm" iconLeft="print" onClick={() => window.print()}>Print list</Button>}
              </div>
            }>
              {manifest.items.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center gap-3 text-muted">
                  <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center"><Icon name="inventory_2" size={24} className="text-muted" /></div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">No shipments yet</div>
                    <div className="text-xs text-muted mt-1">{manifest.status === "open" ? "Type or scan a tracking number to add one." : "This flight is locked."}</div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted font-semibold">
                        <th className="text-left py-2.5 px-3">#</th>
                        <th className="text-left py-2.5 px-3">Tracking number</th>
                        <th className="text-left py-2.5 px-3">Recipient</th>
                        <th className="text-left py-2.5 px-3">Contents</th>
                        <th className="text-right py-2.5 px-3">Items</th>
                        <th className="text-right py-2.5 px-3">Weight</th>
                        <th className="text-center py-2.5 px-3">Status</th>
                        {manifest.status === "open" && <th className="py-2.5 px-3" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {manifest.items.map((item, idx) => (
                        <tr key={item.shipment.id} className="hover:bg-surface-hover transition-colors group">
                          <td className="py-2.5 px-3 text-muted font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                            {item.shipment.awb_number.startsWith("PENDING-") ? <span className="text-amber-600 text-[10px]">not synced yet</span> : item.shipment.awb_number}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground truncate max-w-[140px]">{item.shipment.consignee_name}</div>
                            <div className="text-muted font-mono text-[10px]">{item.shipment.consignee_phone}</div>
                          </td>
                          <td className="py-2.5 px-3 text-muted max-w-[110px] truncate">{item.shipment.content_type}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">{item.shipment.pieces}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">{item.shipment.weight_kg} kg</td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge tone={item.shipment.status === "manifested" ? "amber" : item.shipment.status === "departed" ? "info" : item.shipment.status === "arrived" ? "success" : "neutral"} size="sm">
                              {item.shipment.status}
                            </Badge>
                          </td>
                          {manifest.status === "open" && (
                            <td className="py-2.5 px-3 text-right">
                              <button type="button" onClick={() => removeAwbFromManifest(item.shipment.id)}
                                className="opacity-0 group-hover:opacity-100 text-error hover:text-error-fg transition-all cursor-pointer p-1 rounded" title="Remove from flight">
                                <Icon name="delete" size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-surface-sunken font-bold text-xs">
                        <td colSpan={4} className="py-2.5 px-3 text-muted text-right">Total</td>
                        <td className="py-2.5 px-3 text-right font-mono text-foreground">{totalPieces}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-foreground">{totalWeightKg.toFixed(1)} kg</td>
                        <td colSpan={manifest.status === "open" ? 2 : 1} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <Card className="border-accent-amber/30 ring-1 ring-accent-amber/10"
              header={<span className="text-sm font-bold text-foreground flex items-center gap-2"><Icon name="send" size={15} className="text-accent-amber" />Next steps</span>}>
              <div className="flex flex-col gap-3">
                {manifest.status === "open" && (
                  <>
                    <div className="text-xs text-muted p-2.5 rounded-lg bg-surface-sunken border border-border-subtle">
                      Add all shipments, <strong className="text-foreground">lock</strong> the flight, then <strong className="text-foreground">send it off</strong>.
                    </div>
                    <Button variant="secondary" fullWidth iconLeft="lock" onClick={lockManifest} disabled={manifest.items.length === 0}>Lock flight ({manifest.items.length} shipments)</Button>
                    <Button variant="primary" fullWidth iconLeft="flight_takeoff" disabled={manifest.items.length === 0} onClick={() => setShowDispatch(true)}>Send flight off →</Button>
                  </>
                )}
                {manifest.status === "locked" && (
                  <>
                    <div className="p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-xs text-foreground flex items-center gap-2">
                      <Icon name="lock" size={14} className="text-accent-amber shrink-0" />Flight locked. Ready to send.
                    </div>
                    <Button variant="primary" fullWidth iconLeft="flight_takeoff" onClick={() => setShowDispatch(true)}>Send flight off →</Button>
                  </>
                )}
                {manifest.status === "airborne" && (
                  <>
                    <div className="p-3 rounded-lg bg-info-bg border border-info-border text-xs text-info-fg flex items-center gap-2">
                      <Icon name="flight_takeoff" size={14} className="shrink-0" />Flight {manifest.flight_number} is in the air with {manifest.items.length} shipments.
                    </div>
                    <Button variant="primary" fullWidth iconLeft="flight_land" onClick={landManifest}>Mark as landed</Button>
                  </>
                )}
                {(manifest.status === "landed" || manifest.status === "closed") && (
                  <div className="p-3 rounded-lg bg-success-bg border border-success-border text-xs text-success-fg flex items-center gap-2">
                    <Icon name="check_circle" size={14} className="shrink-0" />Flight landed. All {manifest.items.length} shipments are now at {manifest.destination_hub_id}.
                  </div>
                )}
              </div>
            </Card>

            <Card header={<span className="text-sm font-bold text-foreground flex items-center gap-2"><Icon name="scale" size={15} className="text-accent-amber" />Summary</span>}>
              <div className="space-y-2.5">
                {[
                  { label: "Aircraft",     value: manifest.aircraft_type },
                  { label: "Weight limit", value: `${manifest.payload_capacity_kg.toLocaleString()} kg` },
                  { label: "Shipments",    value: `${manifest.items.length}` },
                  { label: "Items",        value: `${totalPieces}` },
                  { label: "Total weight", value: `${totalWeightKg.toFixed(1)} kg` },
                  { label: "Weight left",  value: `${(manifest.payload_capacity_kg - totalWeightKg).toFixed(1)} kg` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-xs border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                    <span className="text-muted">{row.label}</span>
                    <span className="font-mono font-bold text-foreground">{row.value}</span>
                  </div>
                ))}
                {isOverloaded && (
                  <div className="p-2.5 rounded-lg bg-error-bg border border-error-border text-error-fg text-xs flex items-center gap-2">
                    <Icon name="warning" size={14} className="shrink-0" />Over the weight limit by {(totalWeightKg - manifest.payload_capacity_kg).toFixed(1)} kg.
                  </div>
                )}
              </div>
            </Card>

            {manifest.items.length > 0 && (
              <Disclosure label="Money" persistKey="manifest-money">
                <div className="space-y-2 text-xs pt-2">
                  <div className="flex justify-between"><span className="text-muted">Total price</span><span className="font-mono font-bold text-foreground">{formatCurrency(manifest.items.reduce((s, i) => s + i.shipment.amount_total, 0))}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Paid</span><span className="font-mono font-bold text-success">{formatCurrency(manifest.items.reduce((s, i) => s + i.shipment.amount_paid, 0))}</span></div>
                  <div className="flex justify-between border-t border-border-subtle pt-2"><span className="text-muted font-semibold">Still owed</span><span className="font-mono font-bold text-error">{formatCurrency(manifest.items.reduce((s, i) => s + i.shipment.balance_due, 0))}</span></div>
                </div>
              </Disclosure>
            )}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-muted flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center"><Icon name="flight" size={28} className="text-muted" /></div>
          <div><div className="font-bold text-foreground">No flight selected</div><div className="text-xs text-muted mt-1">Create a flight to start adding shipments.</div></div>
          <Button variant="primary" iconLeft="add" onClick={() => setShowCreate(true)}>Create a flight</Button>
        </div>
      )}

      {/* Create flight modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New flight" description="Set the route, time, and aircraft."
        footer={<><Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="primary" iconLeft="flight" onClick={handleCreateManifest}>Create flight</Button></>}>
        <div className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Select label="From" value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)} options={hubOptions} />
            <Select label="To" value={newDest} onChange={(e) => setNewDest(e.target.value)} options={hubOptions.filter((h) => h.value !== newOrigin)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Airline code" value={newAirline} onChange={(e) => setNewAirline(e.target.value.toUpperCase())} placeholder="e.g. VK" mono />
            <TextField label="Flight number" value={newFlight} onChange={(e) => setNewFlight(e.target.value.toUpperCase())} placeholder="e.g. VK-402" mono />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            <TextField label="Time" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
          <Select label="Aircraft" value={newAircraft} onChange={(e) => { setNewAircraft(e.target.value); setNewCapacity(DEFAULT_CAPACITIES[e.target.value] ?? 5000); }} options={AIRCRAFT_OPTIONS} />
          <TextField label="Weight limit (kg)" type="number" value={newCapacity} onChange={(e) => setNewCapacity(Number(e.target.value))} mono hint="The most this aircraft can carry" />
        </div>
      </Modal>

      {/* Send-off modal */}
      <Modal isOpen={showDispatch} onClose={() => { setShowDispatch(false); setDispatchResult(null); }} title="Send this flight off?"
        description={manifest ? `This marks Flight ${manifest.flight_number} and all ${manifest.items.length} shipments as departed.` : ""}
        footer={dispatchResult ? (
          <Button variant="primary" onClick={() => { setShowDispatch(false); setDispatchResult(null); }}>Done</Button>
        ) : (
          <><Button variant="ghost" onClick={() => setShowDispatch(false)}>Cancel</Button>
          <Button variant="primary" iconLeft="flight_takeoff" loading={dispatching} loadingLabel="Sending…" onClick={handleDispatch}>Send off</Button></>
        )}>
        {dispatchResult ? (
          <div className="p-4 rounded-xl bg-success-bg border border-success-border text-success-fg text-sm flex items-center gap-3"><Icon name="check_circle" size={20} /><span>{dispatchResult}</span></div>
        ) : (
          <div className="flex flex-col gap-4 text-xs">
            {isOverloaded && <div className="p-3 rounded-lg bg-error-bg border border-error-border text-error-fg flex items-center gap-2"><Icon name="warning" size={14} className="shrink-0" /><strong>Over the weight limit</strong> by {(totalWeightKg - (manifest?.payload_capacity_kg ?? 0)).toFixed(1)} kg.</div>}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ label: "Shipments", value: `${manifest?.items.length}` }, { label: "Items", value: `${totalPieces}` }, { label: "Weight", value: `${totalWeightKg.toFixed(1)} kg` }].map((kpi) => (
                <div key={kpi.label} className="p-3 rounded-lg bg-surface-sunken border border-border-subtle"><div className="text-muted text-[10px]">{kpi.label}</div><div className="font-black font-mono text-lg text-foreground">{kpi.value}</div></div>
              ))}
            </div>
            <p className="text-muted">This marks every shipment as departed. You can't undo it.</p>
          </div>
        )}
      </Modal>

      {/* All flights modal */}
      <Modal isOpen={showList} onClose={() => setShowList(false)} title="All flights" description={`${manifests.length} flights at ${stationCode}.`}>
        <div className="flex flex-col divide-y divide-border-subtle">
          {manifests.map((m) => {
            const cfg = STATUS_CFG[m.status];
            return (
              <button key={m.id} type="button" onClick={() => { selectManifest(m.id); setShowList(false); }}
                className="flex items-center justify-between p-3 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer text-left group">
                <div>
                  <div className="font-mono font-bold text-sm text-foreground">{m.flight_number}</div>
                  <div className="text-[11px] text-muted">{m.manifest_number} · {m.origin_hub_id} → {m.destination_hub_id} · {m.departure_date}</div>
                  <div className="text-[11px] text-muted">{m.items.length} shipments</div>
                </div>
                <div className="flex items-center gap-2">
                  {cfg && <Badge tone={cfg.tone} size="sm">{m.status}</Badge>}
                  <Icon name="chevron_right" size={14} className="text-muted group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
