import { describe, it, expect } from 'vitest';
import type { BidNode, ConventionDef } from './types';
import {
  ROOT_ID,
  addChainContext,
  bidRank,
  canDropNode,
  chainContextFromNodes,
  compareBids,
  conventionsFromTree,
  deleteNode,
  editChainContext,
  expandConventionParams,
  findConvention,
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
  resolveConventionChildren,
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
    for (const s of ['1♣', '3♥', '4♠', '2NT']) {
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
});

describe('strainOutranks', () => {
  it('compares strain rank at the same level', () => {
    expect(strainOutranks('♦', '♣')).toBe(true);
    expect(strainOutranks('NT', '♠')).toBe(true);
    expect(strainOutranks('♣', '♦')).toBe(false);
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

  it('returns NT after 1♠', () => {
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
  it('recognises contract bids', () => {
    expect(isContractBid('1♣')).toBe(true);
    expect(isContractBid('4NT')).toBe(true);
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

  it('moveNode inserts the node in bid-rank order', () => {
    const r = build();
    // D(1♦) moved under A(1♣): A already has B(2♣). 1♦ < 2♣, so D sorts before B.
    const moved = moveNode(r, 'D', 'A');
    expect(findNode(moved, 'A')?.children.map((c) => c.id)).toEqual(['D', 'B']);
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

  it('conventionsFromTree reads embedded conventions for backward compat', () => {
    // Simulates old tree_json that still has an inline conventions array
    const conv: ConventionDef = {
      id: 'c1',
      name: 'Stayman',
      description: 'Asks for 4-card major',
      parameters: [{ id: 'p1', name: 'level', label: 'Opening level', defaultValue: '1NT' }],
      root: {
        id: 'cr1',
        bids: [],
        meaning: '',
        children: [n(['2♣'], [], { id: 'c1r1', meaning: 'Stayman ask' })],
      },
    };
    const legacyTree = {
      children: [],
      conventions: [conv],
    } as unknown as import('./types').BidTreeRoot;
    const recovered = conventionsFromTree(legacyTree);
    expect(recovered).toHaveLength(1);
    expect(recovered[0].name).toBe('Stayman');
    expect(recovered[0].description).toBe('Asks for 4-card major');
    expect(recovered[0].parameters).toHaveLength(1);
    expect(recovered[0].parameters![0].name).toBe('level');
    expect(recovered[0].root.children).toHaveLength(1);
  });

  it('migrateNode preserves alerted field', () => {
    // Cast via unknown to simulate raw JSON arriving from the backend
    const raw = {
      id: 't-alert',
      bids: ['1♣'],
      meaning: 'test',
      alerted: true,
      children: [],
    } as unknown as BidNode;
    const tree = rootFromTree({ children: [raw] });
    expect(tree.children[0].alerted).toBe(true);
  });

  it('migrateNode migrates old conventionRef/conventionArgs to conventionRefs', () => {
    const raw = {
      id: 't-conv',
      bids: ['4NT'],
      meaning: 'RKCB',
      conventionRef: 'c1',
      conventionArgs: { agreedSuit: '♠' },
      children: [],
    } as unknown as BidNode;
    const tree = rootFromTree({ children: [raw] });
    const node = tree.children[0];
    expect(node.conventionRefs).toEqual([{ id: 'c1', args: { agreedSuit: '♠' } }]);
  });
});

// ── Convention helpers ────────────────────────────────────────────────────────

function makeConvention(id: string, children: BidNode[]): ConventionDef {
  return {
    id,
    name: id,
    root: { id: `${id}-root`, bids: [], meaning: '', children },
  };
}

describe('findConvention', () => {
  it('returns the matching convention', () => {
    const convs = [makeConvention('c1', []), makeConvention('c2', [])];
    expect(findConvention(convs, 'c2')?.id).toBe('c2');
  });

  it('returns undefined for unknown id', () => {
    expect(findConvention([], 'nope')).toBeUndefined();
  });
});

describe('expandConventionParams', () => {
  it('substitutes placeholders in meaning and notes', () => {
    const node = n(['5♣'], [], {
      id: 'n1',
      meaning: '1 or 4 key cards in {{agreedSuit}}',
      notes: 'Trump suit: {{agreedSuit}}',
    });
    const expanded = expandConventionParams(node, { agreedSuit: '♠' });
    expect(expanded.meaning).toBe('1 or 4 key cards in ♠');
    expect(expanded.notes).toBe('Trump suit: ♠');
  });

  it('substitutes placeholders in bid labels', () => {
    const node = n(['6{{agreedSuit}}'], [], { id: 'n1', meaning: 'Queen yes, no kings' });
    const expanded = expandConventionParams(node, { agreedSuit: '♠' });
    expect(expanded.bids).toEqual(['6♠']);
  });

  it('leaves unknown placeholders intact', () => {
    const node = n(['5♣'], [], { id: 'n1', meaning: '{{unknown}} placeholder' });
    const expanded = expandConventionParams(node, {});
    expect(expanded.meaning).toBe('{{unknown}} placeholder');
  });

  it('recursively expands children', () => {
    const child = n(['5NT'], [], { id: 'c1', meaning: 'King ask in {{agreedSuit}}' });
    const parent = n(['5♣'], [child], { id: 'p1', meaning: 'Responses for {{agreedSuit}}' });
    const expanded = expandConventionParams(parent, { agreedSuit: '♥' });
    expect(expanded.meaning).toBe('Responses for ♥');
    expect(expanded.children[0].meaning).toBe('King ask in ♥');
  });
});

describe('resolveConventionChildren', () => {
  it('returns stored children when no conventionRef', () => {
    const child = n(['5♣'], [], { id: 'c1' });
    const node = n(['4NT'], [child], { id: 'p1' });
    expect(resolveConventionChildren(node, [])).toEqual([child]);
  });

  it('returns convention children when ref is set', () => {
    const convChild = n(['5♣'], [], { id: 'cc1', meaning: '1 or 4 KC' });
    const conv = makeConvention('rkcb', [convChild]);
    const node: BidNode = { ...n(['4NT'], [], { id: 'p1' }), conventionRefs: [{ id: 'rkcb' }] };
    const resolved = resolveConventionChildren(node, [conv]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].meaning).toBe('1 or 4 KC');
  });

  it('applies param substitution when args are present', () => {
    const convChild = n(['5♣'], [], { id: 'cc1', meaning: '1 or 4 KC in {{suit}}' });
    const conv = makeConvention('rkcb', [convChild]);
    const node: BidNode = {
      ...n(['4NT'], [], { id: 'p1' }),
      conventionRefs: [{ id: 'rkcb', args: { suit: '♠' } }],
    };
    const resolved = resolveConventionChildren(node, [conv]);
    expect(resolved[0].meaning).toBe('1 or 4 KC in ♠');
  });

  it('falls back to stored children when convention is not found', () => {
    const child = n(['5♣'], [], { id: 'c1' });
    const node: BidNode = { ...n(['4NT'], [child], { id: 'p1' }), conventionRefs: [{ id: 'missing' }] };
    expect(resolveConventionChildren(node, [])).toEqual([child]);
  });

  it('merges children from multiple conventions', () => {
    const child1 = n(['5♣'], [], { id: 'cc1', meaning: 'Conv1 response' });
    const child2 = n(['5♦'], [], { id: 'cc2', meaning: 'Conv2 response' });
    const conv1 = makeConvention('c1', [child1]);
    const conv2 = makeConvention('c2', [child2]);
    const node: BidNode = {
      ...n(['4NT'], [], { id: 'p1' }),
      conventionRefs: [{ id: 'c1' }, { id: 'c2' }],
    };
    const resolved = resolveConventionChildren(node, [conv1, conv2]);
    expect(resolved).toHaveLength(2);
    expect(resolved[0].meaning).toBe('Conv1 response');
    expect(resolved[1].meaning).toBe('Conv2 response');
  });
});

describe('canDropNode convention guard', () => {
  it('disallows dropping into a convention-ref node', () => {
    const convChild = n(['5♣'], [], { id: 'cc' });
    const conv = makeConvention('rkcb', [convChild]);
    // 4NT node has a convention ref — its children are from the convention.
    const fourNT: BidNode = { ...n(['4NT'], [], { id: 'n4nt' }), conventionRefs: [{ id: 'rkcb' }] };
    const fiveSpade = n(['5♠'], [], { id: 'n5s' });
    const r = root([fourNT, fiveSpade]);
    // Dropping 5♠ under 4NT should be disallowed (convention owns its children).
    expect(canDropNode(r, 'n5s', 'n4nt')).toBe(false);
    void conv; // silence unused variable warning
  });
});
