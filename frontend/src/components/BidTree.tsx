import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import type { BidNode } from '../types';
import { groupIntoSections } from '../tree';
import { BidLabel } from './BidLabel';
import { BidTreeSection } from './BidTreeSection';

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
  collapseVersion?: number;
  expandVersion?: number;
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

  useEffect(() => {
    if ((props.collapseVersion ?? 0) > 0) setOpen(false);
  }, [props.collapseVersion]);

  useEffect(() => {
    if ((props.expandVersion ?? 0) > 0) setOpen(true);
  }, [props.expandVersion]);

  // Synthetic root — render children grouped into sections
  if (node.bids.length === 0) {
    const sections = groupIntoSections(node.children ?? []);
    const useGrouping = sections.length > 1 || (sections.length === 1 && sections[0].label !== 'Other');
    if (useGrouping) {
      return (
        <div>
          {sections.map((s) => (
            <BidTreeSection
              key={s.label}
              label={s.label}
              nodes={s.nodes}
              collapseVersion={props.collapseVersion ?? 0}
              expandVersion={props.expandVersion ?? 0}
              selectedId={props.selectedId}
              onSelect={props.onSelect}
              readOnly={props.readOnly}
              draggingId={props.draggingId}
              onDragStart={props.onDragStart}
              onDragEnd={props.onDragEnd}
              onDrop={props.onDrop}
              canDrop={props.canDrop}
            />
          ))}
        </div>
      );
    }
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

  return (
    <div className={clsx(depth !== 0 && 'ml-4', isDragging && 'opacity-40')}>
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
        className={clsx(
          'flex items-center gap-2 px-[10px] py-[6px] mb-0.5 rounded-sm border select-none transition-colors duration-100',
          isValidDrop
            ? 'bg-accent-soft border-accent'
            : isSelected
              ? 'bg-accent-soft border-accent-border'
              : hovered
                ? 'bg-surface-2 border-transparent'
                : 'border-transparent',
          props.draggingId ? (isValidDrop ? 'cursor-copy' : 'cursor-default') : 'cursor-pointer',
        )}
      >
        {/* Drag handle — visible on hover when editable */}
        <span
          className={clsx(
            'w-[10px] shrink-0 cursor-grab text-2xs leading-none text-fg-subtle',
            showHandle ? 'opacity-50' : 'opacity-0',
          )}
        >
          ⠿
        </span>

        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className={clsx(
              'inline-block w-3 shrink-0 cursor-pointer select-none text-[9px] text-fg-subtle transition-transform duration-[120ms]',
              open ? 'rotate-90' : 'rotate-0',
            )}
          >
            ▶
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <BidLabel
          bids={node.bids}
          byOpponent={node.byOpponent}
          className="shrink-0 font-display text-base font-semibold tracking-[-0.005em]"
        />

        <span className="ml-1 flex-1 font-ui text-[13px] text-fg-body">
          {node.meaning || <em className="text-fg-muted opacity-45">no meaning set</em>}
        </span>
      </div>

      {open && hasChildren && (
        <div className="ml-[13px] border-l border-dashed border-border-strong pl-[6px]">
          {node.children.map((c) => (
            <BidTree key={c.id} {...props} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
