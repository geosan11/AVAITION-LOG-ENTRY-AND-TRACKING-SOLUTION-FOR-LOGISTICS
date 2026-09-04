import React, { forwardRef } from 'react';
import { Spinner } from './Spinner';
import { LucideIcon } from 'lucide-react';
import { ICON } from '@/lib/ui';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingLabel,
  iconLeft: IconLeft,
  iconRight: IconRight,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}, ref) => {
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs font-semibold rounded-sm gap-1.5',
    md: 'h-10 px-4 text-sm font-semibold rounded-md gap-2',
    lg: 'h-12 px-6 text-base font-bold rounded-lg gap-2.5',
  };

  const iconSizes: Record<ButtonSize, number> = {
    sm: ICON.xs,
    md: ICON.sm,
    lg: ICON.md,
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-accent-amber text-on-accent hover:bg-accent-amber-hover active:scale-[0.98] shadow-sm font-bold border-none transition-all',
    secondary:
      'bg-surface-1 text-foreground border border-border hover:bg-surface-2 hover:border-border-strong active:scale-[0.98] transition-all',
    destructive:
      'bg-error-bg text-error-fg border border-error-border hover:bg-error hover:text-white active:scale-[0.98] transition-all',
    ghost:
      'bg-transparent text-muted hover:text-foreground hover:bg-surface-hover active:scale-[0.98] border-none transition-all',
    subtle:
      'bg-surface-2 text-foreground border border-border-subtle hover:bg-surface-3 active:scale-[0.98] transition-all',
  };

  const isActuallyDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isActuallyDisabled}
      className={`
        inline-flex items-center justify-center cursor-pointer select-none font-sans
        focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Spinner
            size={iconSizes[size]}
            tone={variant === 'primary' ? 'amber' : 'muted'}
          />
          <span>{loadingLabel || children}</span>
        </>
      ) : (
        <>
          {IconLeft && <IconLeft size={iconSizes[size]} aria-hidden="true" />}
          {children}
          {IconRight && <IconRight size={iconSizes[size]} aria-hidden="true" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
