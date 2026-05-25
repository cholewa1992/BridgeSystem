import { Fragment } from 'react';
import { clsx } from 'clsx';
import { suitColor, suitOf } from '../styles';

interface Props {
  bids: string[];
  byOpponent?: boolean;
  className?: string;
}

/**
 * Renders one or more equivalent calls. Single-bid nodes look like before
 * (a single colored token). Multi-bid groups render each call in its own
 * suit color separated by a subtle `/`. Interference wraps the whole thing
 * in parentheses and dims it.
 *
 * Suit colors are data-driven, so the per-token color stays an inline style.
 */
export function BidLabel({ bids, byOpponent, className }: Props) {
  if (bids.length === 0) return null;
  const opp = !!byOpponent;

  return (
    <span className={clsx('whitespace-nowrap', opp && 'italic opacity-65', className)}>
      {opp && <span>(</span>}
      {bids.map((b, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="mx-1 font-normal not-italic text-fg-subtle">/</span>}
          <span style={{ color: suitColor(suitOf(b)) }}>{b === 'P' ? 'Pass' : b}</span>
        </Fragment>
      ))}
      {opp && <span>)</span>}
    </span>
  );
}
