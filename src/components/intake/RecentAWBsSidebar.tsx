import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/ui";
import { Shipment } from "@/lib/types/database";

export interface RecentAWBsSidebarProps {
  shipments: Shipment[];
  onSelectShipment?: (shipment: Shipment) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const RecentAWBsSidebar: React.FC<RecentAWBsSidebarProps> = ({
  shipments,
  onSelectShipment,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <Card
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icon name="schedule" size={15} className="text-accent-amber" />
            <span className="text-xs font-bold text-foreground">Recent shipments</span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-muted hover:text-foreground transition-colors p-1 rounded cursor-pointer"
              title="Refresh local waybills"
            >
              <Icon name="refresh" size={13} className={isLoading ? "animate-spin text-accent-amber" : ""} />
            </button>
          )}
        </div>
      }
    >
      {shipments.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-muted">
            <Icon name="schedule" size={16} />
          </div>
          <span>No shipments yet today.</span>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle -mx-1">
          {shipments.map((s) => {
            const isPending = s.awb_number.startsWith("PENDING-");
            return (
              <div
                key={s.id}
                className="py-2.5 px-2 flex flex-col gap-1.5 hover:bg-surface-hover rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <Badge tone="warning" size="sm" dot>Syncing</Badge>
                    ) : (
                      <span className="font-mono font-bold text-xs text-foreground tracking-wide">
                        {s.awb_number}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-xs text-foreground">
                    {formatCurrency(s.amount_total)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted">
                  <div className="truncate max-w-[140px]">
                    <span className="text-foreground font-medium">{s.consignee_name}</span>
                  </div>
                  <div className="font-mono flex items-center gap-1">
                    <span>{s.origin_hub_id}</span>
                    <Icon name="arrow_forward" size={10} />
                    <span className="text-foreground font-semibold">{s.destination_hub_id}</span>
                    <span>·</span>
                    <span>{s.weight_kg}kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted">
                    PIN: <strong className="font-mono text-foreground">{s.pickup_pin || "----"}</strong>
                  </span>
                  {onSelectShipment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft="print"
                      className="h-6 text-[10px] px-2"
                      onClick={() => onSelectShipment(s)}
                    >
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
