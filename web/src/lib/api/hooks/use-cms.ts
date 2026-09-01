'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del, type ApiResponse } from '../api-client';
import { QK } from '../query-keys';

/**
 * CMS — backed by `src/module/cms/cms.controller.ts`
 * (`/organizations/:orgId/cms/:type`). One controller fronts four Prisma models
 * addressed by the URL segment listed in `CMS_CONTENT_TYPES`.
 */

export const CMS_CONTENT_TYPES = [
  'pages',
  'services',
  'case-studies',
  'articles',
] as const;

export type CmsContentType = (typeof CMS_CONTENT_TYPES)[number];

export const CMS_LABEL: Record<CmsContentType, string> = {
  pages: 'Page',
  services: 'Service',
  'case-studies': 'Case study',
  articles: 'Article',
};

/** Mirrors the Prisma ContentStatus enum. */
export const CONTENT_STATUSES = [
  'DRAFT',
  'REVIEW',
  'PUBLISHED',
  'ARCHIVED',
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Normalised row shape returned by `CmsService.toView`. */
export interface CmsContentView {
  id: string;
  type: CmsContentType;
  title: string;
  slug: string;
  status: ContentStatus;
  excerpt: string | null;
  imageKey: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Type-specific columns (icon, sortOrder, client, challenge, tags, …). */
  extra: Record<string, unknown>;
}

/** `findOne` additionally returns the rich body. */
export interface CmsContentDetail extends CmsContentView {
  content: unknown;
}

/**
 * Superset payload mirroring CreateCmsContentDto. Per-type required fields are
 * enforced server-side by `CmsService.requireFields`:
 *  - services:     description
 *  - case-studies: challenge, solution
 */
export interface CmsContentInput {
  title: string;
  slug: string;
  status?: ContentStatus;
  content?: unknown;
  excerpt?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  client?: string;
  location?: string;
  mineralType?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  category?: string;
  tags?: string[];
  featuredImageKey?: string;
  imageKey?: string;
  seoTitle?: string;
  seoDesc?: string;
}

export type UpdateCmsContentInput = Partial<CmsContentInput>;

export interface CmsListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: ContentStatus;
}

/** Returns the full envelope so callers can read `meta` for pagination. */
export function useCmsContent(
  orgId: string,
  type: CmsContentType,
  params?: CmsListParams,
) {
  return useQuery<ApiResponse<CmsContentView[]>>({
    queryKey: QK.cms.all(orgId, type, params),
    queryFn: () =>
      get<CmsContentView[]>(`/organizations/${orgId}/cms/${type}`, { params }),
    enabled: !!orgId,
  });
}

export function useCmsEntry(
  orgId: string,
  type: CmsContentType,
  id: string | null,
) {
  return useQuery({
    queryKey: QK.cms.detail(orgId, type, id ?? ''),
    queryFn: () =>
      get<CmsContentDetail>(`/organizations/${orgId}/cms/${type}/${id}`).then(
        (r) => r.data,
      ),
    enabled: !!orgId && !!id,
  });
}

function cmsRoot(orgId: string, type: CmsContentType) {
  return ['orgs', orgId, 'cms', type] as const;
}

export function useCreateCmsContent(orgId: string, type: CmsContentType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CmsContentInput) =>
      post<CmsContentView>(`/organizations/${orgId}/cms/${type}`, data).then(
        (r) => r.data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: cmsRoot(orgId, type) }),
  });
}

export function useUpdateCmsContent(orgId: string, type: CmsContentType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCmsContentInput }) =>
      patch<CmsContentView>(
        `/organizations/${orgId}/cms/${type}/${id}`,
        data,
      ).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cmsRoot(orgId, type) }),
  });
}

/** PATCH :id/status — PUBLISHED stamps publishedAt, anything else clears it. */
export function useSetCmsStatus(orgId: string, type: CmsContentType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) =>
      patch<CmsContentView>(
        `/organizations/${orgId}/cms/${type}/${id}/status`,
        {
          status,
        },
      ).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cmsRoot(orgId, type) }),
  });
}

export function useDeleteCmsContent(orgId: string, type: CmsContentType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ message: string }>(
        `/organizations/${orgId}/cms/${type}/${id}`,
      ).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cmsRoot(orgId, type) }),
  });
}

/** Lowercase kebab-case slug, matching the DTO's @Matches pattern. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
