import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

/** Uppercase section label (was labelStyle). */
export function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        'text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted',
        className,
      )}
      {...rest}
    />
  );
}
