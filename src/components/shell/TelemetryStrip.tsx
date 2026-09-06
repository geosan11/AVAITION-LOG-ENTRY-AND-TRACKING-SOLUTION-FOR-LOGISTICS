import React from 'react';

export interface TelemetryStripProps {
  title: string;
  subtitle: string;
  breadcrumb: string;
  serialQueue?: string;
  rampStatus?: string;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  title,
  subtitle,
  breadcrumb,
  serialQueue = 'EHI-MMA2-CGO-000482',
  rampStatus = 'GREEN LIGHT',
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-accent-amber/10 text-accent-amber uppercase tracking-widest font-semibold">
          {breadcrumb}
        </span>
      </div>
      <h1 className="font-display text-headline-lg text-on-surface tracking-tight">{title}</h1>
      <p className="font-label-caps text-label-caps tracking-widest text-accent-amber font-medium mt-1">
        {subtitle}
      </p>
    </div>

    <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl shadow-panel shrink-0">
      <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_10px_currentColor] text-success animate-pulse" />
      <div className="flex flex-col">
        <span className="font-label-caps text-label-caps text-on-surface-variant">SERIAL QUEUE</span>
        <span className="font-mono-data-md text-mono-data-md text-accent-amber font-bold">{serialQueue}</span>
      </div>
      <div className="h-8 w-px bg-border mx-1" />
      <div className="flex flex-col text-right">
        <span className="font-label-caps text-label-caps text-on-surface-variant">RAMP STATUS</span>
        <span className="font-mono-data-sm text-mono-data-sm text-success font-semibold">{rampStatus}</span>
      </div>
    </div>
  </div>
);
