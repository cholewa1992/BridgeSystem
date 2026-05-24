import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

/*
 * Font-family / focus outline come from the `input` rules in @layer base.
 * Mirrors the old inputStyle: surface bg, strong border, sm radius, 8/12 pad.
 */
const base =
  'bg-surface border border-border-strong rounded-sm text-fg text-sm px-[12px] py-[8px] outline-none transition-[border-color,box-shadow] duration-100';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className, type = 'text', error, ...rest }: InputProps) {
  return (
    <input
      type={type}
      className={clsx(base, error && 'border-danger', className)}
      {...rest}
    />
  );
}
