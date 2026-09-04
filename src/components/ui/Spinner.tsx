import React from 'react';
import { Loader2 } from 'lucide-react';
import { ICON } from '@/lib/ui';

export interface SpinnerProps {
  size?: keyof typeof ICON | number;
  className?: string;
  tone?: 'amber' | 'muted' | 'white' | 'cobalt';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  tone = 'amber'
}) => {
  const pixelSize = typeof size === 'number' ? size : ICON[size];

  const toneClass = {
    amber: 'text-accent-amber',
    muted: 'text-muted',
    white: 'text-white',
    cobalt: 'text-accent-cobalt',
  }[tone];

  return (
    <Loader2
      size={pixelSize}
      className={`animate-spin ${toneClass} ${className}`}
      aria-hidden="true"
    />
  );
};
