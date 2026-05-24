import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/*
 * Base typography/transition/hover/focus/disabled come from the `button`
 * rules in @layer base (index.css). This only adds layout, color and sizing.
 */
const base =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-transparent text-sm font-medium leading-tight';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white shadow-sm px-[14px] py-[8px]',
  secondary: 'bg-surface text-fg border-border-strong px-[14px] py-[8px]',
  ghost: 'bg-transparent text-fg-body px-[10px] py-[6px]',
  danger: 'bg-surface text-danger border-border-strong px-[14px] py-[8px]',
};

function Spinner() {
  return (
    <svg
      className="h-[14px] w-[14px] animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path
        fill="currentColor"
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Compact padding + smaller text. */
  small?: boolean;
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  small = false,
  loading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        base,
        variantClasses[variant],
        small && 'px-[10px] py-[4px] text-[13px]',
        className,
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
