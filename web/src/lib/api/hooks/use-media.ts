'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch, del, upload, type ApiResponse } from '../api-client';
import { QK } from '../query-keys';

/**
 * Media library — backed by `src/module/media/media.controller.ts`
 * (`/organizations/:orgId/media`).
 *
 * Upload is a plain multipart POST with the binary under the `file` field
 * (`FileInterceptor('file')`) — there is no signed-URL handshake. Optional
 * `filename`, `altText`, `width` and `height` ride along as form fields.
 */

export interface MediaAssetView {
  id: string;
  organizationId: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  uploadedById: string;
  uploadedBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
  /** Time-limited download URL signed by the backend; null if signing failed. */
  url: string | null;
}

export interface MediaListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Exact MIME type ("image/png") or family ("image"). */
  mimeType?: string;
}

export interface UploadMediaInput {
  file: File;
  filename?: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface UpdateMediaInput {
  filename?: string;
  altText?: string;
}

/** Returns the full envelope so callers can read `meta` for pagination. */
export function useMediaAssets(orgId: string, params?: MediaListParams) {
  return useQuery<ApiResponse<MediaAssetView[]>>({
    queryKey: QK.media.all(orgId, params),
    queryFn: () =>
      get<MediaAssetView[]>(`/organizations/${orgId}/media`, { params }),
    enabled: !!orgId,
  });
}

export function useMediaAsset(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.media.detail(orgId, id),
    queryFn: () =>
      get<MediaAssetView>(`/organizations/${orgId}/media/${id}`).then(
        (r) => r.data,
      ),
    enabled: !!orgId && !!id,
  });
}

export function useUploadMedia(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadMediaInput) => {
      const form = new FormData();
      form.append('file', input.file);
      if (input.filename?.trim())
        form.append('filename', input.filename.trim());
      if (input.altText?.trim()) form.append('altText', input.altText.trim());
      if (input.width) form.append('width', String(input.width));
      if (input.height) form.append('height', String(input.height));
      return upload<MediaAssetView>(`/organizations/${orgId}/media`, form).then(
        (r) => r.data,
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'media'] }),
  });
}

export function useUpdateMedia(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMediaInput }) =>
      patch<MediaAssetView>(`/organizations/${orgId}/media/${id}`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'media'] }),
  });
}

export function useDeleteMedia(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ message: string }>(`/organizations/${orgId}/media/${id}`).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'media'] }),
  });
}

/**
 * Read an image file's intrinsic dimensions in the browser so the upload can
 * populate MediaAsset.width/height. Resolves to null for non-images.
 */
export function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/') || typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}
