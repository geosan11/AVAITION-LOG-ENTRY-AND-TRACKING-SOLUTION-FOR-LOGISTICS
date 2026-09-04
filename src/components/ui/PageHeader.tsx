import React from 'react';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { ICON } from '@/lib/ui';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: LucideIcon;
  onBack?: () => void;
  actions?: React.ReactNode;
  sticky?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  onBack,
  actions,
  sticky = false,
}) => {
  return (
    <header
      className={`
        w-full py-4 px-6 border-b border-border bg-surface-card-glass backdrop-blur-md
        flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all
        ${sticky ? 'sticky top-0 z-30' : ''}
      `}
    >
      {/* Left section: Back button + Title / Subtitle / Icon / Badge */}
      <div className="flex items-center gap-3.5">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 hover:border-border-strong text-foreground transition-all cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={ICON.md} aria-hidden="true" />
          </button>
        )}

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-accent-amber/15 border border-accent-amber/30 text-accent-amber flex items-center justify-center shrink-0">
            <Icon size={ICON.lg} aria-hidden="true" />
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-bold text-foreground tracking-tight font-sans">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-muted font-normal mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right section: Action Buttons Slot */}
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </header>
  );
};
