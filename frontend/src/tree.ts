import type { BidNode, BidTreeRoot } from './types';

// ── Tree manipulation ─────────────────────────────────────────────────────

export const newId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `node-${crypto.randomUUID()}`;
  }
  return `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export function findNode(tree: BidNode, id: string): BidNode | null {
  if (tree.id === id) return tree;
  for (const c of tree.children ?? []) {
    const r = findNode(c, id);
    if (r) return r;
  }
  return null;
}

export function updateNode(
  tree: BidNode,
  id: string,
  updater: (n: BidNode) => BidNode,
): BidNode {
  if (tree.id === id) return updater(tree);
  return {
    ...tree,
    children: (tree.children ?? []).map((c) => updateNode(c, id, updater)),
  };
}

export function deleteNode(tree: BidNode, id: string): BidNode {
  return {
    ...tree,
    children: (tree.children ?? [])
      .filter((c) => c.id !== id)
      .map((c) => deleteNode(c, id)),
  };
}

export function pathTo(tree: BidNode, id: string, path: BidNode[] = []): BidNode[] | null {
  if (tree.id === id) return [...path, tree];
  for (const c of tree.children ?? []) {
    const r = pathTo(c, id, [...path, tree]);
    if (r) return r;
  }
  return null;
}

export const ROOT_ID = 'root';

/**
 * Migrate a raw node from the backend into the current shape, handling
 * both old single-bid (`bid: string`) and new group (`bids: string[]`)
 * formats.
 */
function migrateNode(n: unknown): BidNode {
  const raw = (n ?? {}) as Record<string, unknown>;
  const bids: string[] = Array.isArray(raw.bids) && raw.bids.length > 0
    ? (raw.bids as unknown[]).filter((b): b is string => typeof b === 'string')
    : typeof raw.bid === 'string' && raw.bid
      ? [raw.bid as string]
      : [];
  return {
    id: typeof raw.id === 'string' ? raw.id : newId(),
    bids,
    meaning: typeof raw.meaning === 'string' ? raw.meaning : '',
    notes: typeof raw.notes === 'string' && raw.notes ? raw.notes : undefined,
    byOpponent: raw.byOpponent === true ? true : undefined,
    children: Array.isArray(raw.children) ? raw.children.map(migrateNode) : [],
  };
}

export function rootFromTree(root: BidTreeRoot): BidNode {
  const children = Array.isArray(root?.children) ? root.children.map(migrateNode) : [];
  return { id: ROOT_ID, bids: [], meaning: '', children };
}

export function treeFromRoot(root: BidNode): BidTreeRoot {
  return { children: root.children };
}

function isBidValidInContext(bid: string, ctx: ChainContext): boolean {
  if (bid === 'X') return ctx.lastContractBid !== null && !ctx.hasActiveDouble && !ctx.hasActiveRedouble;
  if (bid === 'XX') return ctx.hasActiveDouble && !ctx.hasActiveRedouble;
  const p = parseBid(bid);
  if (!p) return false;
  return isValidContinuation(p, ctx.lastContractBid ? parseBid(ctx.lastContractBid) : null);
}

export function canDropNode(root: BidNode, nodeId: string, targetParentId: string): boolean {
  const node = findNode(root, nodeId);
  if (!node) return false;
  if (findNode(node, targetParentId) !== null) return false;
  const path = pathTo(root, nodeId);
  if (path && path.length >= 2 && path[path.length - 2].id === targetParentId) return false;
  const ctx = addChainContext(root, targetParentId);
  return node.bids.every((bid) => isBidValidInContext(bid, ctx));
}

export function moveNode(root: BidNode, nodeId: string, newParentId: string): BidNode {
  const node = findNode(root, nodeId);
  if (!node) return root;
  return updateNode(deleteNode(root, nodeId), newParentId, (n) => ({
    ...n,
    children: [...n.children, node],
  }));
}

// ── Bid parsing / ordering ────────────────────────────────────────────────

/**
 * Strains in display order. `ma` ("same major") and `om` ("other major")
 * are symbolic placeholders — useful in continuations under major-suit
 * openings, where the actual suit depends on what was opened. For example,
 * after a grouped `1♥/1♠` opening, `2ma` means "raise to 2 of opener's
 * major" and `2om` means "bid the other major at 2".
 */
export const STRAINS = ['♣', '♦', '♥', '♠', 'NT', 'ma', 'om'] as const;
export type Strain = (typeof STRAINS)[number];
export const LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Level = (typeof LEVELS)[number];

/** Display order — used to lay out the strain picker. */
export const STRAIN_RANK: Record<Strain, number> = {
  '♣': 0,
  '♦': 1,
  '♥': 2,
  '♠': 3,
  NT: 4,
  ma: 5,
  om: 6,
};

/**
 * Rank used for "is this bid higher than that bid" comparisons. Both `ma`
 * and `om` are treated as `♠` (the higher major) — the most permissive
 * interpretation. The user is responsible for using them in semantically
 * sensible contexts; this rule keeps the ordering arithmetic consistent.
 */
function strainComparisonRank(s: Strain): number {
  if (s === 'ma' || s === 'om') return STRAIN_RANK['♠'];
  return STRAIN_RANK[s];
}

export interface ParsedBid {
  level: Level;
  strain: Strain;
}

export function parseBid(s: string | null | undefined): ParsedBid | null {
  if (!s) return null;
  const m = s.match(/^([1-7])(NT|ma|om|[♣♦♥♠])$/);
  if (!m) return null;
  return { level: Number(m[1]) as Level, strain: m[2] as Strain };
}

export function formatBid(p: ParsedBid): string {
  return `${p.level}${p.strain}`;
}

export function bidRank(b: ParsedBid): number {
  return (b.level - 1) * 5 + strainComparisonRank(b.strain);
}

export function compareBids(a: ParsedBid, b: ParsedBid): number {
  return bidRank(a) - bidRank(b);
}

/** True at the same level if S outranks the parent's strain. Drives the strain picker. */
export function strainOutranks(s: Strain, parent: Strain): boolean {
  return strainComparisonRank(s) > strainComparisonRank(parent);
}

/**
 * The smallest strictly-higher bid than `after`. Returns `{1, ♣}` when
 * `after` is null (opening). Returns null when `after` is 7NT.
 */
export function minValidBidAfter(after: ParsedBid | null): ParsedBid | null {
  if (!after) return { level: 1, strain: '♣' };
  const afterRank = strainComparisonRank(after.strain);
  // First strain at the same level whose comparison rank exceeds `after`'s.
  for (const s of STRAINS) {
    if (s === 'ma' || s === 'om') continue; // never auto-pick symbolic strains
    if (strainComparisonRank(s) > afterRank) {
      return { level: after.level, strain: s };
    }
  }
  if (after.level < 7) {
    return { level: (after.level + 1) as Level, strain: '♣' };
  }
  return null;
}

export function isValidContinuation(child: ParsedBid, parent: ParsedBid | null): boolean {
  if (!parent) return true;
  return compareBids(child, parent) > 0;
}

/** True if the call string is a contract bid (incl. the symbolic `Xma`) and not X/XX. */
export function isContractBid(call: string | null | undefined): boolean {
  if (!call) return false;
  return /^[1-7](NT|ma|om|[♣♦♥♠])$/.test(call);
}

/**
 * The highest contract bid in a group. Used to compute the "bar" for the
 * next contract bid in a chain. Returns null if no bid in the group is a
 * contract bid (e.g. an X/XX node).
 */
export function highestContractBidIn(bids: string[]): string | null {
  let best: ParsedBid | null = null;
  let bestStr: string | null = null;
  for (const b of bids) {
    const p = parseBid(b);
    if (!p) continue;
    if (!best || compareBids(p, best) > 0) {
      best = p;
      bestStr = b;
    }
  }
  return bestStr;
}

// ── Chain context ─────────────────────────────────────────────────────────

export interface ChainContext {
  /** Most recent contract bid in the chain (the "bar" for subsequent contracts). */
  lastContractBid: string | null;
  /** True when the last contract bid is doubled and not yet redoubled. */
  hasActiveDouble: boolean;
  /** True when the last contract bid is doubled AND redoubled. */
  hasActiveRedouble: boolean;
}

/**
 * Walk a chain of nodes (root → leaf) and compute the resulting state.
 * Doubles reset on every new contract bid. For a group of contract bids,
 * the highest bid in the group sets the new bar.
 */
export function chainContextFromNodes(nodes: BidNode[]): ChainContext {
  let lastContractBid: string | null = null;
  let hasActiveDouble = false;
  let hasActiveRedouble = false;
  for (const n of nodes) {
    if (n.bids.length === 0) continue;
    const first = n.bids[0];
    if (first === 'X') {
      if (lastContractBid && !hasActiveDouble) hasActiveDouble = true;
    } else if (first === 'XX') {
      if (hasActiveDouble && !hasActiveRedouble) hasActiveRedouble = true;
    } else {
      const highest = highestContractBidIn(n.bids);
      if (highest) {
        lastContractBid = highest;
        hasActiveDouble = false;
        hasActiveRedouble = false;
      }
    }
  }
  return { lastContractBid, hasActiveDouble, hasActiveRedouble };
}

/**
 * Chain context for adding a child under `parentId` — includes the parent
 * node itself in the walk.
 */
export function addChainContext(root: BidNode, parentId: string): ChainContext {
  if (parentId === ROOT_ID) {
    return { lastContractBid: null, hasActiveDouble: false, hasActiveRedouble: false };
  }
  const path = pathTo(root, parentId);
  if (!path) {
    return { lastContractBid: null, hasActiveDouble: false, hasActiveRedouble: false };
  }
  return chainContextFromNodes(path.filter((n) => n.bids.length > 0));
}

/**
 * Chain context for editing `nodeId` — walks ancestors up to (but excluding)
 * the node itself, since the node's own call is what's being changed.
 */
export function editChainContext(root: BidNode, nodeId: string): ChainContext {
  const path = pathTo(root, nodeId);
  if (!path || path.length < 2) {
    return { lastContractBid: null, hasActiveDouble: false, hasActiveRedouble: false };
  }
  return chainContextFromNodes(path.slice(0, -1).filter((n) => n.bids.length > 0));
}
