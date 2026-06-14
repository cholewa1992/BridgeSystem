import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import type { BidNode, ConventionDef } from '../types';
import { findConvention, findNode, groupIntoSections, resolveConventionChildren } from '../tree';
import { BidLabel } from './BidLabel';
import { BidTreeSection } from './BidTreeSection';

interface Props {
  node: BidNode;
  depth?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Called when a convention-resolved child is clicked; receives the expanded node and the ref ID. */
  onSelectConventionChild?: (node: BidNode, fromConvRef: string) => void;
  readOnly?: boolean;
  draggingId?: string | null;
  /** Id of a node currently held on the clipboard as a cut — rendered dimmed. */
  cutId?: string | null;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDrop?: (targetParentId: string) => void;
  canDrop?: (targetParentId: string) => boolean;
  collapseVersion?: number;
  expandVersion?: number;
  conventions?: ConventionDef[];
  /** True when this node was resolved from a convention — renders read-only and dimmed. */
  isConventionChild?: boolean;
}

export function BidTree(props: Props) {
  const { node, depth = 0 } = props;
  const conventions = props.conventions ?? [];
  const isConventionChild = props.isConventionChild ?? false;

  // Convention-ref nodes always start open so responses are visible.
  const [open, setOpen] = useState(depth < 2 || !!node.conventionRefs?.length);
  const [hovered, setHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Effective children: resolved from the convention when a ref is set.
  const effectiveChildren = resolveConventionChildren(node, conventions);
  const hasChildren = effectiveChildren.length > 0;
  const hasConventionRef = !!node.conventionRefs?.length;

  const isDragging = props.draggingId === node.id;
  const isCut = props.cutId === node.id;
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
    const useGrouping =
      sections.length > 1 || (sections.length === 1 && sections[0].label !== 'Other');
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
              conventions={conventions}
            />
          ))}
        </div>
      );
    }
    return (
      <div>
        {node.children?.map((c) => (
          <BidTree key={c.id} {...props} node={c} depth={depth} conventions={conventions} />
        ))}
      </div>
    );
  }

  const isSelected = props.selectedId === node.id;
  // Convention children are never draggable; also suppress handle for the whole isConventionChild subtree.
  const showHandle = !props.readOnly && !isConventionChild && (hovered || !!props.draggingId);

  return (
    <div
      className={clsx(
        depth !== 0 && 'ml-4',
        (isDragging || isCut) && 'opacity-40',
        isConventionChild && 'opacity-70',
      )}
    >
      <div
        draggable={!props.readOnly && !isConventionChild}
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
          'flex items-center gap-2 px-[10px] py-[6px] mb-0.5 rounded-sm border select-none transition-colors duration-100 cursor-pointer',
          isConventionChild
            ? isSelected
              ? 'bg-surface-2 border-border'
              : hovered
                ? 'bg-surface-2 border-transparent'
                : 'border-transparent'
            : isValidDrop
              ? 'bg-accent-soft border-accent cursor-copy'
              : isSelected
                ? 'bg-accent-soft border-accent-border'
                : hovered
                  ? 'bg-surface-2 border-transparent'
                  : 'border-transparent',
          !isConventionChild && props.draggingId && !isValidDrop && 'cursor-default',
        )}
      >
        {/* Drag handle — visible on hover when editable, hidden on mobile */}
        <span
          className={clsx(
            'hidden w-[10px] shrink-0 cursor-grab text-2xs leading-none text-fg-subtle md:inline-block',
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

        {/* Convention badge — small indicator that children come from a convention */}
        {hasConventionRef && !isConventionChild && (
          <span
            title={`Responses from convention: ${node.conventionRefs?.map((r) => conventions.find((c) => c.id === r.id)?.name ?? r.id).join(', ')}`}
            className="ml-auto shrink-0 rounded-sm bg-surface-sunken px-1.5 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.05em] text-fg-muted"
          >
            conv
          </span>
        )}
      </div>

      {open && hasChildren && (
        <div
          className={clsx(
            'ml-[13px] border-l pl-[6px]',
            hasConventionRef ? 'border-solid border-border' : 'border-dashed border-border-strong',
          )}
        >
          {effectiveChildren.map((c) => (
            <BidTree
              key={c.id}
              {...props}
              node={c}
              depth={depth + 1}
              conventions={conventions}
              isConventionChild={isConventionChild || hasConventionRef}
              onSelect={
                hasConventionRef
                  ? (id) => {
                      const found = findNode({ ...node, children: effectiveChildren }, id);
                      if (found) {
                        const owningRef = node.conventionRefs?.find((r) => {
                          const conv = findConvention(conventions, r.id);
                          return conv && findNode(conv.root, id) !== null;
                        });
                        props.onSelectConventionChild?.(
                          found,
                          owningRef?.id ?? node.conventionRefs?.[0]?.id ?? '',
                        );
                      }
                    }
                  : props.onSelect
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
