import { useState } from 'react';
import type { BidNode } from '../types';
import { BidLabel } from './BidLabel';

interface Props {
  node: BidNode;
  depth?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function BidTree(props: Props) {
  const { node, depth = 0 } = props;
  const [open, setOpen] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);
  const hasChildren = (node.children?.length ?? 0) > 0;

  // Synthetic root — render children only
  if (node.bids.length === 0) {
    return (
      <div>
        {node.children?.map((c) => (
          <BidTree key={c.id} {...props} node={c} depth={depth} />
        ))}
      </div>
    );
  }

  const isSelected = props.selectedId === node.id;

  const rowBg = isSelected
    ? 'var(--accent-soft)'
    : hovered
    ? 'var(--surface-2)'
    : 'transparent';

  const rowBorder = isSelected ? '1px solid #ecd2c5' : '1px solid transparent';

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 16 }}>
      <div
        onClick={() => props.onSelect(node.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          marginBottom: 2,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          background: rowBg,
          border: rowBorder,
          transition: 'background 100ms ease',
        }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            style={{
              fontSize: 9,
              color: 'var(--fg-subtle)',
              width: 12,
              flexShrink: 0,
              cursor: 'pointer',
              userSelect: 'none',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 120ms ease',
              display: 'inline-block',
            }}
          >
            ▶
          </span>
        ) : (
          <span style={{ width: 12, flexShrink: 0 }} />
        )}

        <BidLabel
          bids={node.bids}
          byOpponent={node.byOpponent}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: '-0.005em',
            flexShrink: 0,
          }}
        />

        <span
          style={{
            fontSize: 13.5,
            color: 'var(--fg-body)',
            flex: 1,
            fontFamily: 'var(--font-ui)',
            marginLeft: 4,
          }}
        >
          {node.meaning || (
            <em style={{ opacity: 0.45, color: 'var(--fg-muted)' }}>no meaning set</em>
          )}
        </span>
      </div>

      {open && hasChildren && (
        <div
          style={{
            borderLeft: '1px dashed var(--border-strong)',
            marginLeft: 13,
            paddingLeft: 6,
          }}
        >
          {node.children.map((c) => (
            <BidTree key={c.id} {...props} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
