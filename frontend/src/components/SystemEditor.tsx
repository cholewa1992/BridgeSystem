import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { BidNode, SystemDetail } from '../types';
import {
  useDeleteSystem,
  useForkSystem,
  useMyConventions,
  useSystem,
  useUpdateSystem,
  useUpdateVisibility,
} from '../api/queries';
import {
  ROOT_ID,
  addChainContext,
  canDropNode,
  deleteNode as treeDelete,
  editChainContext,
  findNode,
  moveNode,
  newId,
  pathTo,
  rootFromTree,
  treeFromRoot,
  updateNode,
} from '../tree';
import { Button, Input, Label } from './ui';
import { BidTree } from './BidTree';
import { BidDetailPanel } from './BidDetailPanel';
import { BidForm, type BidFormData } from './BidForm';
import { ShareDialog } from './ShareDialog';

type SaveState = 'idle' | 'saving' | 'dirty' | 'saved' | 'error';

export function SystemEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: detail, error: loadError } = useSystem(id);
  const { data: myConventions = [] } = useMyConventions();
  const updateMut = useUpdateSystem(id ?? '');
  const deleteMut = useDeleteSystem();
  const forkMut = useForkSystem();
  const visibilityMut = useUpdateVisibility();

  const [root, setRoot] = useState<BidNode | null>(null);
  const [systemName, setSystemName] = useState('');
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const loadedId = useRef<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [convChildDetail, setConvChildDetail] = useState<{ node: BidNode; convRef: string } | null>(
    null,
  );
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [collapseVersion, setCollapseVersion] = useState(0);
  const [expandVersion, setExpandVersion] = useState(0);

  // ── Seed local editable state once per system ─────────────────────────
  useEffect(() => {
    if (detail && loadedId.current !== detail.id) {
      loadedId.current = detail.id;
      const tree = detail.tree ?? { children: [] };
      setRoot(rootFromTree(tree));
      setSystemName(detail.name);
    }
  }, [detail]);

  const readOnly = !detail || (detail.permission !== 'OWNER' && detail.permission !== 'WRITE');

  // ── Persistence ───────────────────────────────────────────────────────
  const persist = useCallback(
    (rootOverride?: BidNode) => {
      if (!detail || readOnly) return;
      const r = rootOverride ?? root;
      if (!r) return;
      updateMut.mutate(
        {
          name: systemName,
          description: detail.description ?? '',
          tree: treeFromRoot(r),
        },
        {
          onSuccess: () => {
            setDirty(false);
            setJustSaved(true);
          },
          // Keep dirty=true so the debounce retries on the next render cycle.
        },
      );
    },
    [detail, readOnly, root, systemName, updateMut],
  );

  // Debounced auto-save for edits flagged dirty.
  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => persist(), 800);
    return () => window.clearTimeout(t);
  }, [dirty, persist]);

  // Flash "Saved" for 1.5s after a successful write.
  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 1500);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  const markDirty = () => setDirty(true);

  const saveState: SaveState = updateMut.isPending
    ? 'saving'
    : dirty
      ? 'dirty'
      : updateMut.isError
        ? 'error'
        : justSaved
          ? 'saved'
          : 'idle';

  // ── Derived ───────────────────────────────────────────────────────────
  const selectedNode = useMemo(() => {
    if (convChildDetail) return convChildDetail.node;
    if (!root || !selected) return null;
    return findNode(root, selected);
  }, [root, selected, convChildDetail]);

  const breadcrumb = useMemo(() => {
    if (!root || !selected) return [];
    const path = pathTo(root, selected);
    return path ? path.filter((n) => n.bids.length > 0) : [];
  }, [root, selected]);

  /**
   * Chain context for adding a child under the currently selected node. Includes the
   * selected node in the walk so the new child sees it as the last call.
   */
  const addChain = useMemo(() => {
    if (!root || !selected) return null;
    return addChainContext(root, selected);
  }, [root, selected]);

  /**
   * Chain context for adding an opening bid at the root.
   */
  const openingChain = useMemo(() => (root ? addChainContext(root, ROOT_ID) : null), [root]);

  /**
   * Chain context for editing the currently selected node — excludes the
   * node itself, since its call is what's being changed.
   */
  const editChain = useMemo(() => {
    if (!root || !selected) return null;
    return editChainContext(root, selected);
  }, [root, selected]);

  // ── Commands ──────────────────────────────────────────────────────────
  const submitAdd = (parentId: string) => (data: BidFormData) => {
    if (!root) return;
    const node: BidNode = {
      id: newId(),
      bids: data.bids,
      meaning: data.meaning,
      ...(data.notes ? { notes: data.notes } : {}),
      ...(data.byOpponent ? { byOpponent: true } : {}),
      ...(data.alerted ? { alerted: true } : {}),
      children: [],
    };
    setRoot(updateNode(root, parentId, (n) => ({ ...n, children: [...n.children, node] })));
    setAddingTo(null);
    setSelected(node.id);
    markDirty();
  };

  const submitEdit = (data: BidFormData) => {
    if (!root || !selected) return;
    setRoot(
      updateNode(root, selected, (n) => ({
        ...n,
        bids: data.bids,
        meaning: data.meaning,
        notes: data.notes || undefined,
        byOpponent: data.byOpponent || undefined,
        alerted: data.alerted || undefined,
      })),
    );
    setEditing(false);
    markDirty();
  };

  const handleMove = (newParentId: string) => {
    const movingId = draggingIdRef.current;
    if (!root || !movingId) return;
    const newRoot = moveNode(root, movingId, newParentId);
    setRoot(newRoot);
    draggingIdRef.current = null;
    setDraggingId(null);
    // Discrete action — persist immediately rather than waiting on the debounce.
    persist(newRoot);
  };

  const canDropHere = (targetParentId: string): boolean => {
    const movingId = draggingIdRef.current;
    if (!root || !movingId) return false;
    return canDropNode(root, movingId, targetParentId);
  };

  const startDrag = (nodeId: string) => {
    draggingIdRef.current = nodeId;
    // Delay the state update so the browser captures the ghost image before
    // React re-renders the row with reduced opacity (Safari fix).
    setTimeout(() => setDraggingId(nodeId), 0);
  };

  const endDrag = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
  };

  const deleteSelected = () => {
    if (!root || !selected) return;
    if (!confirm('Delete this bid and its continuations?')) return;
    setRoot(treeDelete(root, selected));
    setSelected(null);
    setEditing(false);
    markDirty();
  };

  const handleAttachConvention = (convId: string, args: Record<string, string>) => {
    if (!root || !selected) return;
    setRoot(
      updateNode(root, selected, (n) => ({
        ...n,
        conventionRef: convId,
        conventionArgs: Object.keys(args).length > 0 ? args : undefined,
        children: [], // stored children cleared; effective children come from convention
      })),
    );
    markDirty();
  };

  const handleDetachConvention = () => {
    if (!root || !selected) return;
    setRoot(
      updateNode(root, selected, (n) => ({
        ...n,
        conventionRef: undefined,
        conventionArgs: undefined,
      })),
    );
    markDirty();
  };

  const onRename = () => {
    setEditingName(false);
    markDirty();
  };

  const onFork = async () => {
    if (!detail) return;
    try {
      const forked = await forkMut.mutateAsync(detail.id);
      navigate(`/systems/${forked.id}`);
    } catch {
      // surfaced via forkMut.error
    }
  };

  const onToggleVisibility = () => {
    if (!detail) return;
    visibilityMut.mutate({ id: detail.id, isPublic: !detail.isPublic });
  };

  const onDeleteSystem = async () => {
    if (!detail) return;
    if (!confirm(`Delete "${detail.name}"? This cannot be undone.`)) return;
    try {
      await deleteMut.mutateAsync(detail.id);
      navigate('/');
    } catch {
      // surfaced via deleteMut.error
    }
  };

  // Reset transient form state when selection changes
  const select = (nodeId: string) => {
    setSelected(nodeId);
    setConvChildDetail(null);
    setEditing(false);
    setAddingTo(null);
  };

  const selectConventionChild = (node: BidNode, fromConvRef: string) => {
    setSelected(null);
    setConvChildDetail({ node, convRef: fromConvRef });
    setEditing(false);
    setAddingTo(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (loadError && !detail) {
    return (
      <div className="p-[60px] font-ui text-danger">
        <p className="mt-0">{(loadError as Error).message}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to list
        </Button>
      </div>
    );
  }
  if (!detail || !root) {
    return <div className="p-[60px] text-fg-muted">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="flex items-center gap-[14px] border-b border-border bg-surface px-6 py-3">
        {editingName && !readOnly ? (
          <Input
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => e.key === 'Enter' && onRename()}
            autoFocus
            className="flex-1 font-display text-lg font-semibold"
          />
        ) : (
          <h1
            onClick={() => !readOnly && setEditingName(true)}
            className={clsx(
              'm-0 font-display text-lg font-semibold tracking-[-0.005em] text-fg',
              readOnly ? 'cursor-default' : 'cursor-pointer',
            )}
            title={readOnly ? '' : 'Click to rename'}
          >
            {systemName}
          </h1>
        )}
        <div className="ml-auto flex items-center gap-3">
          <SaveIndicator state={saveState} permission={detail.permission} />
          {detail.permission === 'OWNER' && (
            <>
              <Button
                variant="secondary"
                onClick={onToggleVisibility}
                loading={visibilityMut.isPending}
                small
              >
                {detail.isPublic ? 'Make Private' : 'Make Public'}
              </Button>
              <Button variant="secondary" onClick={() => setShowShare(true)}>
                Share
              </Button>
              <Button variant="danger" onClick={onDeleteSystem} disabled={deleteMut.isPending}>
                Delete
              </Button>
            </>
          )}
          {user && detail.permission !== 'OWNER' && (
            <>
              {forkMut.isError && (
                <span className="font-ui text-[13px] text-danger">
                  {(forkMut.error as Error)?.message ?? 'Fork failed'}
                </span>
              )}
              <Button variant="secondary" onClick={onFork} loading={forkMut.isPending}>
                Fork
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree pane */}
        <aside className="w-[460px] overflow-y-auto border-r border-border bg-surface px-[18px] py-5">
          <div className="mb-[14px] flex items-center gap-2">
            <Label className="flex-1">Bidding sequences</Label>
            <Button variant="ghost" small onClick={() => setCollapseVersion((v) => v + 1)}>
              Collapse all
            </Button>
            <Button variant="ghost" small onClick={() => setExpandVersion((v) => v + 1)}>
              Expand all
            </Button>
            {!readOnly && addingTo !== ROOT_ID && (
              <Button variant="secondary" onClick={() => setAddingTo(ROOT_ID)}>
                + Opening bid
              </Button>
            )}
          </div>

          {!readOnly && draggingId && canDropHere(ROOT_ID) && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setRootDragOver(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setRootDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setRootDragOver(false);
                handleMove(ROOT_ID);
              }}
              className={clsx(
                'mb-2 cursor-copy rounded-sm border border-dashed px-2.5 py-1.5 text-center text-[12px] text-fg-muted',
                rootDragOver
                  ? 'border-accent bg-accent-soft'
                  : 'border-border-strong bg-transparent',
              )}
            >
              Move here as opening bid
            </div>
          )}

          <BidTree
            node={root}
            depth={0}
            selectedId={selected ?? convChildDetail?.node.id ?? null}
            onSelect={select}
            onSelectConventionChild={selectConventionChild}
            readOnly={readOnly}
            draggingId={draggingId}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            onDrop={handleMove}
            canDrop={canDropHere}
            collapseVersion={collapseVersion}
            expandVersion={expandVersion}
            conventions={myConventions}
          />

          {addingTo === ROOT_ID && openingChain && (
            <div className="mt-3">
              <BidForm
                mode="add"
                chain={openingChain}
                onSubmit={submitAdd(ROOT_ID)}
                onCancel={() => setAddingTo(null)}
              />
            </div>
          )}
        </aside>

        {/* Detail pane */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-[760px]">
            {detail.forkedFrom && (
              <div className="mb-4 rounded-sm border border-border bg-surface-sunken px-3 py-2 font-ui text-[13px] text-fg-muted">
                Forked from <span className="font-medium text-fg">"{detail.forkedFrom.name}"</span>{' '}
                by{' '}
                <button
                  onClick={() => navigate(`/users/${detail.forkedFrom!.ownerUsername}`)}
                  className="text-fg-muted underline-offset-2 hover:underline"
                >
                  @{detail.forkedFrom.ownerUsername}
                </button>
              </div>
            )}
            <BidDetailPanel
              selected={selectedNode}
              breadcrumb={breadcrumb}
              readOnly={readOnly}
              addChain={addChain}
              editChain={editChain}
              addingTo={addingTo}
              editing={editing}
              onRequestAdd={() => {
                if (selected) setAddingTo(selected);
              }}
              onCancelAdd={() => setAddingTo(null)}
              onSubmitAdd={selected ? submitAdd(selected) : () => {}}
              onRequestEdit={() => setEditing(true)}
              onCancelEdit={() => setEditing(false)}
              onSubmitEdit={submitEdit}
              onDelete={deleteSelected}
              onSelect={select}
              systemId={detail.id}
              conventions={myConventions}
              onAttachConvention={handleAttachConvention}
              onDetachConvention={handleDetachConvention}
              onOpenConventionLibrary={() => navigate(`/systems/${detail.id}/conventions`)}
              fromConventionRef={convChildDetail?.convRef}
            />
          </div>
        </main>
      </div>

      {showShare && <ShareDialog systemId={detail.id} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function SaveIndicator({
  state,
  permission,
}: {
  state: SaveState;
  permission: SystemDetail['permission'];
}) {
  let text: string;
  let colorClass: string;

  if (state === 'saving') {
    text = 'Saving…';
    colorClass = 'text-accent';
  } else if (state === 'saved') {
    text = 'Saved';
    colorClass = 'text-success';
  } else if (state === 'dirty') {
    text = 'Unsaved changes';
    colorClass = 'text-accent';
  } else if (state === 'error') {
    text = 'Save failed';
    colorClass = 'text-danger';
  } else {
    text = permission === 'OWNER' ? 'Owner' : permission;
    colorClass = 'text-fg-muted';
  }

  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 font-ui text-xs font-medium', colorClass)}
    >
      <span
        className={clsx(
          'h-1.5 w-1.5 rounded-full bg-current',
          state === 'saving' ? 'opacity-100' : 'opacity-70',
        )}
      />
      {text}
    </span>
  );
}
