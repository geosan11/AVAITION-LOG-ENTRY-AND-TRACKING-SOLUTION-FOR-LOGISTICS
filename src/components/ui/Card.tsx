import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: CardPadding;
  glass?: boolean;
  hoverable?: boolean;
  /** Nested sub-panel: sits one elevation step lower, no outer shadow. */
  nested?: boolean;
  /** Amber-accent spotlight panel with ambient ionisation orb (dark only). */
  accent?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  padding = 'md',
  glass = false,
  hoverable = false,
  nested = false,
  accent = false,
  className = '',
  ...props
}) => {
  const paddingClasses: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-4',
    lg: 'p-5',
  };

  const surface = glass
    ? 'bg-surface-card-glass backdrop-blur-md'
    : nested
      ? 'bg-surface-container-lowest'
      : 'bg-surface-container-low';

  const elevation = hoverable
    ? 'hover:border-border-strong hover:shadow-glow cursor-pointer'
    : nested
      ? ''
      : 'shadow-panel';

  return (
    <div
      className={`
        rounded-xl border transition-all flex flex-col overflow-hidden
        ${accent ? 'border-accent-amber/30 ring-1 ring-accent-amber/10 panel-orb' : 'border-border'}
        ${surface}
        ${elevation}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-4 py-3.5 border-b border-border-subtle bg-surface-container/40 flex items-center justify-between">
          {header}
        </div>
      )}

      <div className={`flex-1 ${paddingClasses[padding]}`}>
        {children}
      </div>

      {footer && (
        <div className="px-4 py-3 border-t border-border-subtle bg-surface-container-lowest flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
