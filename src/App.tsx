import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Select,
  Card,
  Badge,
  Modal,
  Sheet,
  Icon,
} from '@/components/ui';
import { IntakeTerminal } from '@/components/intake/IntakeTerminal';
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/OnboardingWizard';
import { RateCardManager } from '@/components/admin/RateCardManager';
import { PublicTrackingPage } from '@/components/tracking/PublicTrackingPage';
import { CorporateLedger } from '@/components/accounting/CorporateLedger';
import { WeightAudit } from '@/components/operations/WeightAudit';
import { FlightManifestBuilder } from '@/components/operations/manifest/FlightManifestBuilder';
import { RampScanner } from '@/components/operations/RampScanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Sidebar } from '@/components/shell/Sidebar';
import { ConsoleHeader } from '@/components/shell/ConsoleHeader';
import { TelemetryStrip } from '@/components/shell/TelemetryStrip';
import { VIEW_META, type ViewId } from '@/components/shell/nav';
import { useTheme } from '@/lib/useTheme';
import { AIRPORT_HUBS, formatCurrency } from '@/lib/ui';

const SIDEBAR_KEY = 'aerolog-sidebar-collapsed';

export function App() {
  const { isDark, toggle } = useTheme();
  const [currentView, setCurrentView] = useState<ViewId>('terminal');
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  }, [sidebarCollapsed]);

  const handleOnboardingComplete = (_data: OnboardingData) => {
    setCurrentView('terminal');
  };

  const navigate = (id: ViewId) => {
    setCurrentView(id);
    setMobileNavOpen(false);
  };

  const meta = VIEW_META[currentView];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-sans transition-colors duration-200">
      <Sidebar
        currentView={currentView}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        stationCode="LOS"
      />

      <div
        className={`min-h-screen flex flex-col gap-4 p-3 transition-[padding] duration-200 ${
          sidebarCollapsed ? 'lg:pl-[calc(4.75rem+1.5rem)]' : 'lg:pl-[calc(16rem+1.5rem)]'
        }`}
      >
        <ConsoleHeader
          isDark={isDark}
          onToggleTheme={toggle}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          stationCode="LOS"
        />

        <main className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col gap-6 pt-2">
          <TelemetryStrip
            title={meta.title}
            subtitle={meta.subtitle}
            breadcrumb={meta.breadcrumb}
          />

          <ErrorBoundary>
            {currentView === 'terminal' && (
              <IntakeTerminal
                tenantName="SpeedWings Express Aviation"
                stationCode="LOS"
              />
            )}

            {currentView === 'manifest' && (
              <FlightManifestBuilder
                tenantId="demo-tenant"
                stationCode="LOS"
                tenantName="SpeedWings Express Aviation"
              />
            )}

            {currentView === 'scanner' && (
              <RampScanner tenantId="demo-tenant" stationCode="LOS" />
            )}

            {currentView === 'tracking' && (
              <PublicTrackingPage
                tenantName="SpeedWings Express Aviation"
                isWhiteLabel={false}
              />
            )}

            {currentView === 'audit' && <WeightAudit />}

            {currentView === 'corporate' && <CorporateLedger />}

            {currentView === 'onboarding' && (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-xs text-foreground">
                  <strong>First-run experience:</strong> New tenants see this wizard before accessing the terminal. Complete all 4 steps to unlock the workspace.
                </div>
                <OnboardingWizard onComplete={handleOnboardingComplete} />
              </div>
            )}

            {currentView === 'admin' && (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs text-muted">
                  <strong className="text-foreground">Admin Panel — Rate Card Management.</strong> Station managers and above can add, edit, and deactivate freight rate cards. Changes take effect on the next waybill issued.
                </div>
                <RateCardManager />
              </div>
            )}

            {currentView === 'tiers' && (
              <div className="flex flex-col gap-8">
                <section className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Icon name="auto_awesome" size={20} className="text-accent-amber" />
                        SaaS Subscription Tiers & Paystack Lifecycle
                      </h2>
                      <p className="text-xs text-muted mt-1">
                        Enforced by Postgres Row-Level Security (RLS) with 14-day free trial and 72-hour grace period.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-surface-2 p-1 rounded-lg border border-border self-start">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          billingCycle === 'monthly'
                            ? 'bg-surface-1 text-foreground shadow-sm'
                            : 'text-muted hover:text-foreground'
                        }`}
                      >
                        Monthly Billing
                      </button>
                      <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          billingCycle === 'annual'
                            ? 'bg-surface-1 text-foreground shadow-sm'
                            : 'text-muted hover:text-foreground'
                        }`}
                      >
                        Annual Billing <span className="text-accent-amber text-[10px] font-bold ml-1">(2 Mo Free)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                      header={
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="apartment" size={16} className="text-muted" />
                            <span className="font-bold text-sm">Starter Plan</span>
                          </div>
                          <Badge tone="neutral">Single Station</Badge>
                        </div>
                      }
                      footer={
                        <Button variant="secondary" fullWidth>
                          Start 14-Day Trial
                        </Button>
                      }
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-2xl font-black font-mono text-foreground">
                            {billingCycle === 'monthly' ? formatCurrency(25000) : formatCurrency(250000)}
                            <span className="text-xs font-normal text-muted font-sans">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            Perfect for single-counter airport cargo desks.
                          </p>
                        </div>

                        <ul className="text-xs text-text-secondary flex flex-col gap-2.5">
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>1 Airport Cargo Station / Hub</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 3 Staff Accounts</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 500 Waybills / month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>58mm / 80mm ESC/POS Thermal Printing</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-accent-amber shrink-0" />
                            <span className="text-muted">Logo on receipts (with "Powered by" footer)</span>
                          </li>
                        </ul>
                      </div>
                    </Card>

                    <Card
                      accent
                      className="relative"
                      header={
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="flight" size={16} className="text-accent-amber" />
                            <span className="font-bold text-sm text-foreground">Growth Plan</span>
                          </div>
                          <Badge tone="amber" dot>
                            Most Popular
                          </Badge>
                        </div>
                      }
                      footer={
                        <Button variant="primary" fullWidth>
                          Subscribe to Growth
                        </Button>
                      }
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-2xl font-black font-mono text-foreground">
                            {billingCycle === 'monthly' ? formatCurrency(55000) : formatCurrency(550000)}
                            <span className="text-xs font-normal text-muted font-sans">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            For scaling domestic air cargo forwarders.
                          </p>
                        </div>

                        <ul className="text-xs text-text-secondary flex flex-col gap-2.5">
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 5 Airport Cargo Hubs</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 15 Staff Accounts (Ramp, Cashiers)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 3,000 Waybills / month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Flight Manifest Builder & QR Scanner</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span className="font-semibold text-foreground">100% White-Label (No Watermarks)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Custom Termii SMS Sender ID</span>
                          </li>
                        </ul>
                      </div>
                    </Card>

                    <Card
                      header={
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="verified_user" size={16} className="text-accent-cobalt" />
                            <span className="font-bold text-sm">Enterprise Tier</span>
                          </div>
                          <Badge tone="info">Airlines & Multi-Hub</Badge>
                        </div>
                      }
                      footer={
                        <Button variant="subtle" fullWidth>
                          Contact Sales / Invoicing
                        </Button>
                      }
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-2xl font-black font-mono text-foreground">
                            {billingCycle === 'monthly' ? formatCurrency(120000) : formatCurrency(1200000)}
                            <span className="text-xs font-normal text-muted font-sans">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            Multi-station airline cargo & regional carriers.
                          </p>
                        </div>

                        <ul className="text-xs text-text-secondary flex flex-col gap-2.5">
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Unlimited Airport Hubs & Stations</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Unlimited Staff & Custom Roles</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Unlimited Waybills & Manifests</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Custom Domain & Dedicated SLA</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>WhatsApp + SMS Multi-Channel Gateway</span>
                          </li>
                        </ul>
                      </div>
                    </Card>
                  </div>
                </section>

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
                      <span className="font-bold text-sm">Form Controls & Station Selectors</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="subtle" iconLeft="qr_code_2" onClick={() => setSheetOpen(true)}>
                          Open Mobile Sheet
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <TextField
                      label="Sender Full Name"
                      placeholder="e.g. Aliko Dangote"
                      hint="Required"
                    />
                    <Select
                      label="Origin Flight Hub"
                      options={AIRPORT_HUBS.map(h => ({
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
                </Card>
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>

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
            options={AIRPORT_HUBS.map(h => ({
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
