import Dexie, { type Table } from 'dexie';
import { Shipment, Payment, Hub } from '../types/database';

export interface SyncQueueItem {
  id?: number;
  table_name: 'shipments' | 'payments';
  operation: 'INSERT' | 'UPDATE';
  payload: any;
  created_at: string;
  retry_count: number;
  last_error?: string | null;
}

export class AeroLogisticsDatabase extends Dexie {
  local_shipments!: Table<Shipment, string>;
  local_payments!: Table<Payment, string>;
  sync_queue!: Table<SyncQueueItem, number>;
  cached_hubs!: Table<Hub, string>;

  constructor() {
    super('AeroLogisticsOfflineDB');
    this.version(1).stores({
      local_shipments: 'id, tenant_id, awb_number, origin_hub_id, destination_hub_id, status, payment_status, created_at',
      local_payments: 'id, tenant_id, shipment_id, hub_id, payment_mode, created_at',
      sync_queue: '++id, table_name, operation, created_at, retry_count',
      cached_hubs: 'id, tenant_id, code, city, state',
    });
  }
}

export const offlineDb = new AeroLogisticsDatabase();
