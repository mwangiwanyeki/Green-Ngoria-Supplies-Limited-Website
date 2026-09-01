'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

/**
 * Consultations are a sub-resource of a lead:
 * `POST /organizations/:orgId/leads/:leadId/consultations`
 * (`src/module/leads/leads.controller.ts`).
 *
 * The backend exposes no aggregate list / update / delete for consultations —
 * they are only returned inside a lead detail (`GET .../leads/:id`), so the
 * admin list derives its rows from lead details and only creation is wired.
 */

export interface ConsultationRow {
  id: string;
  leadId: string;
  leadReference: string;
  leadCompanyName: string;
  leadContactName: string;
  scheduledAt: string;
  completedAt: string | null;
  type: string;
  location: string | null;
  notes: string | null;
  outcome: string | null;
  nextSteps: string | null;
  createdAt: string;
}

interface LeadWithConsultations {
  id: string;
  reference: string;
  companyName: string;
  contactName: string;
  consultations?: Array<{
    id: string;
    leadId: string;
    scheduledAt: string;
    completedAt: string | null;
    type: string;
    location: string | null;
    notes: string | null;
    outcome: string | null;
    nextSteps: string | null;
    createdAt: string;
  }>;
}

/**
 * Flattens every lead's consultations into one list. There is no aggregate
 * endpoint, so this fans out one detail request per lead that reports at least
 * one consultation in its `_count`.
 */
export function useConsultationsForLeads(orgId: string, leadIds: string[]) {
  const results = useQueries({
    queries: leadIds.map((leadId) => ({
      queryKey: QK.leads.detail(orgId, leadId),
      queryFn: () =>
        get<LeadWithConsultations>(
          `/organizations/${orgId}/leads/${leadId}`,
        ).then((r) => r.data),
      enabled: !!orgId && !!leadId,
    })),
  });

  const rows: ConsultationRow[] = [];
  for (const result of results) {
    const lead = result.data;
    if (!lead?.consultations) continue;
    for (const consultation of lead.consultations) {
      rows.push({
        ...consultation,
        leadId: lead.id,
        leadReference: lead.reference,
        leadCompanyName: lead.companyName,
        leadContactName: lead.contactName,
      });
    }
  }

  return {
    data: rows,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  };
}

export function useCreateConsultation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: unknown }) =>
      post(`/organizations/${orgId}/leads/${leadId}/consultations`, data).then(
        (r) => r.data,
      ),
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({
        queryKey: QK.leads.detail(orgId, variables.leadId),
      });
      void qc.invalidateQueries({ queryKey: QK.leads.all(orgId) });
      void qc.invalidateQueries({ queryKey: QK.consultations.all(orgId) });
    },
  });
}
