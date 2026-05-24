import type { ReactNode } from 'react';

export interface FieldProps {
  label: string;
  hint?: string;
  /** Error message — shown instead of hint when set; also used to style child inputs. */
  error?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="text-sm font-medium text-fg-body">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-fg-muted">{hint}</span>
      ) : null}
    </label>
  );
}
