'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, upload } from '../api-client';
import { QK } from '../query-keys';

export function useDocuments<T = unknown>(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.documents.all(orgId, params),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/engineering/documents`, {
        params,
      }).then((r) => r),
    enabled: !!orgId,
  });
}

export function useDocument(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.documents.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/engineering/documents/${id}`).then(
        (r) => r.data,
      ),
    enabled: !!orgId && !!id,
  });
}

export function useDocumentDownloadUrl(orgId: string, id: string) {
  return useQuery({
    queryKey: ['orgs', orgId, 'engineering', 'documents', id, 'download'],
    queryFn: () =>
      get<{ url: string; expiresIn: number }>(
        `/organizations/${orgId}/engineering/documents/${id}/download`,
      ).then((r) => r.data),
    enabled: false, // fetch on demand only
    staleTime: 50 * 60_000, // signed URL valid 1 hour
  });
}

export function useUploadDocument(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      meta,
    }: {
      file: File;
      meta: Record<string, string>;
    }) => {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(meta).forEach(([k, v]) => fd.append(k, v));
      return upload(`/organizations/${orgId}/engineering/documents`, fd).then(
        (r) => r.data,
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.documents.all(orgId) }),
  });
}

export function useTransitionDocument(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      post(`/organizations/${orgId}/engineering/documents/${id}/transition`, {
        status,
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.documents.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.documents.all(orgId) });
    },
  });
}

export function useUploadDocumentRevision(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      revision,
      reason,
    }: {
      file: File;
      revision: string;
      reason: string;
    }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('revision', revision);
      fd.append('reason', reason);
      return upload(
        `/organizations/${orgId}/engineering/documents/${id}/revise`,
        fd,
      ).then((r) => r.data);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.documents.detail(orgId, id) }),
  });
}
