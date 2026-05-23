import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import { suitColor, suitOf } from '../styles';

interface Props {
  bids: string[];
  byOpponent?: boolean;
  style?: CSSProperties;
}

/**
 * Renders one or more equivalent calls. Single-bid nodes look like before
 * (a single colored token). Multi-bid groups render each call in its own
 * suit color separated by a subtle `/`. Interference wraps the whole thing
 * in parentheses and dims it.
 */
export function BidLabel({ bids, byOpponent, style }: Props) {
  if (bids.length === 0) return null;
  const opp = !!byOpponent;

  return (
    <span
      style={{
        opacity: opp ? 0.65 : 1,
        fontStyle: opp ? 'italic' : 'normal',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {opp && <span>(</span>}
      {bids.map((b, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span
              style={{
                color: 'var(--fg-subtle)',
                margin: '0 4px',
                fontStyle: 'normal',
                fontWeight: 400,
              }}
            >
              /
            </span>
          )}
          <span style={{ color: suitColor(suitOf(b)) }}>{b}</span>
        </Fragment>
      ))}
      {opp && <span>)</span>}
    </span>
  );
}
