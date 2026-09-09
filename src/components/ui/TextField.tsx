import React, { forwardRef, useId } from 'react';
import { Icon } from './Icon';
import { ICON } from '@/lib/ui';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
  /** Material Symbols glyph name. */
  iconLeft?: string;
  /** Material Symbols glyph name. */
  iconRight?: string;
  mono?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  mono = false,
  id: customId,
  disabled,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-text-secondary select-none tracking-wide flex items-center justify-between"
        >
          <span>{label}</span>
          {hint && !error && (
            <span className="text-[11px] text-muted font-normal">{hint}</span>
          )}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {iconLeft && (
          <div className="absolute left-3 text-muted pointer-events-none flex items-center justify-center">
            <Icon name={iconLeft} size={ICON.sm} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`
            w-full h-11 px-3.5 rounded-md text-sm transition-all
            bg-surface-container-lowest text-on-surface border
            ${error ? 'border-error ring-1 ring-error/30' : 'border-border focus:border-accent-amber focus:ring-2 focus:ring-accent-amber/20'}
            ${iconLeft ? 'pl-9' : ''}
            ${iconRight ? 'pr-9' : ''}
            ${mono ? 'font-mono' : 'font-sans'}
            placeholder:text-muted/60
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-container
            focus:outline-none
            ${className}
          `}
          {...props}
        />

        {iconRight && (
          <div className="absolute right-3 text-muted pointer-events-none flex items-center justify-center">
            <Icon name={iconRight} size={ICON.sm} />
          </div>
        )}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs font-medium text-error-fg bg-error-bg border border-error-border px-2.5 py-1 rounded-sm flex items-center gap-1.5"
          role="alert"
        >
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

TextField.displayName = 'TextField';
