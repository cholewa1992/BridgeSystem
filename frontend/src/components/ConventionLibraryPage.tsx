import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate, useParams } from 'react-router-dom';
import type { BidNode, ConventionDef, ConventionParam } from '../types';
import { useSystem, useUpdateSystem } from '../api/queries';
import {
  ROOT_ID,
  addChainContext,
  conventionsFromTree,
  countConventionUsage,
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
import { Button, Input, Label, Textarea } from './ui';
import { BidTree } from './BidTree';
import { BidForm, type BidFormData } from './BidForm';

// ── Page ─────────────────────────────────────────────────────────────────────

export function ConventionLibraryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, error: loadError } = useSystem(id);
  const updateMut = useUpdateSystem(id ?? '');

  const [conventions, setConventions] = useState<ConventionDef[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const loadedId = useRef<string | null>(null);

  // Seed conventions from system tree once per load
  useEffect(() => {
    if (detail && loadedId.current !== detail.id) {
      loadedId.current = detail.id;
      setConventions(conventionsFromTree(detail.tree ?? { children: [] }));
    }
  }, [detail]);

  const readOnly = !detail || (detail.permission !== 'OWNER' && detail.permission !== 'WRITE');

  // Debounced auto-save
  const persist = useCallback(
    (updated: ConventionDef[]) => {
      if (!detail || readOnly) return;
      // Preserve the bidding tree; only update conventions.
      const treeRoot = rootFromTree(detail.tree ?? { children: [] });
      updateMut.mutate(
        {
          name: detail.name,
          description: detail.description ?? '',
          tree: treeFromRoot(treeRoot, updated),
        },
        {
          onSuccess: () => {
            setDirty(false);
            setJustSaved(true);
          },
        },
      );
    },
    [detail, readOnly, updateMut],
  );

  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => persist(conventions), 800);
    return () => window.clearTimeout(t);
  }, [dirty, conventions, persist]);

  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 1500);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  const markDirty = useCallback(() => setDirty(true), []);

  // Compute usage counts from the main tree
  const usageCounts = useMemo(() => {
    if (!detail) return new Map<string, number>();
    const mainRoot = rootFromTree(detail.tree ?? { children: [] });
    const map = new Map<string, number>();
    for (const c of conventions) {
      map.set(c.id, countConventionUsage(mainRoot, c.id));
    }
    return map;
  }, [detail, conventions]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    const id = newId();
    const newConv: ConventionDef = {
      id,
      name: 'New convention',
      // Root must use ROOT_ID so that updateNode(convRoot, ROOT_ID, ...) can find it.
      root: { id: ROOT_ID, bids: [], meaning: '', children: [] },
    };
    const updated = [...conventions, newConv];
    setConventions(updated);
    setSelectedConvId(id);
    markDirty();
  };

  const handleUpdate = useCallback(
    (updated: ConventionDef) => {
      setConventions((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      markDirty();
    },
    [markDirty],
  );

  const handleDelete = (convId: string) => {
    const usage = usageCounts.get(convId) ?? 0;
    if (usage > 0) {
      alert(
        `This convention is used in ${usage} place${usage === 1 ? '' : 's'} in the bidding tree. Detach it from all nodes before deleting.`,
      );
      return;
    }
    if (!confirm('Delete this convention?')) return;
    setConventions((prev) => prev.filter((c) => c.id !== convId));
    if (selectedConvId === convId) setSelectedConvId(null);
    markDirty();
  };

  const selectedConv = conventions.find((c) => c.id === selectedConvId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

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

  if (!detail) return <div className="p-[60px] text-fg-muted">Loading…</div>;

  const saveLabel = updateMut.isPending
    ? 'Saving…'
    : justSaved
      ? 'Saved'
      : dirty
        ? 'Unsaved changes'
        : '';

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
        <Button variant="ghost" small onClick={() => navigate(`/systems/${detail.id}`)}>
          ← {detail.name}
        </Button>
        <h1 className="m-0 font-display text-lg font-semibold tracking-[-0.005em] text-fg">
          Convention Library
        </h1>
        {saveLabel && <span className="ml-auto font-ui text-xs text-fg-muted">{saveLabel}</span>}
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane: convention list */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Label>Conventions ({conventions.length})</Label>
            {!readOnly && (
              <Button variant="secondary" small onClick={handleCreate}>
                + New
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {conventions.length === 0 ? (
              <p className="px-4 py-6 text-center font-ui text-[13px] text-fg-muted">
                No conventions yet.
                {!readOnly && (
                  <>
                    <br />
                    Click "+ New" to create one.
                  </>
                )}
              </p>
            ) : (
              conventions.map((c) => (
                <ConventionListItem
                  key={c.id}
                  convention={c}
                  usageCount={usageCounts.get(c.id) ?? 0}
                  selected={selectedConvId === c.id}
                  readOnly={readOnly}
                  onClick={() => setSelectedConvId(c.id)}
                  onDelete={() => handleDelete(c.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right pane: convention editor */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          {selectedConv ? (
            <ConventionEditor
              key={selectedConvId!}
              convention={selectedConv}
              readOnly={readOnly}
              onChange={handleUpdate}
            />
          ) : (
            <div className="mt-20 text-center font-ui text-fg-subtle">
              <div className="mb-3 text-[36px] opacity-50">⬡</div>
              <p className="m-0 text-[15px]">
                {conventions.length === 0
                  ? 'Create a convention to get started.'
                  : 'Select a convention to edit it.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── ConventionListItem ────────────────────────────────────────────────────────

function ConventionListItem({
  convention,
  usageCount,
  selected,
  readOnly,
  onClick,
  onDelete,
}: {
  convention: ConventionDef;
  usageCount: number;
  selected: boolean;
  readOnly: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'group flex cursor-pointer items-start justify-between gap-2 border-b border-border px-4 py-3 transition-colors',
        selected ? 'bg-accent-soft' : 'hover:bg-surface-2',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-ui text-[13px] font-medium text-fg">{convention.name}</div>
        <div className="mt-0.5 flex items-center gap-2">
          {(convention.parameters?.length ?? 0) > 0 && (
            <span className="font-ui text-[11px] text-fg-muted">
              {convention.parameters!.length} param
              {convention.parameters!.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="font-ui text-[11px] text-fg-muted">used {usageCount}×</span>
        </div>
      </div>
      {!readOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded px-1.5 py-0.5 font-ui text-[11px] text-danger opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger-soft"
          title="Delete convention"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── ConventionEditor ──────────────────────────────────────────────────────────

function ConventionEditor({
  convention,
  readOnly,
  onChange,
}: {
  convention: ConventionDef;
  readOnly: boolean;
  onChange: (updated: ConventionDef) => void;
}) {
  const [name, setName] = useState(convention.name);
  const [description, setDescription] = useState(convention.description ?? '');
  const [params, setParams] = useState<ConventionParam[]>(convention.parameters ?? []);

  const paramStrains = useMemo(
    () =>
      (params ?? [])
        .filter((p) => p.type === 'suit')
        .map((p) => ({ name: p.name, label: p.label })),
    [params],
  );

  // Subtree editing state
  const [convRoot, setConvRoot] = useState<BidNode>(convention.root);
  const [selected, setSelected] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const commitRoot = (newRoot: BidNode) => {
    setConvRoot(newRoot);
    onChange({
      ...convention,
      name,
      description: description || undefined,
      parameters: params.length ? params : undefined,
      root: newRoot,
    });
  };

  const commitMeta = (updates: {
    name?: string;
    description?: string;
    params?: ConventionParam[];
  }) => {
    const n = updates.name ?? name;
    const d = updates.description ?? description;
    const p = updates.params ?? params;
    onChange({
      ...convention,
      name: n,
      description: d || undefined,
      parameters: p.length ? p : undefined,
      root: convRoot,
    });
  };

  // ── Subtree CRUD ──
  const selectedNode = useMemo(
    () => (selected ? findNode(convRoot, selected) : null),
    [convRoot, selected],
  );
  const breadcrumb = useMemo(() => {
    if (!selected) return [];
    const path = pathTo(convRoot, selected);
    return path ? path.filter((n) => n.bids.length > 0) : [];
  }, [convRoot, selected]);

  const addChain = useMemo(
    () => (selected ? addChainContext(convRoot, selected) : null),
    [convRoot, selected],
  );
  const rootChain = useMemo(() => addChainContext(convRoot, ROOT_ID), [convRoot]);
  const editChain = useMemo(
    () => (selected ? editChainContext(convRoot, selected) : null),
    [convRoot, selected],
  );

  const submitAdd = (parentId: string) => (data: BidFormData) => {
    const node: BidNode = {
      id: newId(),
      bids: data.bids,
      meaning: data.meaning,
      ...(data.notes ? { notes: data.notes } : {}),
      ...(data.byOpponent ? { byOpponent: true } : {}),
      ...(data.alerted ? { alerted: true } : {}),
      children: [],
    };
    const newRoot = updateNode(convRoot, parentId, (n) => ({
      ...n,
      children: [...n.children, node],
    }));
    setAddingTo(null);
    setSelected(node.id);
    commitRoot(newRoot);
  };

  const submitEdit = (data: BidFormData) => {
    if (!selected) return;
    const newRoot = updateNode(convRoot, selected, (n) => ({
      ...n,
      bids: data.bids,
      meaning: data.meaning,
      notes: data.notes || undefined,
      byOpponent: data.byOpponent || undefined,
      alerted: data.alerted || undefined,
    }));
    setEditing(false);
    commitRoot(newRoot);
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (!confirm('Delete this bid and its continuations?')) return;
    commitRoot(treeDelete(convRoot, selected));
    setSelected(null);
    setEditing(false);
  };

  const handleMoveNode = (newParentId: string) => {
    if (!selected) return;
    commitRoot(moveNode(convRoot, selected, newParentId));
  };

  // ── Param CRUD ──
  const addParam = () => {
    const updated = [...params, { name: '', label: '', defaultValue: undefined }];
    setParams(updated);
    commitMeta({ params: updated });
  };

  const updateParam = (index: number, field: keyof ConventionParam, value: string) => {
    const updated = params.map((p, i) => {
      if (i !== index) return p;
      const next = { ...p, [field]: value || undefined };
      // Reset defaultValue when switching type
      if (field === 'type') next.defaultValue = undefined;
      return next;
    });
    setParams(updated);
    commitMeta({ params: updated });
  };

  const removeParam = (index: number) => {
    const updated = params.filter((_, i) => i !== index);
    setParams(updated);
    commitMeta({ params: updated });
  };

  return (
    <div className="max-w-[720px]">
      {/* Convention name */}
      {readOnly ? (
        <h2 className="mb-5 font-display text-2xl font-semibold text-fg">{name}</h2>
      ) : (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => commitMeta({ name })}
          className="mb-5 font-display text-2xl font-semibold"
          placeholder="Convention name"
        />
      )}

      {/* Parameters */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <Label>Parameters</Label>
          {!readOnly && (
            <Button variant="ghost" small onClick={addParam}>
              + Add param
            </Button>
          )}
        </div>
        {params.length === 0 ? (
          <p className="font-ui text-[13px] text-fg-muted">
            No parameters.{!readOnly && ' Add one to use {{placeholders}} in bid meanings.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {params.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded border border-border bg-surface px-3 py-2"
              >
                <div className="flex flex-1 flex-wrap gap-2">
                  <label className="flex flex-col gap-0.5">
                    <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                      Name
                    </span>
                    {readOnly ? (
                      <span className="font-mono text-[13px]">
                        {'{{'}
                        {p.name}
                        {'}}'}
                      </span>
                    ) : (
                      <Input
                        value={p.name}
                        onChange={(e) => updateParam(i, 'name', e.target.value)}
                        placeholder="e.g. agreedSuit"
                        className="w-[130px] font-mono text-[13px]"
                      />
                    )}
                  </label>
                  <label className="flex flex-col gap-0.5">
                    <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                      Label
                    </span>
                    {readOnly ? (
                      <span className="font-ui text-[13px]">{p.label}</span>
                    ) : (
                      <Input
                        value={p.label}
                        onChange={(e) => updateParam(i, 'label', e.target.value)}
                        placeholder="e.g. Agreed suit"
                        className="w-[180px] text-[13px]"
                      />
                    )}
                  </label>
                  <label className="flex flex-col gap-0.5">
                    <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                      Type
                    </span>
                    {readOnly ? (
                      <span className="font-ui text-[13px] text-fg-muted">
                        {p.type === 'suit' ? 'Suit' : 'Text'}
                      </span>
                    ) : (
                      <div className="flex overflow-hidden rounded border border-border text-[12px]">
                        {(['text', 'suit'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateParam(i, 'type', t)}
                            className={
                              'px-2 py-1 font-ui capitalize transition-colors ' +
                              ((p.type ?? 'text') === t
                                ? 'bg-accent text-white'
                                : 'bg-surface text-fg-body hover:bg-surface-2')
                            }
                          >
                            {t === 'suit' ? '♣♦♥♠' : 'Abc'}
                          </button>
                        ))}
                      </div>
                    )}
                  </label>
                  {(p.type ?? 'text') === 'text' && (
                    <label className="flex flex-col gap-0.5">
                      <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                        Default
                      </span>
                      {readOnly ? (
                        <span className="font-ui text-[13px] text-fg-muted">
                          {p.defaultValue ?? '—'}
                        </span>
                      ) : (
                        <Input
                          value={p.defaultValue ?? ''}
                          onChange={(e) => updateParam(i, 'defaultValue', e.target.value)}
                          placeholder="optional"
                          className="w-[100px] text-[13px]"
                        />
                      )}
                    </label>
                  )}
                  {p.type === 'suit' && !readOnly && (
                    <label className="flex flex-col gap-0.5">
                      <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                        Default
                      </span>
                      <SuitPicker
                        value={p.defaultValue ?? ''}
                        onChange={(v) => updateParam(i, 'defaultValue', v)}
                      />
                    </label>
                  )}
                  {p.type === 'suit' && readOnly && (
                    <label className="flex flex-col gap-0.5">
                      <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                        Default
                      </span>
                      <span className="font-ui text-[13px] text-fg-muted">
                        {p.defaultValue ?? '—'}
                      </span>
                    </label>
                  )}
                </div>
                {!readOnly && (
                  <button
                    onClick={() => removeParam(i)}
                    className="mt-4 shrink-0 rounded px-1.5 py-0.5 font-ui text-[11px] text-danger hover:bg-danger-soft"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {params.length > 0 && (
          <p className="mt-2 font-ui text-[11px] text-fg-muted">
            Use <code className="rounded bg-surface-sunken px-1">{'{{name}}'}</code> in bid meanings
            and notes below to insert parameter values at runtime.
          </p>
        )}
      </section>

      {/* Description / notes */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <Label>Notes</Label>
        </div>
        {readOnly ? (
          description ? (
            <p className="font-ui text-[14px] text-fg-body">{description}</p>
          ) : (
            <p className="font-ui text-[13px] text-fg-muted">No notes.</p>
          )
        ) : (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => commitMeta({ description })}
            placeholder="Longer explanation — when to use it, conditions, partnership notes…"
            className="w-full resize-y font-body leading-normal"
            rows={4}
          />
        )}
      </section>

      {/* Subtree editor */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <Label>Convention bids</Label>
          {!readOnly && addingTo !== ROOT_ID && (
            <Button variant="secondary" small onClick={() => setAddingTo(ROOT_ID)}>
              + Add bid
            </Button>
          )}
        </div>

        {convRoot.children.length === 0 && addingTo !== ROOT_ID && (
          <p className="mb-3 font-ui text-[13px] text-fg-muted">
            No bids defined yet. Click "+ Add bid" to add the first response.
          </p>
        )}

        <div className="mb-4">
          <BidTree
            node={convRoot}
            depth={0}
            selectedId={selected}
            onSelect={(nodeId) => {
              setSelected(nodeId);
              setEditing(false);
              setAddingTo(null);
            }}
            readOnly={readOnly}
            onDrop={handleMoveNode}
          />
        </div>

        {addingTo === ROOT_ID && (
          <div className="mb-4">
            <BidForm
              mode="add"
              chain={rootChain}
              onSubmit={submitAdd(ROOT_ID)}
              onCancel={() => setAddingTo(null)}
              paramStrains={paramStrains}
            />
          </div>
        )}

        {/* Selected node detail */}
        {selectedNode && (
          <div className="rounded-md border border-border bg-surface px-5 py-4">
            {editing && !readOnly && editChain ? (
              <BidForm
                mode="edit"
                chain={editChain}
                initial={{
                  bids: selectedNode.bids,
                  meaning: selectedNode.meaning,
                  notes: selectedNode.notes ?? '',
                  byOpponent: selectedNode.byOpponent ?? false,
                  alerted: selectedNode.alerted ?? false,
                }}
                onSubmit={submitEdit}
                onCancel={() => setEditing(false)}
                paramStrains={paramStrains}
              />
            ) : (
              <>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="font-display text-[18px] font-semibold text-fg">
                    {selectedNode.meaning || (
                      <em className="text-fg-muted opacity-50">No meaning defined</em>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex shrink-0 gap-1.5">
                      <Button variant="secondary" small onClick={() => setEditing(true)}>
                        Edit
                      </Button>
                      <Button variant="danger" small onClick={deleteSelected}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                {selectedNode.notes && (
                  <p className="mb-3 whitespace-pre-wrap font-body text-[14px] leading-relaxed text-fg-body">
                    {selectedNode.notes}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {breadcrumb.map((n, i) => (
                    <span
                      key={n.id}
                      className="font-display text-[13px] font-semibold text-fg-muted"
                    >
                      {i > 0 && <span className="mx-1 text-fg-subtle">›</span>}
                      {n.bids.join('/')}
                    </span>
                  ))}
                </div>
                {!readOnly && addChain && (
                  <div className="mt-3">
                    {addingTo === selected ? (
                      <BidForm
                        mode="add"
                        chain={addChain}
                        onSubmit={submitAdd(selected!)}
                        onCancel={() => setAddingTo(null)}
                        paramStrains={paramStrains}
                      />
                    ) : (
                      <Button variant="secondary" small onClick={() => setAddingTo(selected!)}>
                        + Add continuation
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ── SuitPicker ────────────────────────────────────────────────────────────────

const SUITS = [
  { symbol: '♣', value: '♣', color: 'var(--suit-black)' },
  { symbol: '♦', value: '♦', color: 'var(--suit-red)' },
  { symbol: '♥', value: '♥', color: 'var(--suit-red)' },
  { symbol: '♠', value: '♠', color: 'var(--suit-black)' },
] as const;

function SuitPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {SUITS.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(value === s.value ? '' : s.value)}
          className={clsx(
            'flex h-7 w-7 items-center justify-center rounded border text-[16px] transition-colors',
            value === s.value
              ? 'border-accent bg-accent-soft'
              : 'border-border bg-surface hover:bg-surface-2',
          )}
          style={{ color: s.color }}
          title={s.symbol}
        >
          {s.symbol}
        </button>
      ))}
    </div>
  );
}
