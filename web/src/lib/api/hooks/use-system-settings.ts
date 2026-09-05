'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post, del } from '../api-client';

export interface CompanyProfileSettings {
  legalName: string;
  registrationNumber: string;
  kraPin: string;
  miningLicenseNumber: string;
  officialEmail: string;
  phone: string;
  emergencyDispatchPhone: string;
  headquartersAddress: string;
  county: string;
  country: string;
  website: string;
  complianceSummary: string;
}

export interface MiningOperationsSettings {
  defaultRecoveryTargetPct: number;
  standardLeachingDurationHours: number;
  carbonTransferFrequencyHours: number;
  assayPrecisionDecimals: number;
  moistureDeductionBaselinePct: number;
  dayShiftStartTime: string;
  afternoonShiftStartTime: string;
  nightShiftStartTime: string;
  hseInspectionIntervalDays: number;
}

export interface FinanceSettings {
  primaryCurrency: string;
  currencySymbol: string;
  vatRatePct: number;
  withholdingTaxPct: number;
  defaultPaymentTerms: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  swiftCode: string;
  mpesaPaybill: string;
  etimsDisclaimer: string;
}

export interface NotificationChannelMatrix {
  emailRfqSubmissions: boolean;
  emailQuotationApprovals: boolean;
  emailHseIncidents: boolean;
  emailPlantAssessments: boolean;
  emailLowInventoryAlerts: boolean;
  smsEmergencySafetyAlarms: boolean;
  inAppWorkOrderUpdates: boolean;
  dispatchEmailRecipient: string;
}

export interface SecurityPolicySettings {
  autoLogoutEnabled: boolean;
  idleTimeoutMinutes: number;
  warningCountdownSeconds: number;
  enforceMfaForExecutives: boolean;
  minPasswordLength: number;
  passwordExpiryDays: number;
  ipAllowlist: string;
}

export interface SystemMaintenanceSettings {
  auditLogRetentionDays: string;
  automaticNightlyBackups: boolean;
  timezone: string;
  dateFormat: string;
}

export interface SystemSettingsView {
  companyProfile: CompanyProfileSettings;
  miningOperations: MiningOperationsSettings;
  finance: FinanceSettings;
  notifications: NotificationChannelMatrix;
  security: SecurityPolicySettings;
  maintenance: SystemMaintenanceSettings;
}

export interface ApiKeyView {
  id: string;
  name: string;
  keyPrefix: string;
  token?: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  status: 'ACTIVE' | 'REVOKED';
}

export interface WebhookView {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  lastStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | null;
}

export interface SystemDiagnosticsView {
  serverTime: string;
  uptimeSeconds: number;
  nodeVersion: string;
  database: {
    status: string;
    latencyMs: number;
    provider: string;
  };
  cache: {
    status: string;
    engine: string;
  };
  storage: {
    status: string;
    provider: string;
  };
  counts: {
    totalUsers: number;
    activeProjects: number;
    crmLeads: number;
    auditRecords: number;
  };
}

export const SETTINGS_QK = {
  all: (orgId: string) => ['organizations', orgId, 'system-settings'] as const,
  apiKeys: (orgId: string) => ['organizations', orgId, 'system-settings', 'api-keys'] as const,
  webhooks: (orgId: string) => ['organizations', orgId, 'system-settings', 'webhooks'] as const,
  diagnostics: (orgId: string) => ['organizations', orgId, 'system-settings', 'diagnostics'] as const,
};

// ─── Settings CRUD ─────────────────────────────────────────────────────────

export function useSystemSettings(orgId: string) {
  return useQuery({
    queryKey: SETTINGS_QK.all(orgId),
    queryFn: () =>
      get<SystemSettingsView>(`/organizations/${orgId}/system-settings`).then(
        (r) => r.data,
      ),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useUpdateSystemSettings(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SystemSettingsView>) =>
      patch<SystemSettingsView>(
        `/organizations/${orgId}/system-settings`,
        data,
      ).then((r) => r.data),
    onSuccess: (saved) => {
      qc.setQueryData(SETTINGS_QK.all(orgId), saved);
      qc.invalidateQueries({ queryKey: ['branches'] });
      qc.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

// ─── API Keys ───────────────────────────────────────────────────────────────

export function useApiKeys(orgId: string) {
  return useQuery({
    queryKey: SETTINGS_QK.apiKeys(orgId),
    queryFn: () =>
      get<ApiKeyView[]>(`/organizations/${orgId}/system-settings/api-keys`).then(
        (r) => r.data,
      ),
    enabled: !!orgId,
  });
}

export function useCreateApiKey(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; scopes: string[]; expiresInDays?: number }) =>
      post<ApiKeyView>(`/organizations/${orgId}/system-settings/api-keys`, data).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS_QK.apiKeys(orgId) });
    },
  });
}

export function useRevokeApiKey(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      del<{ message: string }>(
        `/organizations/${orgId}/system-settings/api-keys/${keyId}`,
      ).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS_QK.apiKeys(orgId) });
    },
  });
}

// ─── Webhooks ───────────────────────────────────────────────────────────────

export function useWebhooks(orgId: string) {
  return useQuery({
    queryKey: SETTINGS_QK.webhooks(orgId),
    queryFn: () =>
      get<WebhookView[]>(`/organizations/${orgId}/system-settings/webhooks`).then(
        (r) => r.data,
      ),
    enabled: !!orgId,
  });
}

export function useCreateWebhook(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string; events: string[]; secret?: string }) =>
      post<WebhookView>(`/organizations/${orgId}/system-settings/webhooks`, data).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS_QK.webhooks(orgId) });
    },
  });
}

export function useDeleteWebhook(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ message: string }>(
        `/organizations/${orgId}/system-settings/webhooks/${id}`,
      ).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS_QK.webhooks(orgId) });
    },
  });
}

export function useTestWebhook(orgId: string) {
  return useMutation({
    mutationFn: (data: { url: string; event: string }) =>
      post<{ status: number; delivered: boolean; message: string; payload: any }>(
        `/organizations/${orgId}/system-settings/webhooks/test`,
        data,
      ).then((r) => r.data),
  });
}

// ─── Diagnostics & Telemetry ───────────────────────────────────────────────

export function useSystemDiagnostics(orgId: string) {
  return useQuery({
    queryKey: SETTINGS_QK.diagnostics(orgId),
    queryFn: () =>
      get<SystemDiagnosticsView>(
        `/organizations/${orgId}/system-settings/diagnostics`,
      ).then((r) => r.data),
    enabled: !!orgId,
    refetchInterval: 30_000,
  });
}

export function useSendTestAlert(orgId: string) {
  return useMutation({
    mutationFn: (data: { channel: 'EMAIL' | 'IN_APP' | 'SMS'; recipient: string; message?: string }) =>
      post<{ success: boolean; message: string; dispatchedAt: string }>(
        `/organizations/${orgId}/system-settings/test-alert`,
        data,
      ).then((r) => r.data),
  });
}

export function usePurgeCache(orgId: string) {
  return useMutation({
    mutationFn: () =>
      post<{ success: boolean; message: string; timestamp: string }>(
        `/organizations/${orgId}/system-settings/purge-cache`,
      ).then((r) => r.data),
  });
}
