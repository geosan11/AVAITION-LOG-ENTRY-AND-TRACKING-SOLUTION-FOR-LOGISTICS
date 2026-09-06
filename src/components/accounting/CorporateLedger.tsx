import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/ui";

export interface CorporateClient {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  creditLimit: number;
  currentBalance: number;
  paymentTermsDays: number;
  activeShipmentsCount: number;
  status: "active" | "credit_hold" | "suspended";
}

const MOCK_CLIENTS: CorporateClient[] = [
  {
    id: "c1",
    companyName: "Dangote Industries Ltd",
    contactName: "Ibrahim Sani",
    contactPhone: "08034567890",
    contactEmail: "logistics@dangote.com",
    creditLimit: 5000000,
    currentBalance: 1420500,
    paymentTermsDays: 30,
    activeShipmentsCount: 14,
    status: "active",
  },
  {
    id: "c2",
    companyName: "Julius Berger Nigeria Plc",
    contactName: "Klaus Wagner",
    contactPhone: "08023456781",
    contactEmail: "aviation.procure@julius-berger.com",
    creditLimit: 8000000,
    currentBalance: 3250000,
    paymentTermsDays: 45,
    activeShipmentsCount: 22,
    status: "active",
  },
  {
    id: "c3",
    companyName: "Zenith Bank Central Operations",
    contactName: "Ngozi Eze",
    contactPhone: "08056789012",
    contactEmail: "clearing@zenithbank.com",
    creditLimit: 2000000,
    currentBalance: 1980000,
    paymentTermsDays: 15,
    activeShipmentsCount: 8,
    status: "credit_hold",
  },
];

export const CorporateLedger: React.FC = () => {
  const [clients, setClients] = useState<CorporateClient[]>(MOCK_CLIENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CorporateClient | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [creditLimit, setCreditLimit] = useState(1000000);
  const [paymentTerms, setPaymentTerms] = useState("30");

  const totalCreditExtended = clients.reduce((acc, c) => acc + c.creditLimit, 0);
  const totalOutstandingBalance = clients.reduce((acc, c) => acc + c.currentBalance, 0);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const newClient: CorporateClient = {
      id: crypto.randomUUID(),
      companyName,
      contactName,
      contactPhone,
      contactEmail,
      creditLimit: Number(creditLimit),
      currentBalance: 0,
      paymentTermsDays: Number(paymentTerms),
      activeShipmentsCount: 0,
      status: "active",
    };

    setClients((prev) => [newClient, ...prev]);
    setShowAddModal(false);
    setCompanyName("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Icon name="account_balance" className="text-accent-amber" size={20} />
            B2B Corporate Credit Ledger & Invoicing
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Manage institutional client credit terms, generate end-of-month statements, and enforce credit holds.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          iconLeft="add"
          onClick={() => setShowAddModal(true)}
        >
          New Corporate Account
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Active Institutional Accounts</span>
            <Icon name="apartment" size={16} className="text-accent-amber" />
          </div>
          <div className="text-2xl font-black font-mono text-foreground mt-2">
            {clients.length} Corporate Accounts
          </div>
          <p className="text-[11px] text-muted mt-1">Contractual air cargo shippers</p>
        </Card>

        <Card className="p-4 bg-surface-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Approved Credit Facility</span>
            <Icon name="paid" size={16} className="text-success" />
          </div>
          <div className="text-2xl font-black font-mono text-foreground mt-2">
            {formatCurrency(totalCreditExtended)}
          </div>
          <p className="text-[11px] text-muted mt-1">Pre-authorized freight limits</p>
        </Card>

        <Card className="p-4 bg-surface-card border-accent-amber/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Current Outstanding Receivables</span>
            <Icon name="trending_up" size={16} className="text-accent-amber" />
          </div>
          <div className="text-2xl font-black font-mono text-accent-amber mt-2">
            {formatCurrency(totalOutstandingBalance)}
          </div>
          <p className="text-[11px] text-muted mt-1">Pending monthly reconciliation</p>
        </Card>
      </div>

      {/* Clients Table */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-foreground">Registered Corporate Accounts</span>
            <Badge tone="info">{clients.length} Shippers Listed</Badge>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted font-semibold">
                <th className="text-left py-3 px-4">Corporate Entity</th>
                <th className="text-left py-3 px-4">Primary Contact</th>
                <th className="text-right py-3 px-4">Credit Limit</th>
                <th className="text-right py-3 px-4">Current Debt</th>
                <th className="text-center py-3 px-4">Credit Utilization</th>
                <th className="text-center py-3 px-4">Terms</th>
                <th className="text-center py-3 px-4">Account Status</th>
                <th className="text-right py-3 px-4">Statements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {clients.map((client) => {
                const utilizationPct = Math.round((client.currentBalance / client.creditLimit) * 100);
                return (
                  <tr key={client.id} className="hover:bg-surface-hover transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground text-sm">{client.companyName}</div>
                      <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                        <Icon name="mail" size={11} /> {client.contactEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-foreground">{client.contactName}</div>
                      <div className="text-[11px] text-muted font-mono flex items-center gap-1.5 mt-0.5">
                        <Icon name="call" size={11} /> {client.contactPhone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                      {formatCurrency(client.creditLimit)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                      {formatCurrency(client.currentBalance)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1 max-w-[100px] mx-auto">
                        <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              utilizationPct >= 90
                                ? "bg-error"
                                : utilizationPct >= 65
                                ? "bg-accent-amber"
                                : "bg-success"
                            }`}
                            style={{ width: `${Math.min(100, utilizationPct)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted">{utilizationPct}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      <Badge tone="neutral" size="sm">
                        Net {client.paymentTermsDays}d
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {client.status === "active" ? (
                        <Badge tone="success" size="sm" dot>
                          Active
                        </Badge>
                      ) : client.status === "credit_hold" ? (
                        <Badge tone="warning" size="sm" dot>
                          Credit Hold
                        </Badge>
                      ) : (
                        <Badge tone="error" size="sm" dot>
                          Suspended
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        iconLeft="description"
                        onClick={() => {
                          setSelectedClient(client);
                          setShowStatementModal(true);
                        }}
                      >
                        Statement
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Corporate Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Open B2B Corporate Credit Facility"
        description="Register an institutional client for monthly invoicing and pre-approved cargo credit."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" iconLeft="add" onClick={handleCreateClient}>
              Create Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateClient} className="flex flex-col gap-4 text-xs">
          <TextField
            label="Corporate / Company Entity Name"
            placeholder="e.g. Nigerian National Petroleum Co. Ltd"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Logistics Liaison Person"
              placeholder="e.g. Tunde Bakare"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <TextField
              label="Contact Phone"
              placeholder="08012345678"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              mono
            />
          </div>

          <TextField
            label="Official Billing Email Address"
            type="email"
            placeholder="accounts.payable@nnpc.ng"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            hint="Monthly itemized PDF statement will be dispatched here"
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Credit Facility Ceiling (₦)"
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              mono
            />
            <Select
              label="Payment Terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              options={[
                { value: "15", label: "Net 15 Days" },
                { value: "30", label: "Net 30 Days (Standard)" },
                { value: "45", label: "Net 45 Days" },
                { value: "60", label: "Net 60 Days (Enterprise)" },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Statement & Invoicing Modal */}
      {selectedClient && (
        <Modal
          isOpen={showStatementModal}
          onClose={() => setShowStatementModal(false)}
          title={`Corporate Statement: ${selectedClient.companyName}`}
          description={`Contractual cargo billing statement for ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}.`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowStatementModal(false)}>
                Close
              </Button>
              <Button variant="primary" iconLeft="print" onClick={() => window.print()}>
                Print / Export PDF Statement
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 text-xs">
            {/* Header Block */}
            <div className="p-4 rounded-xl bg-surface-sunken border border-border flex justify-between items-start">
              <div>
                <span className="text-[10px] text-muted uppercase font-bold">CLIENT ACCOUNT</span>
                <div className="text-base font-bold text-foreground">{selectedClient.companyName}</div>
                <div className="text-muted">{selectedClient.contactEmail}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted uppercase font-bold">TOTAL OUTSTANDING</span>
                <div className="text-xl font-black font-mono text-foreground">
                  {formatCurrency(selectedClient.currentBalance)}
                </div>
                <Badge tone="warning" size="sm">Terms: Net {selectedClient.paymentTermsDays}d</Badge>
              </div>
            </div>

            {/* Sample Statement Line Items */}
            <div className="space-y-2">
              <span className="font-bold text-foreground">Recent Waybill Debits on this Account:</span>
              <div className="divide-y divide-border-subtle border border-border rounded-lg overflow-hidden">
                {[
                  { awb: "LOS-2026-000492", route: "LOS ➔ ABV", weight: "45.0 kg", date: "02 Sep 2026", amt: 42500 },
                  { awb: "LOS-2026-000481", route: "LOS ➔ PHC", weight: "120.5 kg", date: "01 Sep 2026", amt: 112000 },
                  { awb: "ABV-2026-000104", route: "ABV ➔ LOS", weight: "18.0 kg", date: "29 Aug 2026", amt: 18500 },
                ].map((row) => (
                  <div key={row.awb} className="p-2.5 flex items-center justify-between text-[11px] bg-surface-1">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-foreground">{row.awb}</div>
                      <div className="text-muted">{row.route} · {row.weight}</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="font-mono font-bold text-foreground">{formatCurrency(row.amt)}</div>
                      <div className="text-muted">{row.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
