'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, upload } from '../api-client';
import { QK } from '../query-keys';

export function useAssessments(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.assessments.all(orgId, params),
    queryFn: () => get(`/organizations/${orgId}/plant-assessments`, { params }),
    enabled: !!orgId,
  });
}

export function useAssessment(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.assessments.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/plant-assessments/${id}`).then(
        (r) => r.data,
      ),
    enabled: !!orgId && !!id,
  });
}

export function useCreateAssessment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/plant-assessments`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.assessments.all(orgId) }),
  });
}

export function useUpdateAssessment(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/organizations/${orgId}/plant-assessments/${id}`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.assessments.detail(orgId, id) }),
  });
}

export function useSubmitAssessment(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/plant-assessments/${id}/submit`).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.assessments.detail(orgId, id) }),
  });
}

export function useTransitionAssessment(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; assignedEngineerId?: string }) =>
      post(
        `/organizations/${orgId}/plant-assessments/${id}/transition`,
        data,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.assessments.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.assessments.all(orgId) });
    },
  });
}

export function useAddFinding(orgId: string, assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(
        `/organizations/${orgId}/plant-assessments/${assessmentId}/findings`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: QK.assessments.detail(orgId, assessmentId),
      }),
  });
}

export function useAddRecommendation(orgId: string, assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(
        `/organizations/${orgId}/plant-assessments/${assessmentId}/recommendations`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: QK.assessments.detail(orgId, assessmentId),
      }),
  });
}

export function useApproveRecommendation(
  orgId: string,
  assessmentId: string,
  recId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(
        `/organizations/${orgId}/plant-assessments/${assessmentId}/recommendations/${recId}/approve`,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: QK.assessments.detail(orgId, assessmentId),
      }),
  });
}

export function useUploadAssessmentAttachment(
  orgId: string,
  assessmentId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      description,
    }: {
      file: File;
      description?: string;
    }) => {
      const fd = new FormData();
      fd.append('file', file);
      if (description) fd.append('description', description);
      return upload(
        `/organizations/${orgId}/plant-assessments/${assessmentId}/attachments`,
        fd,
      ).then((r) => r.data);
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: QK.assessments.detail(orgId, assessmentId),
      }),
  });
}

// ─── List-friendly assessment mutations ───────────────────────────────────

/** PATCHes an assessment chosen at call time (UpdateAssessmentDto is partial). */
export function useUpdateAssessmentById(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      patch(`/organizations/${orgId}/plant-assessments/${id}`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.assessments.all(orgId) }),
  });
}

/** Submits a DRAFT assessment for review, by row id. */
export function useSubmitAssessmentById(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post(`/organizations/${orgId}/plant-assessments/${id}/submit`).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.assessments.all(orgId) }),
  });
}

/** Advances an assessment through AssessmentStatus, by row id. */
export function useTransitionAssessmentById(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      assignedEngineerId,
    }: {
      id: string;
      status: string;
      assignedEngineerId?: string;
    }) =>
      post(`/organizations/${orgId}/plant-assessments/${id}/transition`, {
        status,
        ...(assignedEngineerId ? { assignedEngineerId } : {}),
      }).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.assessments.all(orgId) }),
  });
}
