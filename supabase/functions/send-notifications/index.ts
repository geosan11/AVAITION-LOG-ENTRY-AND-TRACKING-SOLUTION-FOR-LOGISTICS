import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TERMII_API_KEY = Deno.env.get("TERMII_API_KEY") ?? "";
const TERMII_SENDER_ID = Deno.env.get("TERMII_SENDER_ID") ?? "AeroLogist";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface NotificationPayload {
  tenantId: string;
  eventType: "intake_pickup_pin" | "flight_departed" | "cargo_arrived" | "cargo_delivered";
  awbNumber: string;
  recipientPhone: string;
  recipientName: string;
  pickupPin?: string;
  flightNumber?: string;
  originCode?: string;
  destinationCode?: string;
}

function composeMessage(payload: NotificationPayload): string {
  switch (payload.eventType) {
    case "intake_pickup_pin":
      return `AeroLogistics Alert: Waybill ${payload.awbNumber} has been received for flight to ${payload.destinationCode}. Security Pickup PIN: ${payload.pickupPin}. Track live: aerologistics.app/track/${payload.awbNumber}`;

    case "flight_departed":
      return `AeroLogistics Flight Update: Cargo ${payload.awbNumber} is airborne on Flight ${payload.flightNumber || "VK-402"} en route to ${payload.destinationCode}.`;

    case "cargo_arrived":
      return `AeroLogistics Arrival: Cargo ${payload.awbNumber} has landed at ${payload.destinationCode} Airport holding desk. Please present PIN: ${payload.pickupPin} for release.`;

    case "cargo_delivered":
      return `AeroLogistics Confirmation: Consignment ${payload.awbNumber} has been delivered and signed for. Thank you for flying cargo with us!`;

    default:
      return `AeroLogistics Cargo Update for Waybill ${payload.awbNumber}. Track: aerologistics.app/track/${payload.awbNumber}`;
  }
}

async function sendTermiiSms(to: string, message: string): Promise<{ success: boolean; data?: any }> {
  // Normalize Nigerian phone to 234 format
  let cleanPhone = to.replace(/\s+/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "234" + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith("+")) {
    cleanPhone = cleanPhone.substring(1);
  }

  if (!TERMII_API_KEY) {
    console.log(`[DEV SIMULATION] SMS to ${cleanPhone}: "${message}"`);
    return { success: true, data: { status: "simulated_success" } };
  }

  try {
    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: cleanPhone,
        from: TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: TERMII_API_KEY,
      }),
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (err: any) {
    console.error("Termii API error:", err);
    return { success: false, data: err?.message };
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.awbNumber || !payload.recipientPhone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const message = composeMessage(payload);
    const smsResult = await sendTermiiSms(payload.recipientPhone, message);

    // Audit log
    await supabase.from("audit_logs").insert({
      tenant_id: payload.tenantId,
      action: `NOTIFICATION_${payload.eventType.toUpperCase()}`,
      entity_type: "shipment",
      details: {
        awb: payload.awbNumber,
        phone: payload.recipientPhone,
        message,
        result: smsResult,
      },
    });

    return new Response(JSON.stringify({ success: true, smsResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
