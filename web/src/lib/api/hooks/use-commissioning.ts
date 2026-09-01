'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

export function useCommissioningSystems<T = unknown>(
  orgId: string,
  projectId: string,
) {
  return useQuery({
    queryKey: QK.commissioning.all(orgId, projectId),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/commissioning/systems`, {
        params: { projectId },
      }).then((r) => r.data),
    enabled: !!orgId && !!projectId,
  });
}

export interface CommissioningProgress {
  systems: number;
  total: number;
  passed: number;
  failed: number;
  approved: number;
  pending: number;
  completionPct: number;
  canHandover: boolean;
}

export function useCommissioningProgress(orgId: string, projectId: string) {
  return useQuery({
    queryKey: ['orgs', orgId, 'commissioning', 'progress', projectId],
    queryFn: () =>
      get<CommissioningProgress>(
        `/organizations/${orgId}/commissioning/progress`,
        { params: { projectId } },
      ).then((r) => r.data),
    enabled: !!orgId && !!projectId,
  });
}

export function useCreateCommissioningSystem(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/commissioning/systems`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'commissioning'] }),
  });
}

export function useAddCommissioningTest(orgId: string, systemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(
        `/organizations/${orgId}/commissioning/systems/${systemId}/tests`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'commissioning'] }),
  });
}

export function useRecordTestResult(orgId: string, testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      result: string;
      readings?: Record<string, unknown>;
      findings?: string;
    }) =>
      post(
        `/organizations/${orgId}/commissioning/tests/${testId}/result`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'commissioning'] }),
  });
}

export function useApproveCommissioningTest(orgId: string, testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(
        `/organizations/${orgId}/commissioning/tests/${testId}/approve`,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'commissioning'] }),
  });
}

/** Adds a test to a system chosen at call time. */
export function useAddTestToSystem(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ systemId, data }: { systemId: string; data: unknown }) =>
      post(
        `/organizations/${orgId}/commissioning/systems/${systemId}/tests`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'commissioning'] }),
  });
}

/** Records a result on a test chosen at call time. */
export function useRecordTestResultById(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      testId,
      result,
      findings,
    }: {
      testId: string;
      result: string;
      findings?: string;
    }) =>
      post(`/organizations/${orgId}/commissioning/tests/${testId}/result`, {
        result,
        ...(findings ? { findings } : {}),
      }).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'commissioning'] }),
  });
}
