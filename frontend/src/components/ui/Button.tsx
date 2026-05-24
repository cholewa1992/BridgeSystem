import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/*
 * Base typography/transition/hover/focus/disabled come from the `button`
 * rules in @layer base (index.css). This only adds layout, color and sizing.
 */
const base =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-transparent text-[14px] font-medium leading-tight';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white shadow-sm px-[14px] py-[8px]',
  secondary: 'bg-surface text-fg border-border-strong px-[14px] py-[8px]',
  ghost: 'bg-transparent text-fg-body px-[10px] py-[6px]',
  danger: 'bg-surface text-danger border-border-strong px-[14px] py-[8px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Compact padding + smaller text. */
  small?: boolean;
}

export function Button({
  variant = 'secondary',
  small = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        base,
        variantClasses[variant],
        small && 'px-[10px] py-[4px] text-[13px]',
        className,
      )}
      {...rest}
    />
  );
}
