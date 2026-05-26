import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BidNode,
  BidTreeRoot,
  ConventionDetail,
  ConventionParam,
  ConventionSummary,
  Share,
  SystemDetail,
  SystemSummary,
  UserProfile,
} from '../types';
import {
  createSystem,
  deleteSystem,
  forkSystem,
  getSystem,
  listSystems,
  updateSystem,
  updateVisibility,
} from './systems';
import { addShare, listShares, removeShare } from './sharing';
import { listPublicConventions, listPublicSystems } from './gallery';
import { likeSystem, unlikeSystem } from './likes';
import { getUserProfile, getUserPublicSystems } from './users';
import {
  createConvention,
  deleteConvention,
  forkConvention,
  getConvention,
  likeConvention,
  listConventionShares,
  listMyConventions,
  unlikeConvention,
  updateConvention,
  updateConventionVisibility,
} from './conventions';

/** Centralized query keys so invariations stay consistent. */
export const queryKeys = {
  systems: ['systems'] as const,
  system: (id: string) => ['system', id] as const,
  shares: (systemId: string) => ['shares', systemId] as const,
  gallery: (sort: string) => ['gallery', sort] as const,
  galleryConventions: (sort: string) => ['galleryConventions', sort] as const,
  userProfile: (username: string) => ['userProfile', username] as const,
  userSystems: (username: string) => ['userSystems', username] as const,
  conventions: ['conventions'] as const,
  convention: (id: string) => ['convention', id] as const,
  conventionShares: (id: string) => ['conventionShares', id] as const,
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

export function useForkSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forkSystem(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.systems });
      qc.invalidateQueries({ queryKey: queryKeys.system(id) });
      qc.invalidateQueries({ queryKey: queryKeys.gallery('newest') });
      qc.invalidateQueries({ queryKey: queryKeys.gallery('most_liked') });
    },
  });
}

export function useUpdateVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      updateVisibility(id, isPublic),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.system(id) });
      qc.invalidateQueries({ queryKey: queryKeys.systems });
      qc.invalidateQueries({ queryKey: queryKeys.gallery('newest') });
      qc.invalidateQueries({ queryKey: queryKeys.gallery('most_liked') });
    },
  });
}

// ── Gallery ───────────────────────────────────────────────────────────────

export function usePublicSystems(sort: 'newest' | 'most_liked' = 'newest') {
  return useQuery({
    queryKey: queryKeys.gallery(sort),
    queryFn: () => listPublicSystems(sort),
  });
}

export function usePublicConventions(sort: 'newest' | 'most_liked' = 'newest') {
  return useQuery<ConventionSummary[]>({
    queryKey: queryKeys.galleryConventions(sort),
    queryFn: () => listPublicConventions(sort),
  });
}

export function useToggleLike(systemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ liked }: { liked: boolean }) =>
      liked ? unlikeSystem(systemId) : likeSystem(systemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.gallery('newest') });
      qc.invalidateQueries({ queryKey: queryKeys.gallery('most_liked') });
      qc.invalidateQueries({ queryKey: queryKeys.systems });
      qc.invalidateQueries({ queryKey: queryKeys.system(systemId) });
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

// ── Users ─────────────────────────────────────────────────────────────────

export function useUserProfile(username: string) {
  return useQuery<UserProfile>({
    queryKey: queryKeys.userProfile(username),
    queryFn: () => getUserProfile(username),
  });
}

export function useUserSystems(username: string) {
  return useQuery<SystemSummary[]>({
    queryKey: queryKeys.userSystems(username),
    queryFn: () => getUserPublicSystems(username),
  });
}

// ── Conventions ───────────────────────────────────────────────────────────

export function useMyConventions() {
  return useQuery<ConventionDetail[]>({
    queryKey: queryKeys.conventions,
    queryFn: listMyConventions,
  });
}

export function useConvention(id: string | undefined) {
  return useQuery<ConventionDetail>({
    queryKey: queryKeys.convention(id ?? ''),
    queryFn: () => getConvention(id!),
    enabled: !!id,
  });
}

export function useCreateConvention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createConvention(name, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conventions }),
  });
}

export function useUpdateConvention(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      description: string | null;
      parameters: ConventionParam[];
      root: BidNode;
    }) => updateConvention(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.convention(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.conventions });
    },
  });
}

export function useDeleteConvention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteConvention(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.convention(id) });
      qc.invalidateQueries({ queryKey: queryKeys.conventions });
    },
  });
}

export function useUpdateConventionVisibility(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isPublic: boolean) => updateConventionVisibility(id, isPublic),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.convention(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.conventions });
      qc.invalidateQueries({ queryKey: queryKeys.galleryConventions('newest') });
      qc.invalidateQueries({ queryKey: queryKeys.galleryConventions('most_liked') });
    },
  });
}

export function useForkConvention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forkConvention(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conventions }),
  });
}

export function useToggleConventionLike(conventionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ liked }: { liked: boolean }) =>
      liked ? unlikeConvention(conventionId) : likeConvention(conventionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.galleryConventions('newest') });
      qc.invalidateQueries({ queryKey: queryKeys.galleryConventions('most_liked') });
      qc.invalidateQueries({ queryKey: queryKeys.convention(conventionId) });
    },
  });
}

export function useConventionShares(id: string) {
  return useQuery<Share[]>({
    queryKey: queryKeys.conventionShares(id),
    queryFn: () => listConventionShares(id),
  });
}
