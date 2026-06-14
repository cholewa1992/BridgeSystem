import { describe, it, expect } from 'vitest';
import type { BidNode } from './types';
import { encodeBid, decodeBid } from './bidClipboard';

function node(bids: string[], children: BidNode[] = []): BidNode {
  return { id: 'x', bids, meaning: 'm', children };
}

describe('encodeBid / decodeBid', () => {
  it('round-trips a bid subtree', () => {
    const original = node(['1♥'], [node(['2♣'], []), node(['2♦'], [])]);
    const decoded = decodeBid(encodeBid(original));
    expect(decoded).not.toBeNull();
    expect(decoded!.bids).toEqual(['1♥']);
    expect(decoded!.children.map((c) => c.bids[0])).toEqual(['2♣', '2♦']);
  });

  it('preserves meaning and notes', () => {
    const original: BidNode = {
      id: 'x',
      bids: ['1NT'],
      meaning: '15-17',
      notes: 'balanced',
      children: [],
    };
    const decoded = decodeBid(encodeBid(original));
    expect(decoded!.meaning).toBe('15-17');
    expect(decoded!.notes).toBe('balanced');
  });

  it('returns null for non-JSON text', () => {
    expect(decodeBid('hello world')).toBeNull();
  });

  it('returns null for JSON that is not a bridge-bid envelope', () => {
    expect(decodeBid(JSON.stringify({ foo: 'bar' }))).toBeNull();
    expect(decodeBid(JSON.stringify({ kind: 'something-else', node: {} }))).toBeNull();
  });

  it('returns null when the payload node has no calls', () => {
    expect(decodeBid(encodeBid(node([])))).toBeNull();
  });

  it('sanitises unknown fields out of the payload', () => {
    const raw = JSON.stringify({
      kind: 'bridge-bid',
      version: 1,
      node: { bids: ['1♠'], meaning: 'x', evil: 'drop me', children: [] },
    });
    const decoded = decodeBid(raw) as BidNode & { evil?: unknown };
    expect(decoded.bids).toEqual(['1♠']);
    expect(decoded.evil).toBeUndefined();
  });
});
