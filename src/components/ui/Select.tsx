import React, { forwardRef, useId } from 'react';
import { Icon } from './Icon';
import { ICON } from '@/lib/ui';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  hint,
  error,
  options,
  children,
  id: customId,
  disabled,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = customId || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-text-secondary select-none tracking-wide flex items-center justify-between"
        >
          <span>{label}</span>
          {hint && !error && (
            <span className="text-[11px] text-muted font-normal">{hint}</span>
          )}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`
            w-full h-11 pl-3.5 pr-10 rounded-md text-sm transition-all appearance-none cursor-pointer
            bg-surface-container-lowest text-on-surface border
            ${error ? 'border-error ring-1 ring-error/30' : 'border-border focus:border-accent-amber focus:ring-2 focus:ring-accent-amber/20'}
            placeholder:text-muted/60
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-container
            focus:outline-none font-sans
            ${className}
          `}
          {...props}
        >
          {options
            ? options.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="absolute right-3.5 text-muted pointer-events-none flex items-center justify-center">
          <Icon name="expand_more" size={ICON.sm} />
        </div>
      </div>

      {error && (
        <p
          id={`${selectId}-error`}
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

Select.displayName = 'Select';
