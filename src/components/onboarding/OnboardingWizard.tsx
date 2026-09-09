import { useState } from 'react';
import { Button, TextField, Select, Card, Icon, InfoHint } from '@/components/ui';

export interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  company: { name: string; phone: string; email: string; address: string; cacNumber: string; };
  hub: { code: string; name: string; city: string; state: string; stationType: string; awbPrefix: string; };
  rates: Array<{ route: string; ratePerKg: number; minimumCharge: number; }>;
  staff?: { email: string; role: string; } | null;
}

const STEPS = [
  { id: 1, title: 'Company', icon: 'apartment' },
  { id: 2, title: 'Hub', icon: 'location_on' },
  { id: 3, title: 'Rates', icon: 'payments' },
  { id: 4, title: 'Team', icon: 'group' },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    company: { name: '', phone: '', email: '', address: '', cacNumber: '' },
    hub: { code: '', name: '', city: '', state: '', stationType: 'airport_cargo_desk', awbPrefix: '' },
    rates: [
      { route: 'LOS-ABV', ratePerKg: 1000, minimumCharge: 5000 },
      { route: 'LOS-PHC', ratePerKg: 1200, minimumCharge: 6000 },
      { route: 'ABV-LOS', ratePerKg: 1000, minimumCharge: 5000 },
    ],
    staff: null,
  });

  const updateCompany = (field: string, value: string) => setData(prev => ({ ...prev, company: { ...prev.company!, [field]: value } }));
  const updateHub = (field: string, value: string) => setData(prev => ({ ...prev, hub: { ...prev.hub!, [field]: value } }));
  const updateRate = (index: number, field: string, value: number) => {
    const newRates = [...data.rates!];
    newRates[index] = { ...newRates[index], [field]: value };
    setData(prev => ({ ...prev, rates: newRates }));
  };
  const updateStaff = (field: string, value: string) => setData(prev => ({ ...prev, staff: { ...prev.staff, [field]: value } as any }));

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = () => {
    onComplete(data as OnboardingData);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-surface-card rounded-lg border border-border">
      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-1 bg-border -z-10 -translate-y-1/2"></div>
        <div className="absolute left-0 top-1/2 h-1 bg-primary-container -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        {STEPS.map((s) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <div key={s.id} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive || isCompleted ? 'bg-primary-container border-primary-container text-on-primary-container' : 'bg-surface border-border text-foreground'}`}>
                <Icon name={isCompleted ? 'check_circle' : s.icon} size={20} fill={isActive || isCompleted} />
              </div>
              <span className="text-xs mt-2 text-foreground font-medium">{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Company Profile */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Icon name="apartment" className="text-accent-amber"/> Your company</h2>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Company name" value={data.company?.name} onChange={(e) => updateCompany('name', e.target.value)} />
            <TextField label="CAC number (business registration)" value={data.company?.cacNumber} onChange={(e) => updateCompany('cacNumber', e.target.value)} />
            <TextField label="Email address" type="email" value={data.company?.email} onChange={(e) => updateCompany('email', e.target.value)} />
            <TextField label="Phone number" value={data.company?.phone} onChange={(e) => updateCompany('phone', e.target.value)} />
            <div className="col-span-2">
              <TextField label="Address" value={data.company?.address} onChange={(e) => updateCompany('address', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Hub Setup */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Icon name="location_on" className="text-accent-amber"/> Your first location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select label="Location type" value={data.hub?.stationType} onChange={(e) => updateHub('stationType', e.target.value)}>
                <option value="airport_cargo_desk">Airport cargo desk</option>
                <option value="city_dropoff_hub">City drop-off point</option>
                <option value="ramp_transit_office">Ramp office</option>
              </Select>
            </div>
            <TextField label="Airport code (IATA)" value={data.hub?.code} onChange={(e) => updateHub('code', e.target.value)} />
            <TextField
              label={<span className="flex items-center gap-1">Tracking number prefix <InfoHint term="awbPrefix" /></span>}
              value={data.hub?.awbPrefix}
              onChange={(e) => updateHub('awbPrefix', e.target.value)}
            />
            <TextField label="City" value={data.hub?.city} onChange={(e) => updateHub('city', e.target.value)} />
            <TextField label="State" value={data.hub?.state} onChange={(e) => updateHub('state', e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 3: Route Rates */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Icon name="payments" className="text-accent-amber"/> Starting prices</h2>
          <div className="space-y-3">
            {data.rates?.map((rate, idx) => (
              <Card key={idx} className="p-4 flex gap-4 items-center">
                <div className="flex-1 font-medium flex items-center gap-2"><Icon name="flight_takeoff" size={16}/> {rate.route}</div>
                <div className="w-1/3">
                  <TextField type="number" label="Price per kg" value={rate.ratePerKg} onChange={(e) => updateRate(idx, 'ratePerKg', Number(e.target.value))} />
                </div>
                <div className="w-1/3">
                  <TextField type="number" label="Minimum price" value={rate.minimumCharge} onChange={(e) => updateRate(idx, 'minimumCharge', Number(e.target.value))} />
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="ghost" onClick={nextStep}>Use these</Button>
          </div>
        </div>
      )}

      {/* Step 4: Invite Staff */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Icon name="group" className="text-accent-amber"/> Invite a teammate</h2>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Their email" type="email" value={data.staff?.email || ''} onChange={(e) => updateStaff('email', e.target.value)} />
            <Select label="Role" value={data.staff?.role || 'desk_officer'} onChange={(e) => updateStaff('role', e.target.value)}>
              <option value="tenant_admin">Admin</option>
              <option value="station_manager">Station Manager</option>
              <option value="desk_officer">Desk Officer</option>
              <option value="ramp_agent">Ramp Agent</option>
            </Select>
          </div>
          <div className="flex justify-center mt-6">
            <Button variant="ghost" onClick={handleComplete}>I'm solo — skip</Button>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <Button variant="secondary" disabled={step === 1} onClick={prevStep} iconLeft="arrow_back">Back</Button>
        {step < 4 ? (
          <Button variant="primary" onClick={nextStep} iconRight="arrow_forward">Next</Button>
        ) : (
          <Button variant="primary" onClick={handleComplete} iconRight="check_circle">Complete Setup</Button>
        )}
      </div>
    </div>
  );
}
