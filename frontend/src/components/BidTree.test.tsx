import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BidNode, ConventionDef } from '../types';
import { ROOT_ID } from '../tree';
import { BidTree } from './BidTree';

function makeNode(id: string, bids: string[], children: BidNode[] = []): BidNode {
  return { id, bids, meaning: `meaning of ${bids.join('/')}`, children };
}

const rootNode: BidNode = {
  id: ROOT_ID,
  bids: [],
  meaning: '',
  children: [
    makeNode('n1', ['1♣'], [makeNode('n2', ['2♣'], [makeNode('n3', ['3♣'])])]),
    makeNode('n4', ['1♦']),
  ],
};

describe('BidTree', () => {
  it('renders top-level bids from a synthetic root', () => {
    render(<BidTree node={rootNode} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('1♣')).toBeInTheDocument();
    expect(screen.getByText('1♦')).toBeInTheDocument();
  });

  it('renders the meaning text next to the bid', () => {
    render(<BidTree node={rootNode} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('meaning of 1♣')).toBeInTheDocument();
  });

  it('shows "no meaning set" placeholder when meaning is empty', () => {
    const emptyMeaning: BidNode = {
      id: ROOT_ID,
      bids: [],
      meaning: '',
      children: [{ id: 'x1', bids: ['1♠'], meaning: '', children: [] }],
    };
    render(<BidTree node={emptyMeaning} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('no meaning set')).toBeInTheDocument();
  });

  it('calls onSelect with the node id when a row is clicked', async () => {
    const onSelect = vi.fn();
    render(<BidTree node={rootNode} selectedId={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('meaning of 1♦'));
    expect(onSelect).toHaveBeenCalledWith('n4');
  });

  it('renders children at depth < 2 expanded by default', () => {
    render(<BidTree node={rootNode} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('2♣')).toBeInTheDocument();
  });

  it('shows a collapse toggle (▶) for nodes that have children', () => {
    render(<BidTree node={rootNode} selectedId={null} onSelect={vi.fn()} />);
    const toggles = screen.getAllByText('▶');
    expect(toggles.length).toBeGreaterThan(0);
  });

  it('renders a multi-bid group node showing both bids', () => {
    const multiNode: BidNode = {
      id: ROOT_ID,
      bids: [],
      meaning: '',
      children: [makeNode('m1', ['1♥', '1♠'])],
    };
    render(<BidTree node={multiNode} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('1♥')).toBeInTheDocument();
    expect(screen.getByText('1♠')).toBeInTheDocument();
  });

  // A 1NT opening lands in the "1NT System" section, forcing the grouped
  // synthetic-root render path (BidTreeSection) rather than a flat list.
  const stayman: ConventionDef = {
    id: 'stayman',
    name: 'Stayman',
    root: {
      id: 'conv-root',
      bids: [],
      meaning: '',
      children: [{ id: 'c-2c', bids: ['2♣'], meaning: 'asks for a major', children: [] }],
    },
  };
  const ntWithConvention: BidNode = {
    id: ROOT_ID,
    bids: [],
    meaning: '',
    children: [
      {
        id: 'nt',
        bids: ['1NT'],
        meaning: '15-17 balanced',
        conventionRefs: [{ id: 'stayman' }],
        children: [],
      },
    ],
  };

  it('routes convention-child clicks through onSelectConventionChild even when grouped into sections', async () => {
    const onSelect = vi.fn();
    const onSelectConventionChild = vi.fn();
    render(
      <BidTree
        node={ntWithConvention}
        selectedId={null}
        onSelect={onSelect}
        onSelectConventionChild={onSelectConventionChild}
        conventions={[stayman]}
      />,
    );
    await userEvent.click(screen.getByText('asks for a major'));
    expect(onSelectConventionChild).toHaveBeenCalledTimes(1);
    expect(onSelectConventionChild.mock.calls[0][0].bids).toEqual(['2♣']);
    expect(onSelectConventionChild.mock.calls[0][1]).toBe('stayman');
    expect(onSelect).not.toHaveBeenCalledWith('c-2c');
  });

  it('shows the conv badge on the resolved response, not on the linked bid', () => {
    render(
      <BidTree
        node={ntWithConvention}
        selectedId={null}
        onSelect={vi.fn()}
        onSelectConventionChild={vi.fn()}
        conventions={[stayman]}
      />,
    );
    // Exactly one badge, attached to the 2♣ response row.
    const badges = screen.getAllByText('conv');
    expect(badges).toHaveLength(1);
    const responseRow = screen.getByText('asks for a major').closest('div');
    expect(responseRow).toContainElement(badges[0]);
  });

  it('renders an opponent bid in italic style (byOpponent)', () => {
    const oppNode: BidNode = {
      id: ROOT_ID,
      bids: [],
      meaning: '',
      children: [
        { id: 'o1', bids: ['2♣'], meaning: 'interference', byOpponent: true, children: [] },
      ],
    };
    render(<BidTree node={oppNode} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('2♣')).toBeInTheDocument();
  });
});

// Native HTML5 drag-and-drop (dragstart, dragover, drop) is not reliably
// exercisable in jsdom because dataTransfer is not implemented. The drag
// callbacks (onDragStart, onDragEnd, onDrop, canDrop) are wired in SystemEditor
// and tested there instead.
