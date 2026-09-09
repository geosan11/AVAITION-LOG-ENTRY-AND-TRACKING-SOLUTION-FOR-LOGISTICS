import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { GLOSSARY, type GlossaryKey } from '@/lib/glossary';

export interface InfoHintProps {
  /** Pull the explanation from the glossary. */
  term?: GlossaryKey;
  /** Or pass explicit text (wins over `term`). */
  text?: string;
  /** Accessible name for the trigger button. Defaults to "What does this mean?". */
  label?: string;
  size?: number;
  className?: string;
}

/**
 * A small "info" trigger that reveals one plain sentence of help.
 * Opens on hover, focus and tap; closes on Esc, blur or outside click. The panel
 * is portalled to <body> and positioned from the trigger's bounding box so it is
 * never clipped by a card's `overflow-hidden`.
 */
export const InfoHint: React.FC<InfoHintProps> = ({
  term,
  text,
  label = 'What does this mean?',
  size = 14,
  className = '',
}) => {
  const content = text ?? (term ? GLOSSARY[term].definition : '');
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 220;
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setPos({ top: r.bottom + 6, left });
  }, []);

  const show = useCallback(() => {
    place();
    setOpen(true);
  }, [place]);
  const hide = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    const onScroll = () => hide();
    const onClick = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) hide();
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, hide]);

  if (!content) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.preventDefault();
          open ? hide() : show();
        }}
        className={`inline-flex items-center justify-center align-middle text-muted hover:text-accent-amber
          focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-1
          rounded-full cursor-help transition-colors ${className}`}
      >
        <Icon name="info" size={size} />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            id={panelId}
            role="tooltip"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: 220 }}
            className="z-[60] bg-surface-container-high text-on-surface border border-border rounded-md
              shadow-elevated text-xs leading-relaxed p-2.5"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
};
