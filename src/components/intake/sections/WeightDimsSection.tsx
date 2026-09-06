import React from "react";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { IntakeValidationErrors } from "@/lib/validation/intake";

export interface WeightDimsSectionProps {
  weightKg: number;
  setWeightKg: (val: number) => void;
  pieces: number;
  setPieces: (val: number) => void;
  contentType: string;
  setContentType: (val: string) => void;
  declaredValue: number;
  setDeclaredValue: (val: number) => void;
  lengthCm: number;
  setLengthCm: (val: number) => void;
  widthCm: number;
  setWidthCm: (val: number) => void;
  heightCm: number;
  setHeightCm: (val: number) => void;
  errors: IntakeValidationErrors;
  onBlurField: (field: string) => void;
}

export const WeightDimsSection: React.FC<WeightDimsSectionProps> = ({
  weightKg,
  setWeightKg,
  pieces,
  setPieces,
  contentType,
  setContentType,
  declaredValue,
  setDeclaredValue,
  lengthCm,
  setLengthCm,
  widthCm,
  setWidthCm,
  heightCm,
  setHeightCm,
  errors,
  onBlurField,
}) => {
  return (
    <Card
      header={
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <Icon name="scale" size={15} className="text-accent-amber" />
          3. Cargo Metrics, Volumetric Dimensions & Valuation
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <TextField
            label="Gross Weight (Kg)"
            type="number"
            step="0.5"
            value={weightKg || ""}
            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
            onBlur={() => onBlurField("weightKg")}
            iconLeft="scale"
            mono
            error={errors.weightKg}
            hint="Scale reading"
          />

          <TextField
            label="Total Pieces"
            type="number"
            value={pieces || ""}
            onChange={(e) => setPieces(parseInt(e.target.value) || 1)}
            onBlur={() => onBlurField("pieces")}
            iconLeft="tag"
            mono
            error={errors.pieces}
          />

          <TextField
            label="Commodity Description"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            onBlur={() => onBlurField("contentType")}
            placeholder="e.g. Avionics Parts"
            iconLeft="inventory_2"
            error={errors.contentType}
          />

          <TextField
            label="Declared Value (₦)"
            type="number"
            value={declaredValue || ""}
            onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
            placeholder="Optional"
            iconLeft="shield"
            mono
            hint="0.5% premium if > ₦50k"
          />
        </div>

        {/* Volumetric Dimensions Box */}
        <div className="p-3.5 rounded-xl bg-surface-sunken border border-border-subtle flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              Volumetric Dimensions (cm) — IATA Formula: (L × W × H) / 6000
            </span>
            <span className="text-[11px] text-muted">Aviation Standard</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <TextField
              placeholder="Length (cm)"
              type="number"
              value={lengthCm || ""}
              onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)}
              mono
            />
            <TextField
              placeholder="Width (cm)"
              type="number"
              value={widthCm || ""}
              onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
              mono
            />
            <TextField
              placeholder="Height (cm)"
              type="number"
              value={heightCm || ""}
              onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
              mono
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
