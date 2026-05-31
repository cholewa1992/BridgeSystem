import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { BidNode, ConventionDetail, ConventionParam, ConventionSummary } from '../types';
import {
  useMyConventions,
  useCreateConvention,
  useUpdateConvention,
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
  const navigate = useNavigate();
  const { t } = useTranslation(['editor', 'common']);
  const [sort, setSort] = useState<'newest' | 'most_liked'>('newest');

  const { data: myConventions, error: loadError } = useMyConventions();
  const { data: publicConventions } = usePublicConventions(sort);
  const createMut = useCreateConvention();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const error = (loadError ?? createMut.error) as Error | null;

  const onCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createMut.mutateAsync({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      navigate(`/conventions/${created.id}`);
    } catch {
      // surfaced via createMut.error
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-6 py-3">
        <h1 className="m-0 font-display text-lg font-semibold tracking-[-0.005em] text-fg">
          {t('conventionList.heading')}
        </h1>
        {!creating && (
          <Button variant="primary" className="ml-auto" onClick={() => setCreating(true)}>
            {t('conventionList.newConvention')}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[880px] px-4 pb-[80px] pt-6 md:px-[32px] md:pt-[32px]">
          {error && (
            <div className="mb-5 rounded-sm border border-[#e6c8c4] bg-danger-soft px-[12px] py-[10px] font-ui text-[13px] text-danger">
              {error.message}
            </div>
          )}

          {creating && (
            <div className="mb-6 rounded-md border border-border bg-surface p-5 shadow-sm">
              <Label className="mb-3 block">{t('conventionList.newConventionLabel')}</Label>
              <div className="flex flex-col gap-2.5">
                <Input
                  placeholder={t('conventionList.namePlaceholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                  autoFocus
                />
                <Input
                  placeholder={t('conventionList.descriptionPlaceholder')}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <div className="mt-1 flex gap-2">
                  <Button variant="primary" onClick={onCreate} disabled={createMut.isPending}>
                    {createMut.isPending
                      ? t('conventionList.creating')
                      : t('conventionList.create')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCreating(false);
                      setNewName('');
                      setNewDesc('');
                    }}
                  >
                    {t('common:action.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* My conventions */}
          <ConvSectionHeading>{t('conventionList.myConventions')}</ConvSectionHeading>
          {myConventions === undefined ? (
            <div className="text-[14px] text-fg-muted">{t('common:status.loading')}</div>
          ) : myConventions.length === 0 ? (
            <div className="rounded-md border border-border bg-surface px-6 py-10 text-center text-fg-muted">
              <div className="mb-2.5 text-[32px] opacity-60">♣</div>
              <p className="m-0 font-ui text-[15px]">{t('conventionList.noConventionsYet')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {myConventions.map((c) => (
                <MyConventionCard
                  key={c.id}
                  convention={c}
                  onClick={() => navigate(`/conventions/${c.id}`)}
                />
              ))}
            </div>
          )}

          {/* Public conventions */}
          <div className="mb-4 mt-10 flex items-center justify-between">
            <ConvSectionHeading>{t('conventionList.publicConventions')}</ConvSectionHeading>
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1">
              <ConvSortButton active={sort === 'newest'} onClick={() => setSort('newest')}>
                {t('common:sort.newest')}
              </ConvSortButton>
              <ConvSortButton active={sort === 'most_liked'} onClick={() => setSort('most_liked')}>
                {t('common:sort.mostLiked')}
              </ConvSortButton>
            </div>
          </div>
          {publicConventions === undefined ? (
            <div className="text-[14px] text-fg-muted">{t('common:status.loading')}</div>
          ) : publicConventions.length === 0 ? (
            <div className="rounded-md border border-border bg-surface px-6 py-10 text-center text-fg-muted">
              <div className="mb-2.5 text-[32px] opacity-60">♣</div>
              <p className="m-0 font-ui text-[15px]">{t('conventionList.noPublicConventions')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {publicConventions.map((c) => (
                <PublicConventionCard key={c.id} convention={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MyConventionCard ───────────────────────────────────────────────────────

function MyConventionCard({
  convention,
  onClick,
}: {
  convention: ConventionDetail;
  onClick: () => void;
}) {
  const { t } = useTranslation(['editor', 'common']);
  return (
    <button
      onClick={onClick}
      className="block w-full cursor-pointer rounded-md border border-border bg-surface px-[22px] py-[18px] text-left font-ui shadow-sm transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
          {convention.name}
        </h3>
        <ConvTag tone={convention.ownedByMe ? 'accent' : 'neutral'}>
          {convention.ownedByMe
            ? t('common:tag.owner')
            : t('common:tag.sharedBy', {
                username: convention.ownerUsername,
                permission: convention.permission,
              })}
        </ConvTag>
        {convention.isPublic && <ConvTag tone="accent">{t('common:tag.public')}</ConvTag>}
      </div>
      {convention.description && (
        <p className="mb-0 mt-2 font-ui text-[14px] text-fg-body">{convention.description}</p>
      )}
      <div className="mt-2 flex items-center gap-4 font-ui text-[13px] text-fg-muted">
        <span>♥ {convention.likeCount}</span>
        <span>⑂ {convention.forkCount}</span>
        {convention.parameters.length > 0 && (
          <span>{t('conventionList.paramCount', { count: convention.parameters.length })}</span>
        )}
      </div>
    </button>
  );
}

// ── PublicConventionCard ───────────────────────────────────────────────────

function PublicConventionCard({ convention }: { convention: ConventionSummary }) {
  const { t } = useTranslation(['editor', 'common']);
  const forkMut = useForkConvention();
  const likeMut = useToggleConventionLike(convention.id);
  const heartFilled = convention.likedByMe === true;

  return (
    <div className="rounded-md border border-border bg-surface px-[22px] py-[18px] font-ui shadow-sm transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-md">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="m-0 font-display text-[19px] font-semibold tracking-[-0.005em] text-fg">
          {convention.name}
        </h3>
      </div>
      <p className="mb-0 mt-1 font-ui text-[13px] text-fg-muted">
        by <span className="font-medium">@{convention.ownerUsername}</span>
        {convention.paramCount > 0 && (
          <span className="ml-2 text-fg-subtle">
            · {t('conventionList.paramCount', { count: convention.paramCount })}
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
          onClick={() => likeMut.mutate({ liked: heartFilled })}
          disabled={likeMut.isPending}
          className={
            'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-ui text-[13px] transition-colors ' +
            (heartFilled ? 'text-suit-red' : 'text-fg-muted hover:text-suit-red')
          }
        >
          <span>{heartFilled ? '♥' : '♡'}</span>
          <span>{convention.likeCount}</span>
        </button>
        {!convention.ownedByMe && (
          <button
            onClick={() => forkMut.mutate(convention.id)}
            disabled={forkMut.isPending}
            className="ml-auto rounded-sm border border-border px-2.5 py-1 font-ui text-[12px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {forkMut.isPending ? t('common:action.forking') : t('common:action.fork')}
          </button>
        )}
      </div>
    </div>
  );
}

function ConvSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
      {children}
    </h2>
  );
}

function ConvSortButton({
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

function ConvTag({ tone, children }: { tone: 'accent' | 'neutral'; children: React.ReactNode }) {
  return (
    <span
      className={
        'rounded-full px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.05em] ' +
        (tone === 'accent' ? 'bg-accent-soft text-accent-ink' : 'bg-surface-sunken text-fg-muted')
      }
    >
      {children}
    </span>
  );
}

// ── ConventionEditor ───────────────────────────────────────────────────────

export function ConventionEditor({ convention }: { convention: ConventionDetail }) {
  const { t } = useTranslation(['editor', 'common']);
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
  const [mobilePane, setMobilePane] = useState<'tree' | 'detail'>('tree');

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
    const timer = window.setTimeout(() => persist(), 800);
    return () => window.clearTimeout(timer);
  }, [dirty, persist]);

  // Flash "Saved"
  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 1500);
    return () => window.clearTimeout(timer);
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
    if (!confirm(t('conventionEditor.deleteBidConfirm'))) return;
    setRoot(treeDelete(root, selected));
    setSelected(null);
    setEditing(false);
    markDirty();
  };

  const select = (nodeId: string) => {
    setSelected(nodeId);
    setEditing(false);
    setAddingTo(null);
    setMobilePane('detail');
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
        <button
          onClick={() => navigate('/conventions')}
          className="shrink-0 font-ui text-[13px] text-fg-muted hover:text-fg"
        >
          {t('conventionEditor.backToConventions')}
        </button>
        <span className="text-border">|</span>
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
            title={readOnly ? '' : t('conventionEditor.clickToRename')}
          >
            {convName}
          </h2>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden md:inline-flex">
            <ConventionSaveIndicator state={saveState} permission={convention.permission} />
          </span>
          {convention.permission === 'OWNER' && (
            <Button
              variant="secondary"
              small
              onClick={onToggleVisibility}
              loading={visibilityMut.isPending}
              className="hidden md:inline-flex"
            >
              {convention.isPublic
                ? t('conventionEditor.unpublish')
                : t('conventionEditor.publish')}
            </Button>
          )}
          {convention.permission !== 'OWNER' && (
            <Button variant="secondary" small onClick={onFork} loading={forkMut.isPending}>
              {forkMut.isPending ? t('common:action.forking') : t('common:action.fork')}
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Bid tree pane */}
        <div
          className={clsx(
            'overflow-y-auto border-r border-border bg-surface px-[18px] py-5',
            'w-full md:w-[420px] md:shrink-0',
            mobilePane === 'detail' ? 'hidden md:block' : 'block',
          )}
        >
          <div className="mb-3">
            <Label>{t('parameterEditor.description')}</Label>
            {readOnly ? (
              <p className="mt-1 font-ui text-[13px] text-fg-muted">
                {convDesc || <em>{t('parameterEditor.noDescription')}</em>}
              </p>
            ) : (
              <Textarea
                value={convDesc}
                onChange={(e) => {
                  setConvDesc(e.target.value);
                  markDirty();
                }}
                placeholder={t('parameterEditor.descriptionPlaceholder')}
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
            <Label>{t('conventionEditor.biddingSequences')}</Label>
            {!readOnly && addingTo !== ROOT_ID && (
              <Button variant="secondary" small onClick={() => setAddingTo(ROOT_ID)}>
                {t('conventionEditor.openingBid')}
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
              {t('conventionEditor.moveHereAsOpeningBid')}
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
        <div
          className={clsx(
            'flex-1 overflow-y-auto px-4 py-4 md:px-10 md:py-8',
            mobilePane === 'tree' ? 'hidden md:block' : 'block',
          )}
        >
          <div className="max-w-[760px]">
            {convention.forkedFrom && (
              <div className="mb-4 rounded-sm border border-border bg-surface-sunken px-3 py-2 font-ui text-[13px] text-fg-muted">
                {t('conventionEditor.forkedFrom', { name: convention.forkedFrom.name })}
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
              onMobileBack={() => setMobilePane('tree')}
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
  const { t } = useTranslation('editor');

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
        <Label>{t('parameterEditor.parameters')}</Label>
        {!readOnly && (
          <Button variant="secondary" small onClick={addParam}>
            {t('parameterEditor.addParam')}
          </Button>
        )}
      </div>
      {parameters.length === 0 ? (
        <p className="font-ui text-[12px] text-fg-muted">{t('parameterEditor.noParameters')}</p>
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
                      {t('parameterEditor.paramDefault', { value: param.defaultValue })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t('parameterEditor.paramNamePlaceholder')}
                      value={param.name}
                      onChange={(e) => updateParam(i, { name: e.target.value })}
                      className="flex-1 text-[12px]"
                    />
                    <button
                      onClick={() => removeParam(i)}
                      className="shrink-0 rounded-sm p-0.5 text-[12px] text-fg-muted hover:text-danger"
                      title={t('parameterEditor.removeParameter')}
                    >
                      ✕
                    </button>
                  </div>
                  <Input
                    placeholder={t('parameterEditor.paramDescPlaceholder')}
                    value={param.description ?? ''}
                    onChange={(e) => updateParam(i, { description: e.target.value })}
                    className="text-[12px]"
                  />
                  <Input
                    placeholder={t('parameterEditor.paramDefaultPlaceholder')}
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
  const { t } = useTranslation('editor');
  let text: string;
  let colorClass: string;

  if (state === 'saving') {
    text = t('saveIndicator.saving');
    colorClass = 'text-accent';
  } else if (state === 'saved') {
    text = t('saveIndicator.saved');
    colorClass = 'text-success';
  } else if (state === 'dirty') {
    text = t('saveIndicator.unsavedChanges');
    colorClass = 'text-accent';
  } else {
    text = permission === 'OWNER' ? t('saveIndicator.owner') : permission;
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
