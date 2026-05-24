import { describe, it, expect } from 'vitest';
import type { BidNode } from './types';
import {
  ROOT_ID,
  addChainContext,
  bidRank,
  canDropNode,
  chainContextFromNodes,
  compareBids,
  deleteNode,
  editChainContext,
  findNode,
  formatBid,
  highestContractBidIn,
  isContractBid,
  isValidContinuation,
  minValidBidAfter,
  moveNode,
  newId,
  parseBid,
  pathTo,
  rootFromTree,
  strainOutranks,
  treeFromRoot,
  updateNode,
} from './tree';

// ── Helpers ────────────────────────────────────────────────────────────────

let counter = 0;
function n(bids: string[], children: BidNode[] = [], extra: Partial<BidNode> = {}): BidNode {
  return {
    id: extra.id ?? `t${counter++}`,
    bids,
    meaning: extra.meaning ?? '',
    notes: extra.notes,
    byOpponent: extra.byOpponent,
    children,
  };
}

function root(children: BidNode[]): BidNode {
  return { id: ROOT_ID, bids: [], meaning: '', children };
}

// ── newId ───────────────────────────────────────────────────────────────────

describe('newId', () => {
  it('prefixes ids with node- and produces unique values', () => {
    const a = newId();
    const b = newId();
    expect(a).toMatch(/^node-/);
    expect(a).not.toBe(b);
  });
});

// ── parseBid / formatBid ─────────────────────────────────────────────────────

describe('parseBid', () => {
  it('parses literal contract bids', () => {
    expect(parseBid('1♣')).toEqual({ level: 1, strain: '♣' });
    expect(parseBid('7NT')).toEqual({ level: 7, strain: 'NT' });
  });

  it('parses symbolic major strains', () => {
    expect(parseBid('2ma')).toEqual({ level: 2, strain: 'ma' });
    expect(parseBid('3om')).toEqual({ level: 3, strain: 'om' });
  });

  it('rejects doubles, out-of-range levels and garbage', () => {
    expect(parseBid('X')).toBeNull();
    expect(parseBid('XX')).toBeNull();
    expect(parseBid('8♣')).toBeNull();
    expect(parseBid('0NT')).toBeNull();
    expect(parseBid('1Z')).toBeNull();
    expect(parseBid('')).toBeNull();
    expect(parseBid(null)).toBeNull();
    expect(parseBid(undefined)).toBeNull();
  });

  it('round-trips through formatBid', () => {
    for (const s of ['1♣', '3♥', '4♠', '2NT', '5ma', '6om']) {
      expect(formatBid(parseBid(s)!)).toBe(s);
    }
  });
});

// ── Ordering ─────────────────────────────────────────────────────────────────

describe('bid ordering', () => {
  it('orders strains ♣ < ♦ < ♥ < ♠ < NT within a level', () => {
    const order = ['1♣', '1♦', '1♥', '1♠', '1NT'].map((s) => bidRank(parseBid(s)!));
    const sorted = [...order].sort((a, b) => a - b);
    expect(order).toEqual(sorted);
  });

  it('orders by level first', () => {
    expect(compareBids(parseBid('1NT')!, parseBid('2♣')!)).toBeLessThan(0);
  });

  it('treats ma and om as the high major (♠) for comparison', () => {
    // 2♥ ranks below 2ma, 2♠ ties with 2ma, 2ma below 2NT
    expect(compareBids(parseBid('2♥')!, parseBid('2ma')!)).toBeLessThan(0);
    expect(compareBids(parseBid('2♠')!, parseBid('2ma')!)).toBe(0);
    expect(compareBids(parseBid('2ma')!, parseBid('2NT')!)).toBeLessThan(0);
    expect(compareBids(parseBid('2om')!, parseBid('2ma')!)).toBe(0);
  });
});

describe('strainOutranks', () => {
  it('compares strain rank at the same level', () => {
    expect(strainOutranks('♦', '♣')).toBe(true);
    expect(strainOutranks('NT', '♠')).toBe(true);
    expect(strainOutranks('♣', '♦')).toBe(false);
    expect(strainOutranks('ma', '♥')).toBe(true); // ma == ♠ > ♥
    expect(strainOutranks('ma', '♠')).toBe(false); // ma == ♠, not strictly greater
  });
});

describe('minValidBidAfter', () => {
  it('returns 1♣ for an opening (no prior bid)', () => {
    expect(minValidBidAfter(null)).toEqual({ level: 1, strain: '♣' });
  });

  it('returns the next strain up at the same level', () => {
    expect(minValidBidAfter(parseBid('1♣'))).toEqual({ level: 1, strain: '♦' });
  });

  it('rolls up to the next level after NT', () => {
    expect(minValidBidAfter(parseBid('1NT'))).toEqual({ level: 2, strain: '♣' });
  });

  it('returns null past the 7NT ceiling', () => {
    expect(minValidBidAfter(parseBid('7NT'))).toBeNull();
  });

  it('never auto-selects the symbolic strains', () => {
    // After 1♠ the next literal strain is NT, not ma/om.
    expect(minValidBidAfter(parseBid('1♠'))).toEqual({ level: 1, strain: 'NT' });
  });
});

describe('isValidContinuation', () => {
  it('accepts any opening when there is no parent', () => {
    expect(isValidContinuation(parseBid('1♣')!, null)).toBe(true);
  });

  it('requires the child to outrank the parent', () => {
    expect(isValidContinuation(parseBid('2♣')!, parseBid('1♣')!)).toBe(true);
    expect(isValidContinuation(parseBid('1♣')!, parseBid('1♦')!)).toBe(false);
    expect(isValidContinuation(parseBid('1♦')!, parseBid('1♦')!)).toBe(false);
  });
});

describe('isContractBid', () => {
  it('recognises contract bids including symbolic strains', () => {
    expect(isContractBid('1♣')).toBe(true);
    expect(isContractBid('2ma')).toBe(true);
  });

  it('rejects doubles and non-bids', () => {
    expect(isContractBid('X')).toBe(false);
    expect(isContractBid('XX')).toBe(false);
    expect(isContractBid('8NT')).toBe(false);
    expect(isContractBid(null)).toBe(false);
    expect(isContractBid(undefined)).toBe(false);
  });
});

describe('highestContractBidIn', () => {
  it('returns the highest bid in a group', () => {
    expect(highestContractBidIn(['1♥', '1♠'])).toBe('1♠');
    expect(highestContractBidIn(['2♣', '1♠'])).toBe('2♣');
  });

  it('returns null when no member is a contract bid', () => {
    expect(highestContractBidIn(['X'])).toBeNull();
    expect(highestContractBidIn([])).toBeNull();
  });
});

// ── Chain context ────────────────────────────────────────────────────────────

describe('chainContextFromNodes', () => {
  it('tracks the last contract bid across a simple chain', () => {
    const ctx = chainContextFromNodes([n(['1♣']), n(['2♣'])]);
    expect(ctx.lastContractBid).toBe('2♣');
    expect(ctx.hasActiveDouble).toBe(false);
    expect(ctx.hasActiveRedouble).toBe(false);
  });

  it('uses the highest bid in a group as the bar', () => {
    const ctx = chainContextFromNodes([n(['1♥', '1♠'])]);
    expect(ctx.lastContractBid).toBe('1♠');
  });

  it('activates double then redouble', () => {
    const dbl = chainContextFromNodes([n(['1♣']), n(['X'])]);
    expect(dbl.hasActiveDouble).toBe(true);
    expect(dbl.hasActiveRedouble).toBe(false);

    const redbl = chainContextFromNodes([n(['1♣']), n(['X']), n(['XX'])]);
    expect(redbl.hasActiveDouble).toBe(true);
    expect(redbl.hasActiveRedouble).toBe(true);
  });

  it('resets doubles when a new contract bid is made', () => {
    const ctx = chainContextFromNodes([n(['1♣']), n(['X']), n(['2♣'])]);
    expect(ctx.lastContractBid).toBe('2♣');
    expect(ctx.hasActiveDouble).toBe(false);
    expect(ctx.hasActiveRedouble).toBe(false);
  });

  it('ignores an opening double with no contract to act on', () => {
    const ctx = chainContextFromNodes([n(['X'])]);
    expect(ctx.lastContractBid).toBeNull();
    expect(ctx.hasActiveDouble).toBe(false);
  });
});

describe('addChainContext / editChainContext', () => {
  // root → A(1♣) → B(2♣)
  const B = n(['2♣'], [], { id: 'B' });
  const A = n(['1♣'], [B], { id: 'A' });
  const r = root([A]);

  it('addChainContext at ROOT has no bar', () => {
    const ctx = addChainContext(r, ROOT_ID);
    expect(ctx.lastContractBid).toBeNull();
  });

  it('addChainContext under a node includes that node', () => {
    expect(addChainContext(r, 'A').lastContractBid).toBe('1♣');
    expect(addChainContext(r, 'B').lastContractBid).toBe('2♣');
  });

  it('editChainContext excludes the node being edited', () => {
    // Editing B walks only its ancestors (A), so the bar is 1♣.
    expect(editChainContext(r, 'B').lastContractBid).toBe('1♣');
    // Editing a top-level node has no bar.
    expect(editChainContext(r, 'A').lastContractBid).toBeNull();
  });
});

// ── Tree traversal ───────────────────────────────────────────────────────────

describe('findNode / pathTo / updateNode / deleteNode', () => {
  const C = n(['3♣'], [], { id: 'C' });
  const B = n(['2♣'], [C], { id: 'B' });
  const A = n(['1♣'], [B], { id: 'A' });
  const r = root([A]);

  it('finds nested nodes and returns null for misses', () => {
    expect(findNode(r, 'C')?.bids).toEqual(['3♣']);
    expect(findNode(r, 'nope')).toBeNull();
  });

  it('pathTo returns the ancestor chain including the node', () => {
    expect(pathTo(r, 'C')?.map((x) => x.id)).toEqual([ROOT_ID, 'A', 'B', 'C']);
    expect(pathTo(r, 'nope')).toBeNull();
  });

  it('updateNode replaces a node immutably', () => {
    const updated = updateNode(r, 'B', (node) => ({ ...node, meaning: 'changed' }));
    expect(findNode(updated, 'B')?.meaning).toBe('changed');
    expect(findNode(r, 'B')?.meaning).toBe(''); // original untouched
  });

  it('deleteNode removes a subtree', () => {
    const pruned = deleteNode(r, 'B');
    expect(findNode(pruned, 'B')).toBeNull();
    expect(findNode(pruned, 'C')).toBeNull();
    expect(findNode(pruned, 'A')).not.toBeNull();
  });
});

// ── Drag / move legality ─────────────────────────────────────────────────────

describe('canDropNode / moveNode', () => {
  // root → A(1♣) → B(2♣) → C(3♣) ;  D(1♦)
  function build() {
    const C = n(['3♣'], [], { id: 'C' });
    const B = n(['2♣'], [C], { id: 'B' });
    const A = n(['1♣'], [B], { id: 'A' });
    const D = n(['1♦'], [], { id: 'D' });
    return root([A, D]);
  }

  it('allows a legal move to a new parent', () => {
    const r = build();
    // 3♣ under 1♣: 3♣ outranks 1♣ → legal
    expect(canDropNode(r, 'C', 'A')).toBe(true);
    // 1♦ under 1♣: 1♦ outranks 1♣ → legal
    expect(canDropNode(r, 'D', 'A')).toBe(true);
  });

  it('refuses dropping a node into its own subtree', () => {
    const r = build();
    expect(canDropNode(r, 'B', 'C')).toBe(false);
  });

  it('refuses a no-op drop onto the current parent', () => {
    const r = build();
    expect(canDropNode(r, 'C', 'B')).toBe(false);
  });

  it('refuses an illegal bid for the target context', () => {
    const r = build();
    // 1♣ under 1♦: 1♣ does not outrank 1♦ → illegal
    expect(canDropNode(r, 'A', 'D')).toBe(false);
  });

  it('moveNode relocates the node and prunes the old position', () => {
    const r = build();
    const moved = moveNode(r, 'C', 'A');
    expect(findNode(moved, 'B')?.children).toHaveLength(0);
    expect(findNode(moved, 'A')?.children.map((c) => c.id)).toContain('C');
  });

  it('moveNode is a no-op for an unknown node', () => {
    const r = build();
    expect(moveNode(r, 'ghost', 'A')).toBe(r);
  });
});

// ── Backend (de)serialization + legacy migration ─────────────────────────────

describe('rootFromTree / treeFromRoot', () => {
  it('migrates legacy single-bid nodes to bids arrays', () => {
    const migrated = rootFromTree({
      children: [{ bid: '1♣', meaning: 'club', children: [] }],
    } as never);
    expect(migrated.children[0].bids).toEqual(['1♣']);
    expect(migrated.children[0].meaning).toBe('club');
  });

  it('keeps modern bids arrays and recurses into children', () => {
    const migrated = rootFromTree({
      children: [
        {
          id: 'x',
          bids: ['1♥', '1♠'],
          meaning: 'majors',
          children: [{ bid: '2♣', meaning: 'ask', children: [] }],
        },
      ],
    } as never);
    expect(migrated.children[0].bids).toEqual(['1♥', '1♠']);
    expect(migrated.children[0].children[0].bids).toEqual(['2♣']);
  });

  it('synthesizes ids and preserves notes / byOpponent', () => {
    const migrated = rootFromTree({
      children: [{ bids: ['X'], meaning: 'takeout', notes: 'partner bids', byOpponent: true }],
    } as never);
    const node = migrated.children[0];
    expect(node.id).toMatch(/^node-/);
    expect(node.notes).toBe('partner bids');
    expect(node.byOpponent).toBe(true);
  });

  it('treeFromRoot extracts the children payload', () => {
    const r = root([n(['1♣'], [], { id: 'A' })]);
    expect(treeFromRoot(r)).toEqual({ children: r.children });
  });
});
