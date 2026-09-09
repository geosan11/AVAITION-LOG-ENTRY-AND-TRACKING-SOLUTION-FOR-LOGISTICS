import React from 'react';

export interface TelemetryStripProps {
  title: string;
  /** One plain sentence describing what this screen is for. */
  subtitle: string;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({ title, subtitle }) => (
  <div className="flex flex-col gap-1">
    <h1 className="font-display text-headline-lg text-on-surface tracking-tight">{title}</h1>
    <p className="text-sm text-muted max-w-2xl">{subtitle}</p>
  </div>
);
