import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type AlertVariant = 'danger' | 'success';

const variantClasses: Record<AlertVariant, string> = {
  danger: 'bg-danger-soft border-danger-border text-danger',
  success: 'bg-success-soft border-success text-success',
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export function Alert({ variant = 'danger', className, ...rest }: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        'rounded-sm border px-[12px] py-[10px] text-sm',
        variantClasses[variant],
        className,
      )}
      {...rest}
    />
  );
}
