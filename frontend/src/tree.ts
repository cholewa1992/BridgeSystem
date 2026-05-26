import type { BidNode, BidSection, BidTreeRoot, ConventionDef, ConventionParam } from './types';

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

export function updateNode(tree: BidNode, id: string, updater: (n: BidNode) => BidNode): BidNode {
  if (tree.id === id) return updater(tree);
  return {
    ...tree,
    children: (tree.children ?? []).map((c) => updateNode(c, id, updater)),
  };
}

export function deleteNode(tree: BidNode, id: string): BidNode {
  return {
    ...tree,
    children: (tree.children ?? []).filter((c) => c.id !== id).map((c) => deleteNode(c, id)),
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
 * formats. Also preserves optional fields: alerted, conventionRef, conventionArgs.
 */
function migrateNode(n: unknown): BidNode {
  const raw = (n ?? {}) as Record<string, unknown>;
  const bids: string[] =
    Array.isArray(raw.bids) && raw.bids.length > 0
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
    alerted: raw.alerted === true ? true : undefined,
    conventionRef: typeof raw.conventionRef === 'string' ? raw.conventionRef : undefined,
    conventionArgs:
      raw.conventionArgs !== null &&
      typeof raw.conventionArgs === 'object' &&
      !Array.isArray(raw.conventionArgs)
        ? (raw.conventionArgs as Record<string, string>)
        : undefined,
    children: Array.isArray(raw.children) ? raw.children.map(migrateNode) : [],
  };
}

function migrateParam(p: unknown): ConventionParam {
  const raw = (p ?? {}) as Record<string, unknown>;
  return {
    name: typeof raw.name === 'string' ? raw.name : '',
    label: typeof raw.label === 'string' ? raw.label : '',
    defaultValue:
      typeof raw.defaultValue === 'string' && raw.defaultValue ? raw.defaultValue : undefined,
    type: raw.type === 'suit' ? 'suit' : raw.type === 'text' ? 'text' : undefined,
  };
}

function migrateConvention(c: unknown): ConventionDef {
  const raw = (c ?? {}) as Record<string, unknown>;
  const migratedRoot: BidNode =
    raw.root !== null && typeof raw.root === 'object'
      ? migrateNode(raw.root)
      : { id: ROOT_ID, bids: [], meaning: '', children: [] };
  // Convention roots must carry ROOT_ID so ConventionEditor's updateNode calls work.
  const rootNode: BidNode =
    migratedRoot.id === ROOT_ID ? migratedRoot : { ...migratedRoot, id: ROOT_ID };
  return {
    id: typeof raw.id === 'string' ? raw.id : newId(),
    name: typeof raw.name === 'string' && raw.name ? raw.name : 'Untitled convention',
    description:
      typeof raw.description === 'string' && raw.description ? raw.description : undefined,
    parameters: Array.isArray(raw.parameters)
      ? (raw.parameters as unknown[]).map(migrateParam)
      : undefined,
    root: rootNode,
  };
}

export function rootFromTree(root: BidTreeRoot): BidNode {
  const children = Array.isArray(root?.children) ? root.children.map(migrateNode) : [];
  return { id: ROOT_ID, bids: [], meaning: '', children };
}

/**
 * Migrate the `conventions` array from the raw tree blob. Returns an empty
 * array if none are present (backwards-compatible with old system blobs).
 */
export function conventionsFromTree(root: BidTreeRoot): ConventionDef[] {
  const raw = root as unknown as Record<string, unknown>;
  if (!Array.isArray(raw.conventions)) return [];
  return (raw.conventions as unknown[]).map(migrateConvention);
}

export function treeFromRoot(root: BidNode): BidTreeRoot {
  return { children: root.children };
}

// ── Convention resolution ─────────────────────────────────────────────────

export function findConvention(
  conventions: ConventionDef[],
  id: string,
): ConventionDef | undefined {
  return conventions.find((c) => c.id === id);
}

/**
 * Replace `{{paramName}}` placeholders in `text` with values from `args`.
 * Unrecognised placeholders are left as-is.
 */
function applyParams(text: string, args: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => args[key] ?? `{{${key}}}`);
}

/**
 * Recursively substitute param placeholders throughout a node subtree.
 * Returns a new tree; the original is not mutated.
 */
export function expandConventionParams(node: BidNode, args: Record<string, string>): BidNode {
  return {
    ...node,
    bids: node.bids.map((b) => applyParams(b, args)),
    meaning: applyParams(node.meaning, args),
    notes: node.notes ? applyParams(node.notes, args) : undefined,
    children: node.children.map((c) => expandConventionParams(c, args)),
  };
}

/**
 * Returns the effective children for `node`. When the node has a
 * `conventionRef`, resolves and param-expands the convention's children;
 * falls back to the node's own stored children if the ref is missing or
 * the convention is not found.
 */
export function resolveConventionChildren(node: BidNode, conventions: ConventionDef[]): BidNode[] {
  if (!node.conventionRef) return node.children;
  const conv = findConvention(conventions, node.conventionRef);
  if (!conv) return node.children; // graceful fallback for dangling refs
  const args = node.conventionArgs ?? {};
  return conv.root.children.map((c) => expandConventionParams(c, args));
}

/**
 * Count how many nodes in `tree` reference `conventionId` directly.
 * Used to warn before deleting a convention that is still in use.
 */
export function countConventionUsage(tree: BidNode, conventionId: string): number {
  let n = tree.conventionRef === conventionId ? 1 : 0;
  for (const c of tree.children) n += countConventionUsage(c, conventionId);
  return n;
}

export function canDropNode(root: BidNode, nodeId: string, targetParentId: string): boolean {
  const node = findNode(root, nodeId);
  if (!node) return false;
  // Can't drop into own subtree (includes self)
  if (findNode(node, targetParentId) !== null) return false;
  // Prevent no-op drop onto current parent
  const path = pathTo(root, nodeId);
  if (path && path.length >= 2 && path[path.length - 2].id === targetParentId) return false;
  // Can't drop into a convention-ref node — its children are owned by the convention
  const targetNode = findNode(root, targetParentId);
  if (targetNode?.conventionRef) return false;
  const ctx = addChainContext(root, targetParentId);
  return node.bids.every((bid) => isBidValidInContext(bid, ctx));
}

function nodeSortKey(node: BidNode): number {
  if (node.bids.length === 0) return Infinity;
  const first = node.bids[0];
  if (first === 'P') return -3;
  if (first === 'XX') return -2;
  if (first === 'X') return -1;
  // For grouped nodes use the lowest bid in the group.
  let best: ParsedBid | null = null;
  for (const b of node.bids) {
    const p = parseBid(b);
    if (p && (!best || compareBids(p, best) < 0)) best = p;
  }
  return best ? bidRank(best) : Infinity;
}

export function moveNode(root: BidNode, nodeId: string, newParentId: string): BidNode {
  const node = findNode(root, nodeId);
  if (!node) return root;
  return updateNode(deleteNode(root, nodeId), newParentId, (n) => ({
    ...n,
    children: [...n.children, node].sort((a, b) => nodeSortKey(a) - nodeSortKey(b)),
  }));
}

// ── Bid parsing / ordering ────────────────────────────────────────────────

/** Strains in display order. */
export const STRAINS = ['♣', '♦', '♥', '♠', 'NT'] as const;
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
};

function strainComparisonRank(s: Strain): number {
  return STRAIN_RANK[s];
}

export interface ParsedBid {
  level: Level;
  strain: Strain;
}

export function parseBid(s: string | null | undefined): ParsedBid | null {
  if (!s) return null;
  const m = s.match(/^([1-7])(NT|[♣♦♥♠])$/);
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
  return /^[1-7](NT|[♣♦♥♠])$/.test(call);
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
    if (first === 'P') {
      // pass — chain state unchanged
    } else if (first === 'X') {
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

function isBidValidInContext(bid: string, ctx: ChainContext): boolean {
  if (bid === 'P') return true;
  if (bid === 'X')
    return ctx.lastContractBid !== null && !ctx.hasActiveDouble && !ctx.hasActiveRedouble;
  if (bid === 'XX') return ctx.hasActiveDouble && !ctx.hasActiveRedouble;
  const p = parseBid(bid);
  if (!p) return false;
  return isValidContinuation(p, ctx.lastContractBid ? parseBid(ctx.lastContractBid) : null);
}

// ── Section grouping ──────────────────────────────────────────────────────

const SECTION_ORDER = [
  '1-Level Suits',
  '1NT System',
  '2-Level Bids',
  'Pre-empts',
  'High-Level',
  'Defence',
  'Other',
] as const;

type SectionLabel = (typeof SECTION_ORDER)[number];

function classifyOpeningNode(node: BidNode): SectionLabel {
  if (node.byOpponent) return 'Defence';
  const first = node.bids[0];
  if (!first || first === 'P' || first === 'X' || first === 'XX') return 'Defence';
  const parsed = parseBid(first);
  if (!parsed) return 'Other';
  const { level, strain } = parsed;
  if (level === 1 && strain !== 'NT') return '1-Level Suits';
  if (level === 1 && strain === 'NT') return '1NT System';
  if (level === 2) return '2-Level Bids';
  if (level === 3 || level === 4) return 'Pre-empts';
  if (level >= 5) return 'High-Level';
  return 'Other';
}

export function groupIntoSections(nodes: BidNode[]): BidSection[] {
  const buckets = new Map<SectionLabel, BidNode[]>(SECTION_ORDER.map((l) => [l, []]));
  for (const node of nodes) {
    buckets.get(classifyOpeningNode(node))!.push(node);
  }
  return SECTION_ORDER.flatMap((label) => {
    const section = buckets.get(label)!;
    return section.length > 0 ? [{ label, nodes: section }] : [];
  });
}
