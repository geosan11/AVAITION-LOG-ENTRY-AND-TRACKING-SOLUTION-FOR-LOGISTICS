import { useState, useEffect } from 'react';
import { Button, Card, Badge, Icon, InfoHint } from '@/components/ui';
import { IntakeTerminal } from '@/components/intake/IntakeTerminal';
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/OnboardingWizard';
import { RateCardManager } from '@/components/admin/RateCardManager';
import { PublicTrackingPage } from '@/components/tracking/PublicTrackingPage';
import { CorporateLedger } from '@/components/accounting/CorporateLedger';
import { WeightAudit } from '@/components/operations/WeightAudit';
import { FlightManifestBuilder } from '@/components/operations/manifest/FlightManifestBuilder';
import { RampScanner } from '@/components/operations/RampScanner';
import { StyleGuide } from '@/components/dev/StyleGuide';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Sidebar } from '@/components/shell/Sidebar';
import { ConsoleHeader } from '@/components/shell/ConsoleHeader';
import { TelemetryStrip } from '@/components/shell/TelemetryStrip';
import { VIEW_META, type ViewId } from '@/components/shell/nav';
import { useTheme } from '@/lib/useTheme';
import { formatCurrency } from '@/lib/ui';

const SIDEBAR_KEY = 'aerolog-sidebar-collapsed';

const SHOW_STYLE_GUIDE =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev'));

export function App() {
  const { isDark, toggle } = useTheme();
  const [currentView, setCurrentView] = useState<ViewId>('terminal');
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
          <TelemetryStrip title={meta.title} subtitle={meta.subtitle} />

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
                  <strong>First-time setup.</strong> New companies see this before using the desk. Finish all 4 steps to unlock the workspace.
                </div>
                <OnboardingWizard onComplete={handleOnboardingComplete} />
              </div>
            )}

            {currentView === 'admin' && (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs text-muted">
                  <strong className="text-foreground">Pricing.</strong> Managers set the price per kg for each route. Changes apply to the next shipment created.
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
                        <Icon name="workspace_premium" size={20} className="text-accent-amber" />
                        Plans &amp; billing
                      </h2>
                      <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                        14-day free trial. If a renewal payment fails you have 72 hours to fix it before access pauses.
                        <InfoHint term="gracePeriod" />
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
                        Pay monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          billingCycle === 'annual'
                            ? 'bg-surface-1 text-foreground shadow-sm'
                            : 'text-muted hover:text-foreground'
                        }`}
                      >
                        Pay yearly <span className="text-accent-amber text-[10px] font-bold ml-1">(2 months free)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                      header={
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="apartment" size={16} className="text-muted" />
                            <span className="font-bold text-sm">Starter</span>
                          </div>
                          <Badge tone="neutral">One location</Badge>
                        </div>
                      }
                      footer={
                        <Button variant="secondary" fullWidth>
                          Start 14-day trial
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
                            For a single-counter airport cargo desk.
                          </p>
                        </div>

                        <ul className="text-xs text-text-secondary flex flex-col gap-2.5">
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>1 airport location</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 3 staff logins</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 500 shipments / month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Receipt printer support</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-accent-amber shrink-0" />
                            <span className="text-muted">Your logo on receipts (with a "Powered by" line)</span>
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
                            <span className="font-bold text-sm text-foreground">Growth</span>
                          </div>
                          <Badge tone="amber" dot>
                            Most popular
                          </Badge>
                        </div>
                      }
                      footer={
                        <Button variant="primary" fullWidth>
                          Choose Growth
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
                            For a growing domestic air cargo business.
                          </p>
                        </div>

                        <ul className="text-xs text-text-secondary flex flex-col gap-2.5">
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 5 airport locations</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 15 staff logins</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Up to 3,000 shipments / month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Flight loading + barcode scanning</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span className="font-semibold text-foreground">Your branding, no watermarks</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Send SMS from your own name</span>
                          </li>
                        </ul>
                      </div>
                    </Card>

                    <Card
                      header={
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="verified_user" size={16} className="text-accent-cobalt" />
                            <span className="font-bold text-sm">Enterprise</span>
                          </div>
                          <Badge tone="info">Airlines &amp; multi-location</Badge>
                        </div>
                      }
                      footer={
                        <Button variant="subtle" fullWidth>
                          Contact sales
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
                            For airline cargo and regional carriers.
                          </p>
                        </div>

                        <ul className="text-xs text-text-secondary flex flex-col gap-2.5">
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Unlimited airport locations</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Unlimited staff &amp; custom roles</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Unlimited shipments &amp; flights</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>Your own web address + priority support</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon name="check_circle" size={14} className="text-success shrink-0" />
                            <span>WhatsApp and SMS notifications</span>
                          </li>
                        </ul>
                      </div>
                    </Card>
                  </div>
                </section>

                {SHOW_STYLE_GUIDE && <StyleGuide />}
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
