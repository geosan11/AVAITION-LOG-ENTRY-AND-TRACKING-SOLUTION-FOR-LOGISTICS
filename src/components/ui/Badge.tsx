import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ICON } from '@/lib/ui';

export type BadgeTone = 'success' | 'error' | 'warning' | 'info' | 'amber' | 'purple' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon: Icon,
  className = ''
}) => {
  const toneClasses: Record<BadgeTone, string> = {
    success: 'bg-success-bg border-success-border text-success-fg',
    error: 'bg-error-bg border-error-border text-error-fg',
    warning: 'bg-warning-bg border-warning-border text-warning-fg',
    info: 'bg-info-bg border-info-border text-info-fg',
    amber: 'bg-amber-bg border-amber-border text-amber-fg',
    purple: 'bg-purple-bg border-purple-border text-purple-fg',
    neutral: 'bg-neutral-bg border-neutral-border text-neutral-fg',
  };

  const dotColor: Record<BadgeTone, string> = {
    success: 'bg-success',
    error: 'bg-error',
    warning: 'bg-warning',
    info: 'bg-info',
    amber: 'bg-accent-amber',
    purple: 'bg-purple',
    neutral: 'bg-muted',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1 rounded-sm',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5 rounded-md',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center border font-sans select-none tracking-wide
        ${sizeClasses[size]}
        ${toneClasses[tone]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor[tone]}`}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon size={size === 'sm' ? ICON.xs : ICON.sm} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
