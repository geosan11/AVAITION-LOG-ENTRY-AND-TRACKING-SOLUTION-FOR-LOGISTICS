import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: CardPadding;
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  padding = 'md',
  glass = false,
  hoverable = false,
  className = '',
  ...props
}) => {
  const paddingClasses: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-7',
  };

  return (
    <div
      className={`
        rounded-xl border border-border transition-all
        ${glass ? 'bg-surface-card-glass backdrop-blur-md' : 'bg-surface-card'}
        ${hoverable ? 'hover:border-border-strong hover:shadow-md cursor-pointer' : 'shadow-card'}
        flex flex-col overflow-hidden
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border-subtle bg-surface-2/40 flex items-center justify-between">
          {header}
        </div>
      )}

      <div className={`flex-1 ${paddingClasses[padding]}`}>
        {children}
      </div>

      {footer && (
        <div className="px-5 py-3.5 border-t border-border-subtle bg-surface-sunken flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
