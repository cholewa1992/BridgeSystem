import { useState } from 'react';
import type { BidNode } from '../types';
import { BidLabel } from './BidLabel';

interface Props {
  node: BidNode;
  depth?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  readOnly?: boolean;
  draggingId?: string | null;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDrop?: (targetParentId: string) => void;
  canDrop?: (targetParentId: string) => boolean;
}

export function BidTree(props: Props) {
  const { node, depth = 0 } = props;
  const [open, setOpen] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isDragging = props.draggingId === node.id;
  // canDrop reads from a ref in SystemEditor so it's always current,
  // even before draggingId state has propagated through React.
  const isValidDrop = dragOver && (props.canDrop?.(node.id) ?? false);

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
  const showHandle = !props.readOnly && (hovered || !!props.draggingId);

  const rowBg = isValidDrop
    ? 'var(--accent-soft)'
    : isSelected
    ? 'var(--accent-soft)'
    : hovered
    ? 'var(--surface-2)'
    : 'transparent';

  const rowBorder = isValidDrop
    ? '1px solid var(--accent)'
    : isSelected
    ? '1px solid #ecd2c5'
    : '1px solid transparent';

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 16, opacity: isDragging ? 0.4 : 1 }}>
      <div
        draggable={!props.readOnly}
        onClick={() => props.onSelect(node.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', node.id);
          // Call synchronously — SystemEditor writes the ref immediately and
          // delays the setState internally so Safari captures the ghost image
          // before the opacity re-render.
          props.onDragStart?.(node.id);
        }}
        onDragEnd={() => {
          setDragOver(false);
          props.onDragEnd?.();
        }}
        onDragOver={(e) => {
          e.stopPropagation();
          // canDrop reads from a ref — valid even before React state has settled.
          if (props.canDrop?.(node.id)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOver(true);
          } else {
            setDragOver(false);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (props.canDrop?.(node.id)) {
            props.onDrop?.(node.id);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          marginBottom: 2,
          borderRadius: 'var(--radius-sm)',
          cursor: props.draggingId ? (isValidDrop ? 'copy' : 'default') : 'pointer',
          background: rowBg,
          border: rowBorder,
          transition: 'background 100ms ease',
          userSelect: 'none',
        }}
      >
        {/* Drag handle — visible on hover when editable */}
        <span
          style={{
            fontSize: 11,
            color: 'var(--fg-subtle)',
            width: 10,
            flexShrink: 0,
            opacity: showHandle ? 0.5 : 0,
            cursor: 'grab',
            lineHeight: 1,
          }}
        >
          ⠿
        </span>

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
