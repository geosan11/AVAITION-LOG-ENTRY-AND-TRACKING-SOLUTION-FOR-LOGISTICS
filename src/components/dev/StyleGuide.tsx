import { useState } from 'react';
import {
  Button,
  TextField,
  Select,
  Card,
  Badge,
  Modal,
  Sheet,
  Disclosure,
  InfoHint,
} from '@/components/ui';
import { AIRPORT_HUBS } from '@/lib/ui';

/**
 * Component gallery — developer reference only.
 * Not part of the product UI; mounted by App.tsx solely in dev builds or with
 * `?dev=1`. Keeps the primitives visible without cluttering the Plans screen.
 */
export function StyleGuide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="p-3 rounded-lg bg-info-bg border border-info-border text-xs text-info-fg">
        <strong>Developer style guide.</strong> Visible only in dev builds / with
        <code className="mx-1 font-mono">?dev=1</code>. Not shown to users.
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-sm">7 Semantic Status Tint Sets</span>
              <Badge tone="info">WCAG AA Contrast</Badge>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted">
              Each status tone guarantees high-contrast readability in both Light and Dark themes without hardcoded hexes.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Badge tone="success" dot>Delivered / Active</Badge>
              <Badge tone="amber" dot>Manifested / Review</Badge>
              <Badge tone="info" dot>In-Transit / Airborne</Badge>
              <Badge tone="warning" dot>Past-Due Grace</Badge>
              <Badge tone="error" dot>Suspended / Cancelled</Badge>
              <Badge tone="purple" dot>Excess Baggage</Badge>
              <Badge tone="neutral">Draft Waybill</Badge>
            </div>
          </div>
        </Card>

        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-sm">Button Primitive System</span>
              <Badge tone="amber">5 Variants</Badge>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2.5">
              <Button variant="primary" iconLeft="credit_card">Primary Action</Button>
              <Button variant="secondary" iconLeft="description">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="subtle">Subtle</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" loading loadingLabel="Processing...">Loading</Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
          </div>
        </Card>
      </section>

      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-sm">Form Controls &amp; Disclosure</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="subtle" iconLeft="qr_code_2" onClick={() => setSheetOpen(true)}>
                Open Mobile Sheet
              </Button>
              <Button size="sm" variant="subtle" iconLeft="dashboard" onClick={() => setModalOpen(true)}>
                Open Modal
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField
              label="Sender Full Name"
              placeholder="e.g. Aliko Dangote"
              hint="Required"
            />
            <Select
              label="Origin Flight Hub"
              options={AIRPORT_HUBS.map((h) => ({
                value: h.code,
                label: `${h.code} — ${h.name} (${h.city})`,
              }))}
            />
            <TextField
              label="Air Waybill (AWB) Prefix"
              defaultValue="LOS-2026-00492"
              mono
              hint="Auto-generated"
            />
          </div>

          <Disclosure label="Disclosure example" hint="click to expand">
            <p className="text-xs text-muted">
              Advanced / optional detail lives here. <InfoHint term="chargeableWeight" /> shows an
              inline explanation.
            </p>
          </Disclosure>
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Quick Intake & AWB Generation"
        description="Rapid 1-screen cargo desk entry with sequential tag generator."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" iconLeft="package_2" onClick={() => setModalOpen(false)}>
              Issue Waybill & Print
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextField label="Consignee Phone" placeholder="080 1234 5678" mono />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Weight (Kg)" placeholder="15.5" type="number" mono />
            <TextField label="Total Pieces" placeholder="2" type="number" mono />
          </div>
          <Select
            label="Destination Airport"
            options={AIRPORT_HUBS.map((h) => ({
              value: h.code,
              label: `${h.code} — ${h.city}`,
            }))}
          />
        </div>
      </Modal>

      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Mobile Ramp Scanner & Cargo Validation"
        side="bottom"
      >
        <div className="flex flex-col gap-4 text-sm text-text-secondary">
          <p>
            This bottom sheet drawer provides a touch-first interface on mobile devices for ramp agents scanning barcodes on the tarmac or counter.
          </p>
          <div className="p-4 rounded-xl bg-surface-sunken border border-border flex items-center justify-between">
            <div>
              <div className="font-mono font-bold text-foreground">AWB: LOS-ABV-88392</div>
              <div className="text-xs text-muted">Flight: N2-402 | Dest: ABV (Abuja)</div>
            </div>
            <Badge tone="success" dot>Screened OK</Badge>
          </div>
          <Button variant="primary" fullWidth onClick={() => setSheetOpen(false)}>
            Confirm Manifest Load
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
