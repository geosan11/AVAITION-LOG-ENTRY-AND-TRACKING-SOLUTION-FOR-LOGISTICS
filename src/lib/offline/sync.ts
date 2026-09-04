import { useState, useEffect } from "react";
import { offlineDb, SyncQueueItem } from "./db";
import { supabase } from "../supabase";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  triggerFlush(); };
    const handleOffline = () =>   setIsOnline(false);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    offlineDb.sync_queue.count().then(setPendingSyncCount);
    const interval = setInterval(
      () => offlineDb.sync_queue.count().then(setPendingSyncCount),
      5000
    );

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingSyncCount };
}

function triggerFlush() {
  flushSyncQueue().catch(() => {});
}

/** Resolve a PENDING-uuid AWB to a real sequential AWB via Supabase RPC */
export async function resolveAwbNumber(tenantId: string, hubId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("generate_next_awb", {
      p_tenant_id: tenantId,
      p_hub_id:    hubId,
    });
    if (error || !data) return null;
    return data as string;
  } catch {
    return null;
  }
}

/** Flush pending sync queue to Supabase with conflict resolution */
export async function flushSyncQueue(): Promise<{ processed: number; failed: number }> {
  if (!navigator.onLine) return { processed: 0, failed: 0 };

  const items = await offlineDb.sync_queue
    .orderBy("created_at")
    .filter((i) => i.retry_count < 5)   // Skip items that have failed 5+ times
    .toArray();

  let processed = 0;
  let failed    = 0;

  for (const item of items) {
    try {
      if (item.table_name === "shipments") {
        // ── Conflict resolution: only push if local record is newer ─────
        const { data: serverRecord } = await supabase
          .from("shipments")
          .select("updated_at, awb_number")
          .eq("id", item.payload.id)
          .maybeSingle();

        const localTime  = new Date(item.payload.updated_at).getTime();
        const serverTime = serverRecord ? new Date(serverRecord.updated_at).getTime() : 0;

        if (serverRecord && serverTime > localTime) {
          // Server is newer — do NOT overwrite; update local record from server
          await offlineDb.local_shipments.update(item.payload.id, {
            updated_at: serverRecord.updated_at,
            awb_number: serverRecord.awb_number, // use the real AWB if assigned
          });
          if (item.id) await offlineDb.sync_queue.delete(item.id);
          processed++;
          continue;
        }

        // ── Resolve PENDING AWB to real sequential AWB before pushing ───
        let payload = { ...item.payload };
        if (payload.awb_number?.startsWith("PENDING-")) {
          const realAwb = await resolveAwbNumber(payload.tenant_id, payload.origin_hub_id);
          if (realAwb) {
            payload.awb_number = realAwb;
            await offlineDb.local_shipments.update(payload.id, { awb_number: realAwb });
          }
          // If resolution fails, still push with pending AWB — server will flag it
        }

        const { error } = await supabase.from("shipments").upsert(payload);
        if (error) throw error;

      } else if (item.table_name === "payments") {
        const { error } = await supabase.from("payments").upsert(item.payload);
        if (error) throw error;
      }

      if (item.id) await offlineDb.sync_queue.delete(item.id);
      processed++;
    } catch (err: any) {
      failed++;
      if (item.id) {
        await offlineDb.sync_queue.update(item.id, {
          retry_count: item.retry_count + 1,
          last_error:  err?.message ?? "Unknown sync error",
        });
      }
    }
  }

  return { processed, failed };
}

/** Queue a local record for cloud sync */
export async function queueSyncItem(
  tableName: "shipments" | "payments",
  operation: "INSERT" | "UPDATE",
  payload:   any
): Promise<void> {
  const queueItem: SyncQueueItem = {
    table_name:  tableName,
    operation,
    payload,
    created_at:  new Date().toISOString(),
    retry_count: 0,
  };
  await offlineDb.sync_queue.add(queueItem);
  if (navigator.onLine) flushSyncQueue().catch(() => {});
}
