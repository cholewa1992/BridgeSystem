import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BidLabel } from './BidLabel';

describe('BidLabel', () => {
  it('renders a single call', () => {
    render(<BidLabel bids={['1♥']} />);
    expect(screen.getByText('1♥')).toBeInTheDocument();
  });

  it('renders each call of a group with a separator', () => {
    render(<BidLabel bids={['1♥', '1♠']} />);
    expect(screen.getByText('1♥')).toBeInTheDocument();
    expect(screen.getByText('1♠')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('wraps interference calls in parentheses', () => {
    render(<BidLabel bids={['2♣']} byOpponent />);
    expect(screen.getByText('(')).toBeInTheDocument();
    expect(screen.getByText(')')).toBeInTheDocument();
  });

  it('renders nothing for an empty bid list', () => {
    const { container } = render(<BidLabel bids={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
