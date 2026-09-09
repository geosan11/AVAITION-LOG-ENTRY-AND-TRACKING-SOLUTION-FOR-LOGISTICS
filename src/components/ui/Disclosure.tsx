import React, { useCallback, useId, useState } from 'react';
import { Icon } from './Icon';
import { ICON } from '@/lib/ui';

export interface DisclosureProps {
  /** Header text / node. */
  label: React.ReactNode;
  /** Short muted note shown on the right of the header, e.g. "optional". */
  hint?: string;
  /** Leading Material Symbols glyph name. */
  icon?: string;
  /** Open on first render (ignored when `persistKey` has a stored value). */
  defaultOpen?: boolean;
  /** When set, the open/closed state is remembered in localStorage. */
  persistKey?: string;
  children: React.ReactNode;
  className?: string;
}

const storageKey = (k: string) => `aerolog-disclosure-${k}`;

/**
 * A labelled expand / collapse region for "advanced / optional" detail.
 * Header is a real <button> (Enter/Space, aria-expanded, focus ring); the body
 * is toggled with the `hidden` attribute so it stays in the DOM for forms.
 */
export const Disclosure: React.FC<DisclosureProps> = ({
  label,
  hint,
  icon,
  defaultOpen = false,
  persistKey,
  children,
  className = '',
}) => {
  const bodyId = useId();
  const [open, setOpen] = useState<boolean>(() => {
    if (persistKey) {
      try {
        const stored = localStorage.getItem(storageKey(persistKey));
        if (stored !== null) return stored === '1';
      } catch {
        /* storage unavailable */
      }
    }
    return defaultOpen;
  });

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (persistKey) {
        try {
          localStorage.setItem(storageKey(persistKey), next ? '1' : '0');
        } catch {
          /* storage unavailable */
        }
      }
      return next;
    });
  }, [persistKey]);

  return (
    <div className={`rounded-lg border border-border-subtle bg-surface-container/30 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left cursor-pointer rounded-lg
          focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2
          text-xs font-semibold text-text-secondary hover:text-on-surface transition-colors"
      >
        <Icon
          name="chevron_right"
          size={ICON.sm}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        {icon && <Icon name={icon} size={ICON.sm} className="shrink-0 text-accent-amber" />}
        <span className="flex-1 tracking-wide">{label}</span>
        {hint && <span className="text-[11px] font-normal text-muted">{hint}</span>}
      </button>

      <div id={bodyId} hidden={!open} className="px-3.5 pb-3.5 pt-1 border-t border-border-subtle">
        {children}
      </div>
    </div>
  );
};
