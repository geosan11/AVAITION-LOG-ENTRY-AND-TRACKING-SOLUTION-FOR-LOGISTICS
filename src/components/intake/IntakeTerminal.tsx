import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { fetchRateCard, calculateCargoPricing, PricingBreakdown } from "@/lib/pricing";
import { offlineDb } from "@/lib/offline/db";
import { queueSyncItem, useOnlineStatus } from "@/lib/offline/sync";
import { validateIntakeForm, IntakeValidationErrors } from "@/lib/validation/intake";
import { Shipment, ShipmentType, PaymentMode } from "@/lib/types/database";
import { FlightRouteSection } from "./sections/FlightRouteSection";
import { ContactsSection } from "./sections/ContactsSection";
import { WeightDimsSection } from "./sections/WeightDimsSection";
import { PricingSection } from "./sections/PricingSection";
import { ConfirmIssueModal } from "./ConfirmIssueModal";
import { ReceiptMockup } from "./ReceiptMockup";
import { RecentAWBsSidebar } from "./RecentAWBsSidebar";

export interface IntakeTerminalProps {
  tenantId?: string;
  tenantName?: string;
  hubId?: string;
  stationCode?: string;
  isWhiteLabel?: boolean;
}

export const IntakeTerminal: React.FC<IntakeTerminalProps> = ({
  tenantId = "demo-tenant",
  tenantName = "SpeedWings Express Aviation",
  hubId = "demo-hub",
  stationCode = "LOS",
  isWhiteLabel = false,
}) => {
  const { isOnline, pendingSyncCount } = useOnlineStatus();

  // ── Form State ────────────────────────────────────────────────────────────
  const [destinationCode, setDestinationCode] = useState("ABV");
  const [shipmentType, setShipmentType] = useState<ShipmentType>("air_cargo");
  const [flightNumber, setFlightNumber] = useState("VK-402");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");
  const [pieces, setPieces] = useState(1);
  const [weightKg, setWeightKg] = useState(5);
  const [lengthCm, setLengthCm] = useState(0);
  const [widthCm, setWidthCm] = useState(0);
  const [heightCm, setHeightCm] = useState(0);
  const [declaredValue, setDeclaredValue] = useState(0);
  const [contentType, setContentType] = useState("General Cargo");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("POS");
  const [paymentAmount, setPaymentAmount] = useState(0);

  // ── Validation State ──────────────────────────────────────────────────────
  const [errors, setErrors] = useState<IntakeValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Rate Card & Live Pricing ──────────────────────────────────────────────
  const [rateCard, setRateCard] = useState<any>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    if (!tenantId || !stationCode || !destinationCode) return;
    setLoadingRate(true);
    fetchRateCard(tenantId, stationCode, destinationCode, shipmentType)
      .then(setRateCard)
      .catch(() => {})
      .finally(() => setLoadingRate(false));
  }, [tenantId, stationCode, destinationCode, shipmentType]);

  const pricing: PricingBreakdown | null = useMemo(() => {
    if (!rateCard) return null;
    return calculateCargoPricing({
      tenantId,
      originCode: stationCode,
      destinationCode,
      actualWeightKg: weightKg || 1,
      lengthCm,
      widthCm,
      heightCm,
      pieces: pieces || 1,
      shipmentType,
      declaredValue,
      rateCard,
    });
  }, [rateCard, weightKg, lengthCm, widthCm, heightCm, pieces, shipmentType, declaredValue, tenantId, stationCode, destinationCode]);

  // ── Modals & Local AWBs State ─────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [issuedShipment, setIssuedShipment] = useState<Shipment | null>(null);
  const [inspectingShipment, setInspectingShipment] = useState<Shipment | null>(null);
  const [recentAwbs, setRecentAwbs] = useState<Shipment[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const loadRecentAwbs = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const records = await offlineDb.local_shipments
        .orderBy("created_at")
        .reverse()
        .limit(6)
        .toArray();
      setRecentAwbs(records);
    } catch {
      // IndexedDB query fallback
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    loadRecentAwbs();
  }, [loadRecentAwbs, issuedShipment]);

  const handleBlurField = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRequestIssue = () => {
    const formData = {
      destinationCode,
      shipmentType,
      flightNumber,
      senderName,
      senderPhone,
      consigneeName,
      consigneePhone,
      pieces,
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      declaredValue,
      contentType,
    };

    const validation = validateIntakeForm(formData);
    setTouched({
      senderName: true,
      senderPhone: true,
      consigneeName: true,
      consigneePhone: true,
      weightKg: true,
      pieces: true,
      contentType: true,
      destinationCode: true,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setShowConfirm(true);
  };

  const handleConfirmCommit = async () => {
    if (!pricing) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const localUuid = crypto.randomUUID();
      const pendingAwb = `PENDING-${localUuid}`;
      const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();
      const amountPaid = paymentAmount > 0 ? paymentAmount : pricing.amountTotal;

      const newShipment: Shipment = {
        id: localUuid,
        tenant_id: tenantId,
        origin_hub_id: hubId || stationCode,
        destination_hub_id: destinationCode,
        awb_number: pendingAwb,
        type: shipmentType,
        airline_code: flightNumber.split("-")[0] ?? "VK",
        flight_number: flightNumber,
        flight_date: new Date().toISOString().split("T")[0],
        sender_name: senderName.trim(),
        sender_phone: senderPhone.trim(),
        consignee_name: consigneeName.trim(),
        consignee_phone: consigneePhone.trim(),
        pieces,
        weight_kg: weightKg,
        volumetric_weight_kg: pricing.volumetricWeightKg,
        chargeable_weight_kg: pricing.chargeableWeightKg,
        declared_value: declaredValue,
        content_type: contentType.trim(),
        freight_charge: pricing.freightCharge,
        handling_fee: pricing.handlingFee,
        security_fee: pricing.securityFee,
        insurance_fee: pricing.insuranceFee,
        amount_total: pricing.amountTotal,
        amount_paid: amountPaid,
        balance_due: pricing.amountTotal - amountPaid,
        payment_status: amountPaid < pricing.amountTotal ? "partial" : "paid",
        status: "received",
        pickup_pin: pickupPin,
        created_at: now,
        updated_at: now,
      };

      await offlineDb.local_shipments.add(newShipment);
      await queueSyncItem("shipments", "INSERT", newShipment);

      setIssuedShipment(newShipment);
      setShowConfirm(false);

      // Reset form fields
      setSenderName("");
      setSenderPhone("");
      setConsigneeName("");
      setConsigneePhone("");
      setPieces(1);
      setWeightKg(5);
      setLengthCm(0);
      setWidthCm(0);
      setHeightCm(0);
      setDeclaredValue(0);
      setContentType("General Cargo");
      setPaymentAmount(0);
      setTouched({});
    } catch (err: any) {
      alert("Error committing consignment: " + (err?.message ?? "Unknown database error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Station Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/15 border border-accent-amber/30 text-accent-amber flex items-center justify-center shrink-0">
            <Icon name="flight_takeoff" size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>{tenantName}</span>
              <span className="text-muted">·</span>
              <span className="font-mono text-accent-amber bg-accent-amber/10 px-1.5 py-0.5 rounded border border-accent-amber/20 text-xs">
                HUB: {stationCode}
              </span>
            </div>
            <p className="text-xs text-muted">Take in a new shipment</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge tone="success" dot icon="wifi" size="sm">
              Online
            </Badge>
          ) : (
            <Badge tone="warning" dot icon="wifi_off" size="sm">
              Offline — {pendingSyncCount} saved here
            </Badge>
          )}
        </div>
      </div>

      {/* Immediate Receipt View for newly issued waybill */}
      {issuedShipment ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-success-bg border border-success-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center">
                <Icon name="check_circle" size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">
                  Shipment created
                </div>
                <div className="text-xs text-muted">
                  Ready to print and label.
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconLeft="arrow_back"
              onClick={() => setIssuedShipment(null)}
            >
              New shipment
            </Button>
          </div>

          <ReceiptMockup
            shipment={issuedShipment}
            tenantName={tenantName}
            isWhiteLabel={isWhiteLabel}
            onClose={() => setIssuedShipment(null)}
          />
        </div>
      ) : (
        /* Standard Intake Split Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 3 Segmented Form Cards */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <FlightRouteSection
              stationCode={stationCode}
              destinationCode={destinationCode}
              setDestinationCode={setDestinationCode}
              shipmentType={shipmentType}
              setShipmentType={setShipmentType}
              flightNumber={flightNumber}
              setFlightNumber={setFlightNumber}
              error={touched.destinationCode ? errors.destinationCode : undefined}
            />

            <ContactsSection
              senderName={senderName}
              setSenderName={setSenderName}
              senderPhone={senderPhone}
              setSenderPhone={setSenderPhone}
              consigneeName={consigneeName}
              consigneeNameSet={setConsigneeName}
              consigneePhone={consigneePhone}
              setConsigneePhone={setConsigneePhone}
              errors={
                Object.fromEntries(
                  Object.entries(errors).filter(([k]) => touched[k])
                ) as IntakeValidationErrors
              }
              onBlurField={handleBlurField}
            />

            <WeightDimsSection
              weightKg={weightKg}
              setWeightKg={setWeightKg}
              pieces={pieces}
              setPieces={setPieces}
              contentType={contentType}
              setContentType={setContentType}
              declaredValue={declaredValue}
              setDeclaredValue={setDeclaredValue}
              lengthCm={lengthCm}
              setLengthCm={setLengthCm}
              widthCm={widthCm}
              setWidthCm={setWidthCm}
              heightCm={heightCm}
              setHeightCm={setHeightCm}
              errors={
                Object.fromEntries(
                  Object.entries(errors).filter(([k]) => touched[k])
                ) as IntakeValidationErrors
              }
              onBlurField={handleBlurField}
            />
          </div>

          {/* Right: Live Fee Calculation & Recent Waybills Sidebar */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <PricingSection
              stationCode={stationCode}
              destinationCode={destinationCode}
              pieces={pieces}
              pricing={pricing}
              loadingRate={loadingRate}
              rateCard={rateCard}
              paymentMode={paymentMode}
              setPaymentMode={setPaymentMode}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              submitting={submitting}
              onRequestIssue={handleRequestIssue}
            />

            <RecentAWBsSidebar
              shipments={recentAwbs}
              onSelectShipment={(s) => setInspectingShipment(s)}
              onRefresh={loadRecentAwbs}
              isLoading={loadingRecent}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal before committing */}
      <ConfirmIssueModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmCommit}
        submitting={submitting}
        formData={{
          originCode: stationCode,
          destinationCode,
          flightNumber,
          shipmentType,
          senderName,
          consigneeName,
          consigneePhone,
          pieces,
          weightKg,
          paymentMode,
          amountTendered: paymentAmount,
        }}
        pricing={pricing}
      />

      {/* Modal for viewing prior waybill receipt from sidebar */}
      {inspectingShipment && (
        <Modal
          isOpen={Boolean(inspectingShipment)}
          onClose={() => setInspectingShipment(null)}
          title="Saved receipt"
          description="A shipment created earlier on this desk."
        >
          <ReceiptMockup
            shipment={inspectingShipment}
            tenantName={tenantName}
            isWhiteLabel={isWhiteLabel}
            onClose={() => setInspectingShipment(null)}
          />
        </Modal>
      )}
    </div>
  );
};
