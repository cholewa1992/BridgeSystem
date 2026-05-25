import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import type { SystemSummary } from '../types';
import { renderWithProviders } from '../test/utils';
import { SystemList } from './SystemList';

// Mutable state the mocked query hook reads from, so each test can pick a
// loading / empty / populated scenario.
const mockState = vi.hoisted(() => ({
  systems: undefined as SystemSummary[] | undefined,
}));

vi.mock('../api/queries', () => ({
  useSystems: () => ({ data: mockState.systems, error: null }),
  useCreateSystem: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
}));

const sampleSystem: SystemSummary = {
  id: 's1',
  name: '2/1 Game Force',
  description: 'Our main system',
  ownerUsername: 'alice',
  ownedByMe: true,
  permission: 'OWNER',
  updatedAt: '2026-01-01T00:00:00Z',
  likeCount: 0,
  forkCount: 0,
  isPublic: false,
  likedByMe: null,
};

describe('SystemList', () => {
  beforeEach(() => {
    mockState.systems = undefined;
  });

  it('shows a loading state while systems are undefined', () => {
    mockState.systems = undefined;
    renderWithProviders(<SystemList />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the empty state when there are no systems', () => {
    mockState.systems = [];
    renderWithProviders(<SystemList />);
    expect(screen.getByText(/No systems yet/)).toBeInTheDocument();
  });

  it('renders a system card with its owner tag', () => {
    mockState.systems = [sampleSystem];
    renderWithProviders(<SystemList />);
    expect(screen.getByText('2/1 Game Force')).toBeInTheDocument();
    expect(screen.getByText('Our main system')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });
});
