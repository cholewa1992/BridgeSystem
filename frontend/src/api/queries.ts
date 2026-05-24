import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BidTreeRoot, Share, SystemDetail, SystemSummary } from '../types';
import { createSystem, deleteSystem, getSystem, listSystems, updateSystem } from './systems';
import { addShare, listShares, removeShare } from './sharing';

/** Centralized query keys so invalidations stay consistent. */
export const queryKeys = {
  systems: ['systems'] as const,
  system: (id: string) => ['system', id] as const,
  shares: (systemId: string) => ['shares', systemId] as const,
};

// ── Systems ────────────────────────────────────────────────────────────────

export function useSystems() {
  return useQuery<SystemSummary[]>({
    queryKey: queryKeys.systems,
    queryFn: listSystems,
  });
}

export function useSystem(id: string | undefined) {
  return useQuery<SystemDetail>({
    queryKey: queryKeys.system(id ?? ''),
    queryFn: () => getSystem(id!),
    enabled: !!id,
  });
}

export function useCreateSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; description?: string }) =>
      createSystem(vars.name, vars.description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.systems });
    },
  });
}

export function useUpdateSystem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description: string | null; tree: BidTreeRoot }) =>
      updateSystem(id, payload),
    onSuccess: (updated) => {
      // Seed the detail cache with the server's response and refresh the list.
      qc.setQueryData(queryKeys.system(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.systems });
    },
  });
}

export function useDeleteSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSystem(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.system(id) });
      qc.invalidateQueries({ queryKey: queryKeys.systems });
    },
  });
}

// ── Shares ───────────────────────────────────────────────────────────────

export function useShares(systemId: string) {
  return useQuery<Share[]>({
    queryKey: queryKeys.shares(systemId),
    queryFn: () => listShares(systemId),
  });
}

export function useAddShare(systemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { username: string; permission: 'READ' | 'WRITE' }) =>
      addShare(systemId, vars.username, vars.permission),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.shares(systemId) });
    },
  });
}

export function useRemoveShare(systemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => removeShare(systemId, username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.shares(systemId) });
    },
  });
}
