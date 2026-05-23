import type { TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

const base =
  'bg-surface border border-border-strong rounded-sm text-fg text-[14px] px-[12px] py-[8px] outline-none transition-[border-color,box-shadow] duration-100';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...rest }: TextareaProps) {
  return <textarea className={clsx(base, className)} {...rest} />;
}
