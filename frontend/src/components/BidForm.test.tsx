import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChainContext } from '../tree';
import { BidForm } from './BidForm';

const openingChain: ChainContext = {
  lastContractBid: null,
  hasActiveDouble: false,
  hasActiveRedouble: false,
};

describe('BidForm', () => {
  it('renders the opening-call form with level and strain pickers', () => {
    render(<BidForm mode="add" chain={openingChain} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Opening call')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bid' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('disables submit until a meaning is entered, then submits the composed call', async () => {
    const onSubmit = vi.fn();
    render(<BidForm mode="add" chain={openingChain} onSubmit={onSubmit} onCancel={vi.fn()} />);

    const add = screen.getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText(/Major-suit opening/), 'Strong opening');
    expect(add).toBeEnabled();

    await userEvent.click(add);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      bids: ['1♣'],
      meaning: 'Strong opening',
    });
  });

  it('disables Double and Redouble when there is no contract to act on', () => {
    render(<BidForm mode="add" chain={openingChain} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Double (X)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redouble (XX)' })).toBeDisabled();
  });
});
