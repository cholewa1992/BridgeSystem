import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

/*
 * Font-family / focus outline come from the `input` rules in @layer base.
 * Mirrors the old inputStyle: surface bg, strong border, sm radius, 8/12 pad.
 */
const base =
  'bg-surface border border-border-strong rounded-sm text-fg text-[14px] px-[12px] py-[8px] outline-none transition-[border-color,box-shadow] duration-100';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = 'text', ...rest }: InputProps) {
  return <input type={type} className={clsx(base, className)} {...rest} />;
}
