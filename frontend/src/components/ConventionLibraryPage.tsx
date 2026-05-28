import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import type { BidNode, ConventionDetail, ConventionParam, ConventionSummary } from '../types';
import {
  useMyConventions,
  useCreateConvention,
  useUpdateConvention,
  useDeleteConvention,
  useUpdateConventionVisibility,
  useForkConvention,
  usePublicConventions,
  useToggleConventionLike,
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
  updateNode,
} from '../tree';
import { Button, Input, Label, Textarea } from './ui';
import { BidTree } from './BidTree';
import { BidDetailPanel } from './BidDetailPanel';
import { BidForm, type BidFormData } from './BidForm';

// ── Types ─────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'dirty' | 'saved';

// ── Main page ─────────────────────────────────────────────────────────────

export function ConventionLibraryPage() {
  const { data: conventions, isLoading } = useMyConventions();
  const createMut = useCreateConvention();
  const deleteMut = useDeleteConvention();

  const [tab, setTab] = useState<'mine' | 'public'>('mine');
  const [sort, setSort] = useState<'newest' | 'most_liked'>('newest');
  const { data: publicConventions } = usePublicConventions(sort);

  const [selectedConventionId, setSelectedConventionId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Select first convention when loaded if none selected
  useEffect(() => {
    if (conventions && conventions.length > 0 && !selectedConventionId) {
      setSelectedConventionId(conventions[0].id);
    }
  }, [conventions, selectedConventionId]);

  const selectedConvention = useMemo(
    () => conventions?.find((c) => c.id === selectedConventionId) ?? null,
    [conventions, selectedConventionId],
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createMut.mutateAsync({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setSelectedConventionId(created.id);
      setShowNewForm(false);
      setNewName('');
      setNewDesc('');
    } catch {
      // surfaced via createMut.error
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this convention? This cannot be undone.')) return;
    try {
      await deleteMut.mutateAsync(id);
      if (selectedConventionId === id) {
        const remaining = conventions?.filter((c) => c.id !== id) ?? [];
        setSelectedConventionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      // surfaced via deleteMut.error
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center gap-[14px] border-b border-border bg-surface px-6 py-3">
        <div className="flex gap-[3px] text-[14px] opacity-70">
          <span className="text-suit-black">♠</span>
          <span className="text-suit-red">♥</span>
          <span className="text-suit-red">♦</span>
          <span className="text-suit-black">♣</span>
        </div>
        <h1 className="m-0 font-display text-lg font-semibold tracking-[-0.005em] text-fg">
          Conventions
        </h1>

        <div className="ml-auto flex items-center gap-2">
          {/* Mine / Public toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1">
            <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
              Mine
            </TabButton>
            <TabButton active={tab === 'public'} onClick={() => setTab('public')}>
              Public
            </TabButton>
          </div>

          {/* Sort (public tab only) */}
          {tab === 'public' && (
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1">
              <TabButton active={sort === 'newest'} onClick={() => setSort('newest')}>
                Newest
              </TabButton>
              <TabButton active={sort === 'most_liked'} onClick={() => setSort('most_liked')}>
                Most liked
              </TabButton>
            </div>
          )}
        </div>
      </header>

      {/* Body — mine: editor layout; public: scrollable card list */}
      {tab === 'public' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[880px] px-[32px] pb-[80px] pt-[32px]">
            {publicConventions === undefined ? (
              <div className="text-[14px] text-fg-muted">Loading…</div>
            ) : publicConventions.length === 0 ? (
              <div className="rounded-md border border-border bg-surface px-6 py-10 text-center text-fg-muted">
                <div className="mb-2.5 text-[32px] opacity-60">♣</div>
                <p className="m-0 font-ui text-[15px]">
                  No public conventions yet — be the first to publish one.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {publicConventions.map((c) => (
                  <PublicConventionCard
                    key={c.id}
                    convention={c}
                    onForkSuccess={() => setTab('mine')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — convention list */}
          <aside className="flex w-[280px] flex-col border-r border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Label>Conventions</Label>
              <Button variant="secondary" small onClick={() => setShowNewForm((v) => !v)}>
                + New
              </Button>
            </div>

            {showNewForm && (
              <div className="border-b border-border px-4 py-3">
                <div className="mb-2">
                  <Input
                    placeholder="Convention name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                    className="w-full"
                  />
                </div>
                <div className="mb-2">
                  <Input
                    placeholder="Description (optional)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    small
                    onClick={handleCreate}
                    loading={createMut.isPending}
                    disabled={!newName.trim()}
                  >
                    Create
                  </Button>
                  <Button
                    variant="ghost"
                    small
                    onClick={() => {
                      setShowNewForm(false);
                      setNewName('');
                      setNewDesc('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-1">
              {isLoading ? (
                <div className="px-4 py-3 text-[13px] text-fg-muted">Loading…</div>
              ) : !conventions || conventions.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-fg-muted">
                  No conventions yet. Create your first one above.
                </div>
              ) : (
                conventions.map((conv) => (
                  <ConventionListItem
                    key={conv.id}
                    convention={conv}
                    selected={selectedConventionId === conv.id}
                    onSelect={() => setSelectedConventionId(conv.id)}
                    onDelete={() => handleDelete(conv.id)}
                  />
                ))
              )}
            </div>
          </aside>

          {/* Right panel — editor */}
          <main className="flex-1 overflow-y-auto">
            {selectedConvention ? (
              <ConventionEditor key={selectedConvention.id} convention={selectedConvention} />
            ) : (
              <div className="flex h-full items-center justify-center text-[14px] text-fg-muted">
                {isLoading ? 'Loading…' : 'Select or create a convention to edit.'}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

// ── PublicConventionCard ───────────────────────────────────────────────────

function PublicConventionCard({
  convention,
  onForkSuccess,
}: {
  convention: ConventionSummary;
  onForkSuccess: () => void;
}) {
  const forkMut = useForkConvention();
  const likeMut = useToggleConventionLike(convention.id);
  const heartFilled = convention.likedByMe === true;

  return (
    <div className="rounded-md border border-border bg-surface px-[22px] py-[18px] font-ui shadow-sm transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
          {convention.name}
        </h3>
        {convention.isPublic && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-accent-ink">
            Public
          </span>
        )}
      </div>

      <p className="mb-0 mt-1 font-ui text-[13px] text-fg-muted">
        by <span className="font-medium">@{convention.ownerUsername}</span>
        {convention.paramCount > 0 && (
          <span className="ml-2 text-fg-subtle">
            · {convention.paramCount} param{convention.paramCount !== 1 ? 's' : ''}
          </span>
        )}
      </p>

      {convention.description && (
        <p className="mb-0 mt-2 line-clamp-2 font-ui text-[13px] text-fg-muted">
          {convention.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4">
        <span className="font-ui text-[13px] text-fg-muted">⑂ {convention.forkCount}</span>

        <button
          onClick={() => likeMut.mutate({ liked: convention.likedByMe === true })}
          disabled={likeMut.isPending}
          className={
            'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-ui text-[13px] transition-colors ' +
            (heartFilled ? 'text-suit-red' : 'text-fg-muted hover:text-suit-red')
          }
          title={heartFilled ? 'Unlike' : 'Like'}
        >
          <span aria-hidden="true">{heartFilled ? '♥' : '♡'}</span>
          <span>{convention.likeCount}</span>
        </button>

        {!convention.ownedByMe && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              forkMut.mutate(convention.id, { onSuccess: onForkSuccess });
            }}
            disabled={forkMut.isPending}
            className="ml-auto rounded-sm border border-border px-2.5 py-1 font-ui text-[12px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {forkMut.isPending ? 'Forking…' : 'Fork'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── TabButton ──────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-sm px-3 py-1.5 font-ui text-[13px] font-medium transition-colors ' +
        (active ? 'bg-accent text-white shadow-sm' : 'text-fg-muted hover:text-fg')
      }
    >
      {children}
    </button>
  );
}

// ── ConventionListItem ─────────────────────────────────────────────────────

function ConventionListItem({
  convention,
  selected,
  onSelect,
  onDelete,
}: {
  convention: ConventionDetail;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const canEdit = convention.permission === 'OWNER' || convention.permission === 'WRITE';

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'group flex cursor-pointer items-start justify-between px-4 py-2.5 transition-colors',
        selected ? 'bg-accent-soft' : 'hover:bg-surface-2',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-ui text-[14px] font-medium text-fg">{convention.name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-fg-muted">
          {convention.isPublic && (
            <span className="rounded-full bg-accent-soft px-1.5 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.05em] text-accent-ink">
              Public
            </span>
          )}
          {!canEdit && <span className="text-fg-subtle">read-only</span>}
          {convention.parameters.length > 0 && (
            <span>
              {convention.parameters.length} param{convention.parameters.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      {convention.permission === 'OWNER' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-2 shrink-0 rounded-sm p-0.5 text-[12px] text-fg-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
          title="Delete convention"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── ConventionEditor ───────────────────────────────────────────────────────

function ConventionEditor({ convention }: { convention: ConventionDetail }) {
  const updateMut = useUpdateConvention(convention.id);
  const visibilityMut = useUpdateConventionVisibility(convention.id);
  const forkMut = useForkConvention();
  const navigate = useNavigate();

  const readOnly = convention.permission !== 'OWNER' && convention.permission !== 'WRITE';

  // Local editable state
  const [convName, setConvName] = useState(convention.name);
  const [convDesc, setConvDesc] = useState(convention.description ?? '');
  const [parameters, setParameters] = useState<ConventionParam[]>(convention.parameters);
  const [root, setRoot] = useState<BidNode>(() =>
    rootFromTree(convention.root ? { children: convention.root.children ?? [] } : { children: [] }),
  );

  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // Bid tree UI state
  const [selected, setSelected] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);

  const markDirty = () => setDirty(true);

  // ── Persistence ────────────────────────────────────────────────────────
  const persist = useCallback(
    (rootOverride?: BidNode) => {
      if (readOnly) return;
      const r = rootOverride ?? root;
      updateMut.mutate(
        {
          name: convName,
          description: convDesc || null,
          parameters,
          root: r,
        },
        {
          onSuccess: () => {
            setDirty(false);
            setJustSaved(true);
          },
          onError: () => setDirty(false),
        },
      );
    },
    [readOnly, root, convName, convDesc, parameters, updateMut],
  );

  // Debounced auto-save
  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => persist(), 800);
    return () => window.clearTimeout(t);
  }, [dirty, persist]);

  // Flash "Saved"
  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 1500);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  // ── Derived ────────────────────────────────────────────────────────────
  const selectedNode = useMemo(() => {
    if (!selected) return null;
    return findNode(root, selected);
  }, [root, selected]);

  const breadcrumb = useMemo(() => {
    if (!selected) return [];
    const path = pathTo(root, selected);
    return path ? path.filter((n) => n.bids.length > 0) : [];
  }, [root, selected]);

  const addChain = useMemo(() => {
    if (!selected) return null;
    return addChainContext(root, selected);
  }, [root, selected]);

  const openingChain = useMemo(() => addChainContext(root, ROOT_ID), [root]);

  const editChain = useMemo(() => {
    if (!selected) return null;
    return editChainContext(root, selected);
  }, [root, selected]);

  // ── Commands ───────────────────────────────────────────────────────────
  const submitAdd = (parentId: string) => (data: BidFormData) => {
    const node: BidNode = {
      id: newId(),
      bids: data.bids,
      meaning: data.meaning,
      ...(data.notes ? { notes: data.notes } : {}),
      ...(data.byOpponent ? { byOpponent: true } : {}),
      children: [],
    };
    setRoot(updateNode(root, parentId, (n) => ({ ...n, children: [...n.children, node] })));
    setAddingTo(null);
    setSelected(node.id);
    markDirty();
  };

  const submitEdit = (data: BidFormData) => {
    if (!selected) return;
    setRoot(
      updateNode(root, selected, (n) => ({
        ...n,
        bids: data.bids,
        meaning: data.meaning,
        notes: data.notes || undefined,
        byOpponent: data.byOpponent || undefined,
      })),
    );
    setEditing(false);
    markDirty();
  };

  const handleMove = (newParentId: string) => {
    const movingId = draggingIdRef.current;
    if (!movingId) return;
    const newRoot = moveNode(root, movingId, newParentId);
    setRoot(newRoot);
    draggingIdRef.current = null;
    setDraggingId(null);
    persist(newRoot);
  };

  const canDropHere = (targetParentId: string): boolean => {
    const movingId = draggingIdRef.current;
    if (!movingId) return false;
    return canDropNode(root, movingId, targetParentId);
  };

  const startDrag = (nodeId: string) => {
    draggingIdRef.current = nodeId;
    setTimeout(() => setDraggingId(nodeId), 0);
  };

  const endDrag = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (!confirm('Delete this bid and its continuations?')) return;
    setRoot(treeDelete(root, selected));
    setSelected(null);
    setEditing(false);
    markDirty();
  };

  const select = (nodeId: string) => {
    setSelected(nodeId);
    setEditing(false);
    setAddingTo(null);
  };

  const onRename = () => {
    setEditingName(false);
    markDirty();
  };

  const onToggleVisibility = () => {
    visibilityMut.mutate(!convention.isPublic);
  };

  const onFork = async () => {
    try {
      await forkMut.mutateAsync(convention.id);
      navigate('/conventions');
    } catch {
      // surfaced via forkMut.error
    }
  };

  const saveState: SaveState = updateMut.isPending
    ? 'saving'
    : dirty
      ? 'dirty'
      : justSaved
        ? 'saved'
        : 'idle';

  return (
    <div className="flex h-full flex-col">
      {/* Convention header bar */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-6 py-3">
        {editingName && !readOnly ? (
          <Input
            value={convName}
            onChange={(e) => setConvName(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => e.key === 'Enter' && onRename()}
            autoFocus
            className="flex-1 font-display text-base font-semibold"
          />
        ) : (
          <h2
            onClick={() => !readOnly && setEditingName(true)}
            className={clsx(
              'm-0 font-display text-base font-semibold tracking-[-0.005em] text-fg',
              readOnly ? 'cursor-default' : 'cursor-pointer',
            )}
            title={readOnly ? '' : 'Click to rename'}
          >
            {convName}
          </h2>
        )}

        <div className="ml-auto flex items-center gap-3">
          <ConventionSaveIndicator state={saveState} permission={convention.permission} />
          {convention.permission === 'OWNER' && (
            <Button
              variant="secondary"
              small
              onClick={onToggleVisibility}
              loading={visibilityMut.isPending}
            >
              {convention.isPublic ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          {convention.permission !== 'OWNER' && (
            <Button variant="secondary" small onClick={onFork} loading={forkMut.isPending}>
              Fork
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Bid tree pane */}
        <div className="w-[420px] shrink-0 overflow-y-auto border-r border-border bg-surface px-[18px] py-5">
          <div className="mb-3">
            <Label>Description</Label>
            {readOnly ? (
              <p className="mt-1 font-ui text-[13px] text-fg-muted">
                {convDesc || <em>No description.</em>}
              </p>
            ) : (
              <Textarea
                value={convDesc}
                onChange={(e) => {
                  setConvDesc(e.target.value);
                  markDirty();
                }}
                placeholder="Describe when and how to use this convention…"
                rows={2}
                className="mt-1 w-full"
              />
            )}
          </div>

          <ParameterEditor
            parameters={parameters}
            readOnly={readOnly}
            onChange={(p) => {
              setParameters(p);
              markDirty();
            }}
          />

          <div className="mb-[14px] mt-4 flex items-center justify-between">
            <Label>Bidding sequences</Label>
            {!readOnly && addingTo !== ROOT_ID && (
              <Button variant="secondary" small onClick={() => setAddingTo(ROOT_ID)}>
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
            selectedId={selected}
            onSelect={select}
            readOnly={readOnly}
            draggingId={draggingId}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            onDrop={handleMove}
            canDrop={canDropHere}
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
        </div>

        {/* Detail pane */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-[760px]">
            {convention.forkedFrom && (
              <div className="mb-4 rounded-sm border border-border bg-surface-sunken px-3 py-2 font-ui text-[13px] text-fg-muted">
                Forked from{' '}
                <span className="font-medium text-fg">"{convention.forkedFrom.name}"</span>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ParameterEditor ────────────────────────────────────────────────────────

function ParameterEditor({
  parameters,
  readOnly,
  onChange,
}: {
  parameters: ConventionParam[];
  readOnly: boolean;
  onChange: (params: ConventionParam[]) => void;
}) {
  const addParam = () => {
    onChange([...parameters, { id: newId(), name: '', description: '', defaultValue: '' }]);
  };

  const updateParam = (index: number, patch: Partial<ConventionParam>) => {
    const updated = parameters.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange(updated);
  };

  const removeParam = (index: number) => {
    onChange(parameters.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <Label>Parameters</Label>
        {!readOnly && (
          <Button variant="secondary" small onClick={addParam}>
            + Param
          </Button>
        )}
      </div>
      {parameters.length === 0 ? (
        <p className="font-ui text-[12px] text-fg-muted">No parameters defined.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {parameters.map((param, i) => (
            <div key={param.id} className="rounded-sm border border-border bg-surface-sunken p-2">
              {readOnly ? (
                <div>
                  <div className="font-ui text-[13px] font-medium text-fg">{param.name}</div>
                  {param.description && (
                    <div className="mt-0.5 font-ui text-[12px] text-fg-muted">
                      {param.description}
                    </div>
                  )}
                  {param.defaultValue && (
                    <div className="mt-0.5 font-ui text-[12px] text-fg-muted">
                      Default: {param.defaultValue}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={param.name}
                      onChange={(e) => updateParam(i, { name: e.target.value })}
                      className="flex-1 text-[12px]"
                    />
                    <button
                      onClick={() => removeParam(i)}
                      className="shrink-0 rounded-sm p-0.5 text-[12px] text-fg-muted hover:text-danger"
                      title="Remove parameter"
                    >
                      ✕
                    </button>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={param.description ?? ''}
                    onChange={(e) => updateParam(i, { description: e.target.value })}
                    className="text-[12px]"
                  />
                  <Input
                    placeholder="Default value (optional)"
                    value={param.defaultValue ?? ''}
                    onChange={(e) => updateParam(i, { defaultValue: e.target.value })}
                    className="text-[12px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ConventionSaveIndicator ────────────────────────────────────────────────

function ConventionSaveIndicator({
  state,
  permission,
}: {
  state: SaveState;
  permission: ConventionDetail['permission'];
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
