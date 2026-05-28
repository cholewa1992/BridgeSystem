import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SystemDetail } from '../types';
import { renderWithProviders } from '../test/utils';
import { SystemEditor } from './SystemEditor';

// ── Mock react-router-dom to control useParams ────────────────────────────────
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'sys-1' }),
    useNavigate: () => vi.fn(),
  };
});

// ── Mutable state shared between tests ───────────────────────────────────────
const mockState = vi.hoisted(() => ({
  detail: undefined as SystemDetail | undefined,
  error: null as Error | null,
  mutateFn: vi.fn(),
  isPending: false,
}));

vi.mock('../api/queries', () => ({
  useSystem: () => ({ data: mockState.detail, error: mockState.error }),
  useUpdateSystem: () => ({
    mutate: mockState.mutateFn,
    isPending: mockState.isPending,
    error: null,
  }),
  useDeleteSystem: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
  useForkSystem: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false, error: null }),
  useUpdateVisibility: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', username: 'alice', displayName: 'Alice' } }),
}));

vi.mock('./ShareDialog', () => ({
  ShareDialog: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="share-dialog">
      <button onClick={onClose}>Close share</button>
    </div>
  ),
}));

const baseDetail: SystemDetail = {
  id: 'sys-1',
  name: 'My System',
  description: 'A test system',
  ownerUsername: 'alice',
  ownedByMe: true,
  permission: 'OWNER',
  updatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  likeCount: 0,
  forkCount: 0,
  isPublic: false,
  likedByMe: null,
  tree: { children: [] },
  conventions: [],
};

describe('SystemEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.detail = undefined;
    mockState.error = null;
    mockState.isPending = false;
  });

  it('shows a loading placeholder while detail is not yet available', () => {
    mockState.detail = undefined;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders the system name in the header once loaded', () => {
    mockState.detail = baseDetail;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByText('My System')).toBeInTheDocument();
  });

  it('shows an error message and Back button when loading fails', () => {
    mockState.error = new Error('Not found');
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByText('Not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to list' })).toBeInTheDocument();
  });

  it('shows Owner controls (Make Public, Share, Delete) for OWNER permission', () => {
    mockState.detail = baseDetail;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByRole('button', { name: 'Make Public' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('does not show Owner controls for READ-only permission', () => {
    mockState.detail = { ...baseDetail, permission: 'READ', ownedByMe: false };
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  });

  it('shows Fork button for non-owner when a user is logged in', () => {
    mockState.detail = { ...baseDetail, permission: 'READ', ownedByMe: false };
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByRole('button', { name: 'Fork' })).toBeInTheDocument();
  });

  it('renders "+ Opening bid" button for OWNER and triggers the add form', async () => {
    mockState.detail = baseDetail;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    const addBtn = screen.getByRole('button', { name: '+ Opening bid' });
    expect(addBtn).toBeInTheDocument();

    await userEvent.click(addBtn);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('shows the Share dialog when Share button is clicked', async () => {
    mockState.detail = baseDetail;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });

    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
  });

  it('closes the Share dialog when onClose is triggered', async () => {
    mockState.detail = baseDetail;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });

    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close share' }));
    expect(screen.queryByTestId('share-dialog')).not.toBeInTheDocument();
  });

  it('displays "Saving…" indicator when a mutation is pending', () => {
    mockState.detail = baseDetail;
    mockState.isPending = true;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('adds a new node and triggers the save mutation after debounce', async () => {
    mockState.detail = baseDetail;
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });

    await userEvent.click(screen.getByRole('button', { name: '+ Opening bid' }));
    await userEvent.type(screen.getByPlaceholderText(/Major-suit opening/), 'Strong 1C');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Wait for the 800 ms debounce to fire with real timers.
    await waitFor(() => expect(mockState.mutateFn).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
    const payload = mockState.mutateFn.mock.calls[0][0];
    expect(payload.name).toBe('My System');
    expect(payload.tree.children).toHaveLength(1);
    expect(payload.tree.children[0].meaning).toBe('Strong 1C');
  }, 10000);

  it('renders existing tree nodes from the loaded system', () => {
    mockState.detail = {
      ...baseDetail,
      tree: {
        children: [{ id: 'existing-1', bids: ['1NT'], meaning: 'Strong NT', children: [] }],
      },
    };
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByText('1NT')).toBeInTheDocument();
    expect(screen.getByText('Strong NT')).toBeInTheDocument();
  });

  it('shows the forked-from banner when the system was forked', () => {
    mockState.detail = {
      ...baseDetail,
      forkedFrom: { id: 'orig-1', name: 'Original System', ownerUsername: 'bob' },
    };
    renderWithProviders(<SystemEditor />, { route: '/systems/sys-1' });
    expect(screen.getByText(/"Original System"/)).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
  });
});
