import React, { forwardRef } from 'react';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import { ICON } from '@/lib/ui';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  /** Material Symbols glyph name. */
  iconLeft?: string;
  /** Material Symbols glyph name. */
  iconRight?: string;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingLabel,
  iconLeft,
  iconRight,
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
      'bg-primary-container text-on-primary-container hover:brightness-110 active:scale-[0.98] shadow-glow-strong font-bold border-none transition-all',
    secondary:
      'bg-surface-container-high text-on-surface border border-border hover:bg-surface-container-highest hover:border-border-strong active:scale-[0.98] transition-all',
    destructive:
      'bg-error-bg text-error-fg border border-error-border hover:bg-error hover:text-white active:scale-[0.98] transition-all',
    ghost:
      'bg-transparent text-muted hover:text-on-surface hover:bg-surface-hover active:scale-[0.98] border-none transition-all',
    subtle:
      'bg-surface-container text-on-surface border border-border-subtle hover:bg-surface-container-high active:scale-[0.98] transition-all',
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
          {iconLeft && <Icon name={iconLeft} size={iconSizes[size]} />}
          {children}
          {iconRight && <Icon name={iconRight} size={iconSizes[size]} />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
