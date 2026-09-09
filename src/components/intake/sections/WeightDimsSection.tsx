import React from "react";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { InfoHint } from "@/components/ui/InfoHint";
import { Disclosure } from "@/components/ui/Disclosure";
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
          3. What's in the shipment?
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Essentials */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <TextField
            label="Weight (kg)"
            type="number"
            step="0.5"
            value={weightKg || ""}
            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
            onBlur={() => onBlurField("weightKg")}
            iconLeft="scale"
            mono
            error={errors.weightKg}
            hint="On the scale"
          />

          <TextField
            label="Number of items"
            type="number"
            value={pieces || ""}
            onChange={(e) => setPieces(parseInt(e.target.value) || 1)}
            onBlur={() => onBlurField("pieces")}
            iconLeft="tag"
            mono
            error={errors.pieces}
          />

          <TextField
            label="What is it?"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            onBlur={() => onBlurField("contentType")}
            placeholder="e.g. phone parts, documents"
            iconLeft="inventory_2"
            error={errors.contentType}
          />
        </div>

        {/* Optional: size & value */}
        <Disclosure
          label="Add size & value"
          hint="optional"
          icon="straighten"
          persistKey="intake-size-value"
        >
          <div className="flex flex-col gap-4 pt-2">
            <TextField
              label={
                <span className="flex items-center gap-1">
                  Item value (₦) <InfoHint term="declaredValue" />
                </span>
              }
              type="number"
              value={declaredValue || ""}
              onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
              placeholder="Optional"
              iconLeft="shield"
              mono
              hint="For insurance. 0.5% fee if over ₦50,000"
            />

            <div className="p-3.5 rounded-xl bg-surface-sunken border border-border-subtle flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                Size in centimetres <InfoHint term="volumetricWeight" />
              </span>
              <p className="text-[11px] text-muted -mt-1">
                Only needed for large, light items — they're billed by the space they take up.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <TextField
                  placeholder="Length"
                  type="number"
                  value={lengthCm || ""}
                  onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)}
                  mono
                />
                <TextField
                  placeholder="Width"
                  type="number"
                  value={widthCm || ""}
                  onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
                  mono
                />
                <TextField
                  placeholder="Height"
                  type="number"
                  value={heightCm || ""}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  mono
                />
              </div>
            </div>
          </div>
        </Disclosure>
      </div>
    </Card>
  );
};
