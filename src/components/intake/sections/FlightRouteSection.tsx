import React from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { AIRPORT_HUBS } from "@/lib/ui";
import { ShipmentType } from "@/lib/types/database";

export interface FlightRouteSectionProps {
  stationCode: string;
  destinationCode: string;
  setDestinationCode: (val: string) => void;
  shipmentType: ShipmentType;
  setShipmentType: (val: ShipmentType) => void;
  flightNumber: string;
  setFlightNumber: (val: string) => void;
  error?: string;
}

export const FlightRouteSection: React.FC<FlightRouteSectionProps> = ({
  stationCode,
  destinationCode,
  setDestinationCode,
  shipmentType,
  setShipmentType,
  flightNumber,
  setFlightNumber,
  error,
}) => {
  const destinationOptions = AIRPORT_HUBS.filter((h) => h.code !== stationCode).map((h) => ({
    value: h.code,
    label: `${h.code} — ${h.city} (${h.name})`,
  }));

  const shipmentTypeOptions = [
    { value: "air_cargo", label: "Standard cargo" },
    { value: "express_parcel", label: "Express parcel" },
    { value: "excess_baggage", label: "Extra baggage" },
    { value: "marketing_cargo", label: "Bulk commercial" },
  ];

  return (
    <Card
      header={
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <Icon name="flight_takeoff" size={15} className="text-accent-amber" />
          1. Where is it going?
        </span>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Destination airport"
          value={destinationCode}
          onChange={(e) => setDestinationCode(e.target.value)}
          options={destinationOptions}
          error={error}
        />

        <Select
          label="Type of shipment"
          value={shipmentType}
          onChange={(e) => setShipmentType(e.target.value as ShipmentType)}
          options={shipmentTypeOptions}
        />

        <TextField
          label="Flight number"
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value)}
          placeholder="e.g. VK-402"
          hint="Leave blank if not on a flight yet"
          mono
        />
      </div>
    </Card>
  );
};
