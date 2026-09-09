import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase";
import { offlineDb } from "@/lib/offline/db";

export interface TrackingTimelineStep {
  key: string;
  label: string;
  description: string;
  icon: string;
  done: boolean;
  current: boolean;
  timestamp?: string;
}

export interface PublicTrackingPageProps {
  initialAwb?: string;
  tenantName?: string;
  isWhiteLabel?: boolean;
}

export const PublicTrackingPage: React.FC<PublicTrackingPageProps> = ({
  initialAwb = "",
  tenantName = "SpeedWings Express Aviation",
  isWhiteLabel = false,
}) => {
  const [searchAwb, setSearchAwb] = useState(initialAwb);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<any | null>(null);

  const handleTrack = async (awbToSearch?: string) => {
    const query = (awbToSearch || searchAwb).trim().toUpperCase();
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Try public RPC first
      const { data, error: rpcError } = await supabase.rpc("track_shipment", {
        p_awb_number: query,
      });

      if (!rpcError && data && data.length > 0) {
        setShipment(data[0]);
        setLoading(false);
        return;
      }

      // 2. Fallback to offline Dexie DB if local or offline
      const local = await offlineDb.local_shipments
        .where("awb_number")
        .equals(query)
        .first();

      if (local) {
        setShipment({
          awb_number: local.awb_number,
          type: local.type,
          status: local.status,
          pieces: local.pieces,
          weight_kg: local.weight_kg,
          flight_number: local.flight_number,
          flight_date: local.flight_date,
          delivered_at: local.status === "delivered" ? local.updated_at : null,
          origin_code: local.origin_hub_id,
          origin_city: "Departure Station",
          destination_code: local.destination_hub_id,
          destination_city: "Arrival Station",
        });
        setLoading(false);
        return;
      }

      setError(`We couldn't find a shipment with tracking number "${query}".`);
      setShipment(null);
    } catch {
      setError("Couldn't reach the tracking service. Check your connection and try again.");
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAwb) {
      handleTrack(initialAwb);
    }
  }, [initialAwb]);

  const getTimeline = (status: string): TrackingTimelineStep[] => {
    const statuses = [
      { key: "received", label: "Received", desc: "Taken in at the airport cargo desk", icon: "package_2" },
      { key: "security_cleared", label: "Security checked", desc: "Passed the airport security scan", icon: "verified_user" },
      { key: "manifested", label: "Added to a flight", desc: `On flight ${shipment?.flight_number || "(to be set)"}`, icon: "flight_takeoff" },
      { key: "departed", label: "In the air", desc: "The flight has left", icon: "arrow_forward" },
      { key: "arrived", label: "Arrived", desc: "At the destination airport, ready for collection", icon: "location_on" },
      { key: "delivered", label: "Collected", desc: "Handed to the recipient after they showed the PIN", icon: "check_circle" },
    ];

    const currentIndex = statuses.findIndex((s) => s.key === status);
    const resolvedIndex = currentIndex === -1 ? 0 : currentIndex;

    return statuses.map((s, idx) => ({
      key: s.key,
      label: s.label,
      description: s.desc,
      icon: s.icon,
      done: idx <= resolvedIndex,
      current: idx === resolvedIndex,
    }));
  };

  const timeline = shipment ? getTimeline(shipment.status) : [];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-4">
      {/* Top Hero Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-amber/15 text-accent-amber text-xs font-semibold border border-accent-amber/30">
          <Icon name="flight_takeoff" size={14} /> Shipment tracking
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Track your shipment
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
          Enter the tracking number from your receipt to see where your shipment is.
        </p>
      </div>

      {/* AWB Search Card */}
      <Card className="p-4 sm:p-6 shadow-sm border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <TextField
              placeholder="e.g. LOS-2026-000492"
              value={searchAwb}
              onChange={(e) => setSearchAwb(e.target.value)}
              iconLeft="search"
              mono
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            loadingLabel="Searching…"
            iconLeft="search"
          >
            Track
          </Button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle text-xs text-muted">
          <span>Try:</span>
          {["LOS-2026-000492", "ABV-2026-000104"].map((awb) => (
            <button
              key={awb}
              type="button"
              onClick={() => {
                setSearchAwb(awb);
                handleTrack(awb);
              }}
              className="font-mono text-accent-amber hover:underline cursor-pointer bg-surface-2 px-2 py-0.5 rounded text-[11px]"
            >
              {awb}
            </button>
          ))}
        </div>
      </Card>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-error-bg border border-error-border text-error-fg text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Active Shipment Tracking Details */}
      {shipment && (
        <div className="flex flex-col gap-6">
          {/* Flight Route & Summary Card */}
          <Card className="border-accent-amber/30 ring-1 ring-accent-amber/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                  Tracking number
                </span>
                <span className="text-xl font-black font-mono text-foreground tracking-wide">
                  {shipment.awb_number}
                </span>
                <div className="text-xs text-muted mt-0.5">
                  Sent by <strong className="text-foreground">{tenantName}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    shipment.status === "delivered"
                      ? "success"
                      : shipment.status === "departed"
                      ? "info"
                      : "amber"
                  }
                  size="md"
                  dot
                >
                  {shipment.status?.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {/* Hub To Hub Visual Indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 items-center text-center sm:text-left">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-muted">FROM</div>
                <div className="text-2xl font-black font-mono text-foreground">{shipment.origin_code}</div>
                <div className="text-xs text-muted">{shipment.origin_city}</div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="font-mono text-xs font-bold text-accent-amber bg-accent-amber/10 px-2.5 py-0.5 rounded-full border border-accent-amber/20">
                  FLIGHT {shipment.flight_number || "SCHEDULED"}
                </div>
                <div className="w-full flex items-center justify-center gap-2">
                  <div className="h-0.5 flex-1 bg-border" />
                  <Icon name="flight" size={18} className="text-accent-amber rotate-90" />
                  <div className="h-0.5 flex-1 bg-border" />
                </div>
                <div className="text-[10px] text-muted">
                  {shipment.flight_date ? `Date: ${shipment.flight_date}` : "Not scheduled yet"}
                </div>
              </div>

              <div className="space-y-1 text-center sm:text-right">
                <div className="text-[10px] uppercase font-bold text-muted">TO</div>
                <div className="text-2xl font-black font-mono text-foreground">{shipment.destination_code}</div>
                <div className="text-xs text-muted">{shipment.destination_city}</div>
              </div>
            </div>

            {/* Key specs */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border text-xs">
              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle">
                <span className="text-muted block text-[10px]">ITEMS</span>
                <span className="font-mono font-bold text-foreground text-sm">{shipment.pieces}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle">
                <span className="text-muted block text-[10px]">WEIGHT</span>
                <span className="font-mono font-bold text-foreground text-sm">{shipment.weight_kg} kg</span>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
              <Icon name="verified_user" size={13} className="text-success" />
              Security checked · the recipient needs the collection PIN
            </p>
          </Card>

          {/* Vertical Progress Timeline */}
          <Card
            header={
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Icon name="schedule" size={16} className="text-accent-amber" /> Progress
              </span>
            }
          >
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {timeline.map((step) => {
                                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        step.current
                          ? "bg-accent-amber border-accent-amber text-on-accent ring-4 ring-accent-amber/20"
                          : step.done
                          ? "bg-success border-success text-white"
                          : "bg-surface-2 border-border text-muted"
                      }`}
                    >
                      <Icon name={step.icon} size={14} />
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold ${
                            step.current
                              ? "text-accent-amber"
                              : step.done
                              ? "text-foreground"
                              : "text-muted"
                          }`}
                        >
                          {step.label}
                        </span>
                        {step.current && (
                          <Badge tone="amber" size="sm">
                            Now
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* WhatsApp Support & Self-Service Banner */}
          <div className="p-5 rounded-2xl bg-surface-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                <Icon name="chat" size={16} className="text-success" />
                Need help with this shipment?
              </h4>
              <p className="text-xs text-muted">
                Message the airport cargo desk on WhatsApp.
              </p>
            </div>
            <a
              href={`https://wa.me/2348000000000?text=Hello%2C%20I%27m%20tracking%20shipment%20${shipment.awb_number}%20and%20need%20help.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-success text-white text-xs font-bold hover:bg-success/90 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              <Icon name="chat" size={14} /> Chat on WhatsApp <Icon name="open_in_new" size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      {!isWhiteLabel && (
        <div className="text-center pt-4 text-xs text-muted">
          Powered by <strong className="text-foreground">AeroLogistics</strong>
        </div>
      )}
    </div>
  );
};
