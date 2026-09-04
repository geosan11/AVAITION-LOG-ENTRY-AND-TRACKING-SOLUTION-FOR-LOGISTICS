import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ICON } from '@/lib/ui';

export type SheetSide = 'bottom' | 'right';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: SheetSide;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  side = 'bottom',
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const positionClasses = {
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t',
    right: 'inset-y-0 right-0 w-full max-w-md h-full rounded-l-2xl border-l',
  }[side];

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content Container */}
      <div
        className={`
          fixed ${positionClasses} bg-surface-card border-border-strong shadow-modal
          flex flex-col z-10 animate-in ${side === 'bottom' ? 'slide-in-from-bottom duration-300' : 'slide-in-from-right duration-300'}
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface-2/40 flex items-center justify-between">
          <div className="text-base font-bold text-foreground">{title}</div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Close sheet"
          >
            <X size={ICON.md} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface-sunken flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
