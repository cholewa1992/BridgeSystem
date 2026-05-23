import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BidNode, SystemDetail } from '../types';
import { deleteSystem, getSystem, updateSystem } from '../api/systems';
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
import {
  buttonDanger,
  buttonGhost,
  buttonSecondary,
  inputStyle,
  labelStyle,
} from '../styles';
import { BidTree } from './BidTree';
import { BidDetailPanel } from './BidDetailPanel';
import { BidForm, type BidFormData } from './BidForm';
import { ShareDialog } from './ShareDialog';

export function SystemEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<SystemDetail | null>(null);
  const [root, setRoot] = useState<BidNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'dirty' | 'saved'>('idle');

  const [selected, setSelected] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [systemName, setSystemName] = useState('');
  const [showShare, setShowShare] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getSystem(id)
      .then((d) => {
        setDetail(d);
        setSystemName(d.name);
        setRoot(rootFromTree(d.tree ?? { children: [] }));
      })
      .catch((e) => setError((e as Error).message));
  }, [id]);

  const readOnly = !detail || (detail.permission !== 'OWNER' && detail.permission !== 'WRITE');

  // ── Persistence ───────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!detail || !root || readOnly) return;
    setSaveState('saving');
    try {
      const updated = await updateSystem(detail.id, {
        name: systemName,
        description: detail.description ?? '',
        tree: treeFromRoot(root),
      });
      setDetail(updated);
      setSaveState('saved');
      window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
    } catch (e) {
      setError((e as Error).message);
      setSaveState('dirty');
    }
  }, [detail, root, systemName, readOnly]);

  useEffect(() => {
    if (saveState !== 'dirty') return;
    const t = window.setTimeout(save, 800);
    return () => window.clearTimeout(t);
  }, [saveState, save]);

  const markDirty = () => setSaveState('dirty');

  // ── Derived ───────────────────────────────────────────────────────────
  const selectedNode = useMemo(() => {
    if (!root || !selected) return null;
    return findNode(root, selected);
  }, [root, selected]);

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
  const openingChain = useMemo(
    () => (root ? addChainContext(root, ROOT_ID) : null),
    [root],
  );

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
      })),
    );
    setEditing(false);
    markDirty();
  };

  const handleMove = useCallback((newParentId: string) => {
    if (!root || !draggingId) return;
    setRoot(moveNode(root, draggingId, newParentId));
    setDraggingId(null);
    markDirty();
  }, [root, draggingId]);

  const canDropHere = useCallback((targetParentId: string): boolean => {
    if (!root || !draggingId) return false;
    return canDropNode(root, draggingId, targetParentId);
  }, [root, draggingId]);

  const deleteSelected = () => {
    if (!root || !selected) return;
    if (!confirm('Delete this bid and its continuations?')) return;
    setRoot(treeDelete(root, selected));
    setSelected(null);
    setEditing(false);
    markDirty();
  };

  const onRename = () => {
    setEditingName(false);
    markDirty();
  };

  const onDeleteSystem = async () => {
    if (!detail) return;
    if (!confirm(`Delete "${detail.name}"? This cannot be undone.`)) return;
    try {
      await deleteSystem(detail.id);
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // Reset transient form state when selection changes
  const select = (nodeId: string) => {
    setSelected(nodeId);
    setEditing(false);
    setAddingTo(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (error && !detail) {
    return (
      <div style={{ padding: 60, color: 'var(--danger)', fontFamily: 'var(--font-ui)' }}>
        <p style={{ marginTop: 0 }}>{error}</p>
        <button onClick={() => navigate('/')} style={buttonSecondary}>
          Back to list
        </button>
      </div>
    );
  }
  if (!detail || !root) {
    return <div style={{ padding: 60, color: 'var(--fg-muted)' }}>Loading…</div>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <button onClick={() => navigate('/')} style={buttonGhost}>
          ← Back
        </button>
        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
        <div style={{ display: 'flex', gap: 3, fontSize: 14, opacity: 0.7 }}>
          <span style={{ color: 'var(--suit-black)' }}>♠</span>
          <span style={{ color: 'var(--suit-red)' }}>♥</span>
          <span style={{ color: 'var(--suit-red)' }}>♦</span>
          <span style={{ color: 'var(--suit-black)' }}>♣</span>
        </div>
        {editingName && !readOnly ? (
          <input
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => e.key === 'Enter' && onRename()}
            autoFocus
            style={{
              ...inputStyle,
              fontSize: 18,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              flex: 1,
            }}
          />
        ) : (
          <h1
            onClick={() => !readOnly && setEditingName(true)}
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--fg)',
              cursor: readOnly ? 'default' : 'pointer',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.005em',
            }}
            title={readOnly ? '' : 'Click to rename'}
          >
            {systemName}
          </h1>
        )}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <SaveIndicator state={saveState} permission={detail.permission} />
          {detail.permission === 'OWNER' && (
            <>
              <button onClick={() => setShowShare(true)} style={buttonSecondary}>
                Share
              </button>
              <button onClick={onDeleteSystem} style={buttonDanger}>
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Tree pane */}
        <aside
          style={{
            width: 460,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            padding: '20px 18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <span style={labelStyle}>Bidding sequences</span>
            {!readOnly && addingTo !== ROOT_ID && (
              <button onClick={() => setAddingTo(ROOT_ID)} style={buttonSecondary}>
                + Opening bid
              </button>
            )}
          </div>

          {!readOnly && draggingId && canDropHere(ROOT_ID) && (
            <div
              onDragOver={(e) => { e.preventDefault(); setRootDragOver(true); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setRootDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setRootDragOver(false);
                handleMove(ROOT_ID);
              }}
              style={{
                marginBottom: 8,
                padding: '6px 10px',
                border: `1px dashed ${rootDragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
                borderRadius: 'var(--radius-sm)',
                background: rootDragOver ? 'var(--accent-soft)' : 'transparent',
                color: 'var(--fg-muted)',
                fontSize: 12,
                textAlign: 'center',
                cursor: 'copy',
              }}
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
            onDragStart={setDraggingId}
            onDragEnd={() => setDraggingId(null)}
            onDrop={handleMove}
            canDrop={canDropHere}
          />

          {addingTo === ROOT_ID && openingChain && (
            <div style={{ marginTop: 12 }}>
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
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          <div style={{ maxWidth: 760 }}>
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
  state: 'idle' | 'saving' | 'dirty' | 'saved';
  permission: SystemDetail['permission'];
}) {
  let text: string;
  let tone: 'muted' | 'accent' | 'success' = 'muted';

  if (state === 'saving') {
    text = 'Saving…';
    tone = 'accent';
  } else if (state === 'saved') {
    text = 'Saved';
    tone = 'success';
  } else if (state === 'dirty') {
    text = 'Unsaved changes';
    tone = 'accent';
  } else {
    text = permission === 'OWNER' ? 'Owner' : permission;
  }

  const color =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'accent'
      ? 'var(--accent)'
      : 'var(--fg-muted)';

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color,
        fontFamily: 'var(--font-ui)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: color,
          opacity: state === 'saving' ? 1 : 0.7,
        }}
      />
      {text}
    </span>
  );
}
