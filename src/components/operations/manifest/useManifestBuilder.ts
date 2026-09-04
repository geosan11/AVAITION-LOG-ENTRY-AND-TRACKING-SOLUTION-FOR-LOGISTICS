import { useState, useCallback, useEffect } from 'react';
import { offlineDb } from '@/lib/offline/db';
import { Shipment, ShipmentStatus } from '@/lib/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ManifestStatus = 'open' | 'locked' | 'airborne' | 'landed' | 'closed';

export interface ManifestItem {
  shipment: Shipment;
  addedAt: string;
}

export interface LocalManifest {
  id: string;
  manifest_number: string;
  tenant_id: string;
  origin_hub_id: string;
  destination_hub_id: string;
  airline_code: string;
  flight_number: string;
  departure_date: string;
  departure_time: string;
  aircraft_type: string;
  payload_capacity_kg: number;
  items: ManifestItem[];
  status: ManifestStatus;
  created_at: string;
  updated_at: string;
}

export interface UseManifestBuilderReturn {
  manifest: LocalManifest | null;
  manifests: LocalManifest[];
  createManifest: (opts: {
    originHub: string;
    destinationHub: string;
    airlineCode: string;
    flightNumber: string;
    departureDate: string;
    departureTime: string;
    aircraftType: string;
    payloadCapacityKg: number;
  }) => void;
  selectManifest: (id: string) => void;
  addAwbToManifest: (awbNumber: string) => Promise<{ success: boolean; error?: string }>;
  removeAwbFromManifest: (shipmentId: string) => void;
  lockManifest: () => Promise<{ success: boolean }>;
  dispatchManifest: () => Promise<{ success: boolean; dispatchedCount: number }>;
  landManifest: () => Promise<{ success: boolean }>;
  totalWeightKg: number;
  totalPieces: number;
  utilizationPct: number;
  isOverloaded: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useManifestBuilder(tenantId: string, stationCode: string): UseManifestBuilderReturn {
  const [manifests, setManifests] = useState<LocalManifest[]>([]);
  const [manifest, setManifest] = useState<LocalManifest | null>(null);

  // Seed with one open demo manifest on mount
  useEffect(() => {
    const demo: LocalManifest = {
      id: 'demo-manifest-1',
      manifest_number: `MAN-LOS-2026-001`,
      tenant_id: tenantId,
      origin_hub_id: stationCode,
      destination_hub_id: 'ABV',
      airline_code: 'VK',
      flight_number: 'VK-402',
      departure_date: new Date().toISOString().split('T')[0],
      departure_time: '14:30',
      aircraft_type: 'Boeing 737-300',
      payload_capacity_kg: 12000,
      items: [],
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setManifests([demo]);
    setManifest(demo);
  }, [tenantId, stationCode]);

  const createManifest = useCallback((opts: {
    originHub: string;
    destinationHub: string;
    airlineCode: string;
    flightNumber: string;
    departureDate: string;
    departureTime: string;
    aircraftType: string;
    payloadCapacityKg: number;
  }) => {
    const seq = manifests.length + 1;
    const newManifest: LocalManifest = {
      id: crypto.randomUUID(),
      manifest_number: `MAN-${opts.originHub}-2026-${String(seq).padStart(3, '0')}`,
      tenant_id: tenantId,
      origin_hub_id: opts.originHub,
      destination_hub_id: opts.destinationHub,
      airline_code: opts.airlineCode,
      flight_number: opts.flightNumber,
      departure_date: opts.departureDate,
      departure_time: opts.departureTime,
      aircraft_type: opts.aircraftType,
      payload_capacity_kg: opts.payloadCapacityKg,
      items: [],
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setManifests((prev) => [newManifest, ...prev]);
    setManifest(newManifest);
  }, [manifests.length, tenantId]);

  const selectManifest = useCallback((id: string) => {
    const found = manifests.find((m) => m.id === id);
    if (found) setManifest(found);
  }, [manifests]);

  const updateManifestState = useCallback((updater: (m: LocalManifest) => LocalManifest) => {
    setManifest((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      setManifests((all) => all.map((m) => m.id === updated.id ? updated : m));
      return updated;
    });
  }, []);

  const addAwbToManifest = useCallback(async (awbNumber: string): Promise<{ success: boolean; error?: string }> => {
    if (!manifest) return { success: false, error: 'No manifest selected' };
    if (manifest.status !== 'open') return { success: false, error: 'Manifest is locked. Cannot add shipments.' };

    const clean = awbNumber.trim().toUpperCase();

    // Already in manifest?
    if (manifest.items.some((i) => i.shipment.awb_number === clean)) {
      return { success: false, error: `${clean} is already on this manifest` };
    }

    // Look up in local IndexedDB first
    let shipment: Shipment | undefined;
    try {
      shipment = await offlineDb.local_shipments.where('awb_number').equals(clean).first();
    } catch {
      // fall through
    }

    if (!shipment) {
      // Simulate DB lookup — in production this calls supabase.rpc('add_shipment_to_manifest')
      return { success: false, error: `AWB "${clean}" not found in station records. Check the number and try again.` };
    }

    if (!['received', 'security_cleared', 'manifested'].includes(shipment.status)) {
      return { success: false, error: `${clean} has status "${shipment.status}" and cannot be manifested` };
    }

    // Optimistic update
    const item: ManifestItem = { shipment, addedAt: new Date().toISOString() };
    updateManifestState((m) => ({
      ...m,
      items: [...m.items, item],
      updated_at: new Date().toISOString(),
    }));

    return { success: true };
  }, [manifest, updateManifestState]);

  const removeAwbFromManifest = useCallback((shipmentId: string) => {
    updateManifestState((m) => ({
      ...m,
      items: m.items.filter((i) => i.shipment.id !== shipmentId),
      updated_at: new Date().toISOString(),
    }));
  }, [updateManifestState]);

  const lockManifest = useCallback(async () => {
    updateManifestState((m) => ({ ...m, status: 'locked', updated_at: new Date().toISOString() }));
    return { success: true };
  }, [updateManifestState]);

  const dispatchManifest = useCallback(async () => {
    if (!manifest) return { success: false, dispatchedCount: 0 };
    const count = manifest.items.length;
    updateManifestState((m) => ({
      ...m,
      status: 'airborne',
      items: m.items.map((i) => ({
        ...i,
        shipment: { ...i.shipment, status: 'departed' as ShipmentStatus },
      })),
      updated_at: new Date().toISOString(),
    }));
    return { success: true, dispatchedCount: count };
  }, [manifest, updateManifestState]);

  const landManifest = useCallback(async () => {
    updateManifestState((m) => ({
      ...m,
      status: 'landed',
      items: m.items.map((i) => ({
        ...i,
        shipment: { ...i.shipment, status: 'arrived' as ShipmentStatus },
      })),
      updated_at: new Date().toISOString(),
    }));
    return { success: true };
  }, [updateManifestState]);

  const totalWeightKg = manifest?.items.reduce((s, i) => s + i.shipment.weight_kg, 0) ?? 0;
  const totalPieces = manifest?.items.reduce((s, i) => s + i.shipment.pieces, 0) ?? 0;
  const utilizationPct = manifest ? Math.round((totalWeightKg / manifest.payload_capacity_kg) * 100) : 0;
  const isOverloaded = utilizationPct > 100;

  return {
    manifest,
    manifests,
    createManifest,
    selectManifest,
    addAwbToManifest,
    removeAwbFromManifest,
    lockManifest,
    dispatchManifest,
    landManifest,
    totalWeightKg,
    totalPieces,
    utilizationPct,
    isOverloaded,
  };
}
