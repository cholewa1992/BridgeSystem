import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import type { BidNode } from '../types';
import { BidTree } from './BidTree';

interface Props {
  label: string;
  nodes: BidNode[];
  collapseVersion: number;
  expandVersion: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  readOnly?: boolean;
  draggingId?: string | null;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDrop?: (targetParentId: string) => void;
  canDrop?: (targetParentId: string) => boolean;
}

export function BidTreeSection({
  label,
  nodes,
  collapseVersion,
  expandVersion,
  ...treeProps
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (collapseVersion > 0) setOpen(false);
  }, [collapseVersion]);

  useEffect(() => {
    if (expandVersion > 0) setOpen(true);
  }, [expandVersion]);

  return (
    <div className="mb-1">
      <div
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer select-none items-center gap-1.5 border-b border-border px-[10px] py-[8px]"
      >
        <span
          className={clsx(
            'inline-block w-3 shrink-0 text-[9px] text-fg-subtle transition-transform duration-[120ms]',
            open ? 'rotate-90' : 'rotate-0',
          )}
        >
          ▶
        </span>
        <span className="font-ui text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          {label}
        </span>
      </div>
      {open && (
        <div className="pt-1">
          {nodes.map((node) => (
            <BidTree
              key={node.id}
              {...treeProps}
              node={node}
              depth={0}
              collapseVersion={collapseVersion}
              expandVersion={expandVersion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
