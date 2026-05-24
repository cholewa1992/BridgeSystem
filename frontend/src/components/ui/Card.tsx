import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Larger radius + stronger shadow (was cardElevatedStyle). */
  elevated?: boolean;
}

export function Card({ elevated = false, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface border border-border',
        elevated ? 'rounded-lg shadow-md' : 'rounded-md shadow-sm',
        className,
      )}
      {...rest}
    />
  );
}
