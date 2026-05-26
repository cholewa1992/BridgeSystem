import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  /** Shown as a small secondary line inside the dropdown. */
  description?: string;
  /** Short pill/badge shown to the right of the label. */
  meta?: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, options, placeholder, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || highlighted < 0) return;
    const li = listRef.current?.children[highlighted] as HTMLElement | undefined;
    li?.scrollIntoView({ block: 'nearest' });
  }, [open, highlighted]);

  const pick = (val: string) => {
    onChange(val);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        const idx = options.findIndex((o) => o.value === value);
        setHighlighted(idx >= 0 ? idx : 0);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      pick(options[highlighted].value);
    }
  };

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onMouseDown={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex w-full items-center gap-2 rounded border px-3 py-[7px] font-ui text-[13px] text-left transition-colors',
          open
            ? 'border-accent bg-surface text-fg outline-none ring-2 ring-accent/25'
            : 'border-border bg-surface text-fg hover:border-border-strong',
        )}
      >
        <span className="flex-1 truncate">
          {selected?.label ?? <span className="text-fg-muted">{placeholder ?? 'Select…'}</span>}
        </span>
        {selected?.meta && (
          <span className="shrink-0 rounded bg-surface-sunken px-1.5 py-0.5 font-ui text-[10px] text-fg-muted">
            {selected.meta}
          </span>
        )}
        <svg
          className={clsx(
            'h-3.5 w-3.5 shrink-0 text-fg-muted transition-transform duration-150',
            open && 'rotate-180',
          )}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg"
          role="listbox"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlighted = i === highlighted;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt.value);
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={clsx(
                  'flex cursor-pointer items-start gap-2 px-3 py-2 transition-colors',
                  isHighlighted ? 'bg-surface-2' : '',
                )}
              >
                {/* Checkmark column */}
                <span className="mt-[2px] w-3.5 shrink-0 text-accent">
                  {isSelected && (
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-ui text-[13px] font-medium text-fg">
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="mt-0.5 block truncate font-ui text-[11px] text-fg-muted">
                      {opt.description}
                    </span>
                  )}
                </span>
                {opt.meta && (
                  <span className="mt-[1px] shrink-0 rounded bg-surface-sunken px-1.5 py-0.5 font-ui text-[10px] text-fg-muted">
                    {opt.meta}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
