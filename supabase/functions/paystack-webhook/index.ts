import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Verify Paystack HMAC-SHA512 signature */
async function verifySignature(body: string, signature: string): Promise<boolean> {
  try {
    const computed = await hmac("sha512", PAYSTACK_SECRET, body, "utf8", "hex");
    return computed === signature;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("x-paystack-signature") ?? "";
  const rawBody   = await req.text();

  // Reject requests with invalid signatures
  const isValid = await verifySignature(rawBody, signature);
  if (!isValid) {
    console.error("Invalid Paystack signature — request rejected.");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: { event: string; data: any };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  console.log(`Paystack event received: ${event.event}`);

  const data = event.data;
  // Extract our tenant_id from Paystack metadata
  const tenantId = data?.metadata?.tenant_id ?? data?.customer?.metadata?.tenant_id;

  switch (event.event) {

    // ── Successful charge / renewal ──────────────────────────────────────
    case "charge.success":
    case "invoice.payment_successful": {
      if (!tenantId) break;

      const periodEnd = new Date();
      // Determine billing cycle from plan interval
      const interval = data?.plan?.interval ?? "monthly";
      periodEnd.setDate(periodEnd.getDate() + (interval === "annually" ? 365 : 30));

      await supabase
        .from("subscriptions")
        .update({
          status:                "active",
          current_period_start:  new Date().toISOString(),
          current_period_end:    periodEnd.toISOString(),
          grace_period_end:      null,
          amount_paid:           (data?.amount ?? 0) / 100, // convert kobo → naira
          updated_at:            new Date().toISOString(),
        })
        .eq("tenant_id", tenantId);

      console.log(`Subscription activated for tenant ${tenantId}`);
      break;
    }

    // ── Payment failed — start 72-hour grace period ──────────────────────
    case "charge.failed":
    case "invoice.payment_failed": {
      if (!tenantId) break;

      const graceEnd = new Date();
      graceEnd.setHours(graceEnd.getHours() + 72);

      await supabase
        .from("subscriptions")
        .update({
          status:           "past_due",
          grace_period_end: graceEnd.toISOString(),
          updated_at:       new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("status", "active"); // Only demote from active

      console.log(`Subscription past_due for tenant ${tenantId}. Grace until ${graceEnd}`);
      break;
    }

    // ── Subscription cancelled / deactivated ────────────────────────────
    case "subscription.deactivated":
    case "subscription.not_renew": {
      if (!tenantId) break;

      await supabase
        .from("subscriptions")
        .update({
          status:       "suspended",
          cancelled_at: new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        })
        .eq("tenant_id", tenantId);

      console.log(`Subscription suspended for tenant ${tenantId}`);
      break;
    }

    // ── New subscription created ─────────────────────────────────────────
    case "subscription.create": {
      if (!tenantId) break;

      const { subscription_code, plan } = data;
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      // Upsert: activate the subscription and store Paystack codes
      await supabase
        .from("subscriptions")
        .update({
          status:                    "active",
          paystack_subscription_code: subscription_code,
          paystack_plan_code:         plan?.plan_code,
          paystack_customer_code:     data?.customer?.customer_code,
          current_period_start:       new Date().toISOString(),
          current_period_end:         periodEnd.toISOString(),
          grace_period_end:           null,
          updated_at:                 new Date().toISOString(),
        })
        .eq("tenant_id", tenantId);

      // Sync tier on tenants table
      const tierMap: Record<string, string> = {
        starter:    "starter",
        growth:     "growth",
        enterprise: "enterprise",
      };
      const planCode  = (plan?.name ?? "starter").toLowerCase();
      const tier      = Object.keys(tierMap).find((t) => planCode.includes(t)) ?? "starter";
      const maxAwbMap: Record<string, number> = { starter: 500, growth: 3000, enterprise: 999999 };
      const maxHubMap: Record<string, number> = { starter: 1,   growth: 5,    enterprise: 9999  };
      const maxStaffMap: Record<string, number>= { starter: 3,  growth: 15,   enterprise: 9999  };

      await supabase
        .from("tenants")
        .update({
          tier,
          max_monthly_awb:     maxAwbMap[tier],
          max_hubs:            maxHubMap[tier],
          max_staff:           maxStaffMap[tier],
          white_label_enabled: tier !== "starter",
          updated_at:          new Date().toISOString(),
        })
        .eq("id", tenantId);

      console.log(`New subscription created for tenant ${tenantId} — tier: ${tier}`);
      break;
    }

    default:
      console.log(`Unhandled Paystack event: ${event.event}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
