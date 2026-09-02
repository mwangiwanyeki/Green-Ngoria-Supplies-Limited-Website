'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  DollarSign,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Webhook,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuthStore } from '@/stores/auth-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { cn, formatRelativeDate } from '@/lib/utils';
import {
  useSystemSettings,
  useUpdateSystemSettings,
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useSystemDiagnostics,
  useSendTestAlert,
  usePurgeCache,
  type SystemSettingsView,
  type ApiKeyView,
  type WebhookView,
} from '@/lib/api/hooks/use-system-settings';

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'TZS', 'UGX', 'RWF'] as const;
const IDLE_PRESETS = [5, 10, 15, 30, 60, 120] as const;
const WEBHOOK_EVENTS = [
  'lead.created',
  'lead.updated',
  'quotation.approved',
  'quotation.rejected',
  'project.milestone',
  'invoice.issued',
  'invoice.paid',
  'hse.incident',
  'assessment.completed',
] as const;
const API_KEY_SCOPES = [
  'read:leads',
  'write:leads',
  'read:projects',
  'write:projects',
  'read:quotations',
  'write:quotations',
  'read:inventory',
  'write:inventory',
  'read:reports',
  'admin:all',
] as const;

// ── Main ────────────────────────────────────────────────────────────────────

export function AdminSettings() {
  const orgId = useAuthStore((s) => s.user?.organizationId);

  if (!orgId) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Settings"
          description="Enterprise system settings."
        />
        <ErrorState
          title="Organization context unavailable"
          description="Your account is not associated with an organization. Contact a Super Admin to assign membership."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="System Settings"
        description="Company profile, finance, notifications, security policy, integrations and diagnostics. Changes apply org-wide and are persisted to the database — the public site reads the company profile directly."
      />
      <Tabs defaultValue="company">
        <TabsList className="flex-wrap">
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="finance">
            <DollarSign className="mr-2 h-4 w-4" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="apikeys">
            <KeyRound className="mr-2 h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="mr-2 h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="diagnostics">
            <Activity className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <CompanyProfileForm orgId={orgId} />
        </TabsContent>
        <TabsContent value="finance" className="mt-6">
          <FinanceForm orgId={orgId} />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsForm orgId={orgId} />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityForm orgId={orgId} />
        </TabsContent>
        <TabsContent value="apikeys" className="mt-6">
          <ApiKeysPanel orgId={orgId} />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-6">
          <WebhooksPanel orgId={orgId} />
        </TabsContent>
        <TabsContent value="diagnostics" className="mt-6">
          <DiagnosticsPanel orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Shared helpers ──────────────────────────────────────────────────────────

/**
 * Loads unified settings and returns the section slice + a save handler that
 * dispatches only that slice (backend accepts partial updates so we never
 * clobber a section the user didn't touch).
 */
function useSettingsSection<K extends keyof SystemSettingsView>(
  orgId: string,
  key: K,
) {
  const query = useSystemSettings(orgId);
  const update = useUpdateSystemSettings(orgId);

  return {
    initial: query.data?.[key],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    save: (partial: Partial<SystemSettingsView[K]>) =>
      update.mutateAsync({ [key]: partial } as Partial<SystemSettingsView>),
    saving: update.isPending,
  };
}

// ── Company profile ────────────────────────────────────────────────────────

function CompanyProfileForm({ orgId }: { orgId: string }) {
  const { initial, isLoading, isError, error, refetch, save, saving } =
    useSettingsSection(orgId, 'companyProfile');
  const [v, setV] = useState<Partial<SystemSettingsView['companyProfile']>>({});
  useEffect(() => {
    if (initial) setV(initial);
  }, [initial]);

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(error)} retry={() => void refetch()} />;

  const bind = (k: keyof SystemSettingsView['companyProfile']) => ({
    value: (v[k] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setV((prev) => ({ ...prev, [k]: e.target.value })),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company profile</CardTitle>
        <CardDescription>
          Legal identity, contact and compliance. The public marketing site
          reads these fields directly — updates take effect on next request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save(v).then(
              () => toast.success('Company profile saved'),
              (err) => toast.error(getApiErrorMessage(err, 'Save failed')),
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Legal name">
              <Input {...bind('legalName')} />
            </FieldRow>
            <FieldRow label="Website">
              <Input type="url" placeholder="https://…" {...bind('website')} />
            </FieldRow>
            <FieldRow label="Registration number">
              <Input {...bind('registrationNumber')} />
            </FieldRow>
            <FieldRow label="KRA PIN">
              <Input {...bind('kraPin')} />
            </FieldRow>
            <FieldRow label="Mining license number">
              <Input {...bind('miningLicenseNumber')} />
            </FieldRow>
            <FieldRow label="Country">
              <Input {...bind('country')} />
            </FieldRow>
            <FieldRow label="Official email">
              <Input type="email" {...bind('officialEmail')} />
            </FieldRow>
            <FieldRow label="Main phone">
              <Input type="tel" {...bind('phone')} />
            </FieldRow>
            <FieldRow label="Emergency / dispatch phone">
              <Input type="tel" {...bind('emergencyDispatchPhone')} />
            </FieldRow>
            <FieldRow label="County">
              <Input {...bind('county')} />
            </FieldRow>
            <FieldRow label="Headquarters address" className="sm:col-span-2">
              <Input {...bind('headquartersAddress')} />
            </FieldRow>
            <FieldRow label="Compliance summary" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={(v.complianceSummary as string) ?? ''}
                onChange={(e) =>
                  setV((prev) => ({ ...prev, complianceSummary: e.target.value }))
                }
                placeholder="e.g. ISO 9001:2015, ISO 14001:2015, OHSAS 18001 certified"
              />
            </FieldRow>
          </div>
          <SaveBar saving={saving} label="Save company profile" />
        </form>
      </CardContent>
    </Card>
  );
}

// ── Finance ─────────────────────────────────────────────────────────────────

function FinanceForm({ orgId }: { orgId: string }) {
  const { initial, isLoading, isError, error, refetch, save, saving } =
    useSettingsSection(orgId, 'finance');
  const [v, setV] = useState<Partial<SystemSettingsView['finance']>>({});
  useEffect(() => {
    if (initial) setV(initial);
  }, [initial]);

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(error)} retry={() => void refetch()} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance &amp; billing</CardTitle>
        <CardDescription>
          Currency, tax and bank details used by POS receipts, invoices and
          quotations. Changes propagate the next time a document is generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save({
              ...v,
              vatRatePct: Number(v.vatRatePct ?? 0),
              withholdingTaxPct: Number(v.withholdingTaxPct ?? 0),
            }).then(
              () => toast.success('Finance settings saved'),
              (err) => toast.error(getApiErrorMessage(err, 'Save failed')),
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldRow label="Primary currency">
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
                value={v.primaryCurrency ?? 'KES'}
                onChange={(e) => setV((p) => ({ ...p, primaryCurrency: e.target.value }))}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Currency symbol">
              <Input
                value={v.currencySymbol ?? ''}
                onChange={(e) => setV((p) => ({ ...p, currencySymbol: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="VAT rate (%)">
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={String(v.vatRatePct ?? 0)}
                onChange={(e) => setV((p) => ({ ...p, vatRatePct: Number(e.target.value) }))}
              />
            </FieldRow>
            <FieldRow label="Withholding tax (%)">
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={String(v.withholdingTaxPct ?? 0)}
                onChange={(e) => setV((p) => ({ ...p, withholdingTaxPct: Number(e.target.value) }))}
              />
            </FieldRow>
            <FieldRow label="Default payment terms">
              <Input
                placeholder="e.g. Net 30"
                value={v.defaultPaymentTerms ?? ''}
                onChange={(e) => setV((p) => ({ ...p, defaultPaymentTerms: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="M-PESA paybill">
              <Input
                value={v.mpesaPaybill ?? ''}
                onChange={(e) => setV((p) => ({ ...p, mpesaPaybill: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="Bank name">
              <Input
                value={v.bankName ?? ''}
                onChange={(e) => setV((p) => ({ ...p, bankName: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="Bank branch">
              <Input
                value={v.bankBranch ?? ''}
                onChange={(e) => setV((p) => ({ ...p, bankBranch: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="Account number">
              <Input
                value={v.bankAccountNumber ?? ''}
                onChange={(e) => setV((p) => ({ ...p, bankAccountNumber: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="SWIFT code">
              <Input
                value={v.swiftCode ?? ''}
                onChange={(e) => setV((p) => ({ ...p, swiftCode: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="eTIMS receipt disclaimer" className="sm:col-span-3">
              <Textarea
                rows={2}
                placeholder="Statutory footer printed on VAT receipts…"
                value={v.etimsDisclaimer ?? ''}
                onChange={(e) => setV((p) => ({ ...p, etimsDisclaimer: e.target.value }))}
              />
            </FieldRow>
          </div>
          <SaveBar saving={saving} label="Save finance settings" />
        </form>
      </CardContent>
    </Card>
  );
}

// ── Notifications ───────────────────────────────────────────────────────────

function NotificationsForm({ orgId }: { orgId: string }) {
  const { initial, isLoading, isError, error, refetch, save, saving } =
    useSettingsSection(orgId, 'notifications');
  const [v, setV] = useState<Partial<SystemSettingsView['notifications']>>({});
  useEffect(() => {
    if (initial) setV(initial);
  }, [initial]);

  const sendTest = useSendTestAlert(orgId);

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(error)} retry={() => void refetch()} />;

  const toggle = (k: keyof SystemSettingsView['notifications']) =>
    setV((p) => ({ ...p, [k]: !p[k] }));

  const channels: Array<{ key: keyof SystemSettingsView['notifications']; label: string; hint: string; medium: 'Email' | 'SMS' | 'In-App' }> = [
    { key: 'emailRfqSubmissions', label: 'RFQ submissions', hint: 'A client submits a new request for quotation.', medium: 'Email' },
    { key: 'emailQuotationApprovals', label: 'Quotation approvals', hint: 'A quotation is approved or declined.', medium: 'Email' },
    { key: 'emailPlantAssessments', label: 'Plant assessments', hint: 'A new plant assessment is submitted.', medium: 'Email' },
    { key: 'emailHseIncidents', label: 'HSE incidents', hint: 'Any HSE incident is logged on site.', medium: 'Email' },
    { key: 'emailLowInventoryAlerts', label: 'Low inventory alerts', hint: 'Stock drops to or below reorder level.', medium: 'Email' },
    { key: 'smsEmergencySafetyAlarms', label: 'Emergency safety alarms', hint: 'HSE incident of severity ≥ HIGH.', medium: 'SMS' },
    { key: 'inAppWorkOrderUpdates', label: 'Work order updates', hint: 'Maintenance work order transitions state.', medium: 'In-App' },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Notification channels</CardTitle>
          <CardDescription>
            Toggle which events dispatch to which channel. Recipients are
            derived per event from the organization&apos;s role assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              save(v).then(
                () => toast.success('Notification settings saved'),
                (err) => toast.error(getApiErrorMessage(err, 'Save failed')),
              );
            }}
          >
            <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
              {channels.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 bg-card p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{row.label}</span>
                      <Badge variant="outline" className="text-[10px]">{row.medium}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.hint}</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={!!v[row.key]}
                      onChange={() => toggle(row.key)}
                    />
                  </label>
                </li>
              ))}
            </ul>

            <FieldRow
              label="Dispatch email recipient"
              hint="Fallback address used when a specific role recipient can't be resolved."
            >
              <Input
                type="email"
                placeholder="alerts@greenngoria.com"
                value={v.dispatchEmailRecipient ?? ''}
                onChange={(e) => setV((p) => ({ ...p, dispatchEmailRecipient: e.target.value }))}
              />
            </FieldRow>

            <SaveBar saving={saving} label="Save notification settings" />
          </form>
        </CardContent>
      </Card>

      <TestAlertCard orgId={orgId} sendTest={sendTest} />
    </div>
  );
}

function TestAlertCard({
  orgId,
  sendTest,
}: {
  orgId: string;
  sendTest: ReturnType<typeof useSendTestAlert>;
}) {
  void orgId;
  const [channel, setChannel] = useState<'EMAIL' | 'SMS' | 'IN_APP'>('EMAIL');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('This is a Green Ngoria diagnostic test alert.');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a test alert</CardTitle>
        <CardDescription>
          Verify a channel end-to-end without waiting for a real event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldRow label="Channel">
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
              value={channel}
              onChange={(e) => setChannel(e.target.value as typeof channel)}
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="IN_APP">In-app</option>
            </select>
          </FieldRow>
          <FieldRow label="Recipient" className="sm:col-span-2">
            <Input
              placeholder={channel === 'EMAIL' ? 'someone@example.com' : channel === 'SMS' ? '+254 7…' : 'userId or email'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="Message" className="sm:col-span-3">
            <Textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </FieldRow>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            leftIcon={<Send className="h-4 w-4" />}
            loading={sendTest.isPending}
            disabled={!recipient}
            onClick={() => {
              sendTest.mutate(
                { channel, recipient, message },
                {
                  onSuccess: (r) => toast.success(r.message ?? 'Alert dispatched'),
                  onError: (err) => toast.error(getApiErrorMessage(err, 'Dispatch failed')),
                },
              );
            }}
          >
            Send test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Security ────────────────────────────────────────────────────────────────

function SecurityForm({ orgId }: { orgId: string }) {
  const { initial, isLoading, isError, error, refetch, save, saving } =
    useSettingsSection(orgId, 'security');
  const [v, setV] = useState<Partial<SystemSettingsView['security']>>({});
  useEffect(() => {
    if (initial) setV(initial);
  }, [initial]);

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(error)} retry={() => void refetch()} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security policy</CardTitle>
        <CardDescription>
          Session lifetime, MFA enforcement for privileged roles, password
          strength and IP allowlisting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save({
              ...v,
              idleTimeoutMinutes: Number(v.idleTimeoutMinutes ?? 120),
              warningCountdownSeconds: Number(v.warningCountdownSeconds ?? 60),
              minPasswordLength: Number(v.minPasswordLength ?? 12),
              passwordExpiryDays: Number(v.passwordExpiryDays ?? 0),
            }).then(
              () => toast.success('Security policy saved'),
              (err) => toast.error(getApiErrorMessage(err, 'Save failed')),
            );
          }}
        >
          <label className="flex items-start gap-3 rounded-md border border-border p-3">
            <input
              type="checkbox"
              checked={!!v.autoLogoutEnabled}
              onChange={(e) => setV((p) => ({ ...p, autoLogoutEnabled: e.target.checked }))}
              className="mt-1 h-4 w-4"
            />
            <div>
              <div className="text-sm font-semibold">Auto-logout when idle</div>
              <p className="text-xs text-muted-foreground">Ends the session if there is no mouse, keyboard or touch activity.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-md border border-border p-3">
            <input
              type="checkbox"
              checked={!!v.enforceMfaForExecutives}
              onChange={(e) => setV((p) => ({ ...p, enforceMfaForExecutives: e.target.checked }))}
              className="mt-1 h-4 w-4"
            />
            <div>
              <div className="text-sm font-semibold">Enforce MFA for privileged roles</div>
              <p className="text-xs text-muted-foreground">Executives, engineers and finance officers land on MFA setup at first login until they enrol.</p>
            </div>
          </label>

          <FieldRow label="Idle timeout preset">
            <div className="flex flex-wrap gap-2">
              {IDLE_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setV((p) => ({ ...p, idleTimeoutMinutes: m }))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    v.idleTimeoutMinutes === m
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {m < 60 ? `${m} min` : `${m / 60} hr`}
                </button>
              ))}
            </div>
          </FieldRow>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldRow label="Idle timeout (minutes)" hint="1–480">
              <Input
                type="number"
                min={1}
                max={480}
                value={String(v.idleTimeoutMinutes ?? 120)}
                onChange={(e) => setV((p) => ({ ...p, idleTimeoutMinutes: Number(e.target.value) }))}
              />
            </FieldRow>
            <FieldRow label="Warning countdown (s)" hint="10–300">
              <Input
                type="number"
                min={10}
                max={300}
                value={String(v.warningCountdownSeconds ?? 60)}
                onChange={(e) => setV((p) => ({ ...p, warningCountdownSeconds: Number(e.target.value) }))}
              />
            </FieldRow>
            <FieldRow label="Min password length" hint="8–128">
              <Input
                type="number"
                min={8}
                max={128}
                value={String(v.minPasswordLength ?? 12)}
                onChange={(e) => setV((p) => ({ ...p, minPasswordLength: Number(e.target.value) }))}
              />
            </FieldRow>
            <FieldRow label="Password expiry (days)" hint="0 = never">
              <Input
                type="number"
                min={0}
                value={String(v.passwordExpiryDays ?? 0)}
                onChange={(e) => setV((p) => ({ ...p, passwordExpiryDays: Number(e.target.value) }))}
              />
            </FieldRow>
            <FieldRow label="IP allowlist" hint="Comma-separated CIDRs; blank = any" className="sm:col-span-2">
              <Input
                placeholder="192.168.1.0/24, 10.0.0.0/8"
                value={v.ipAllowlist ?? ''}
                onChange={(e) => setV((p) => ({ ...p, ipAllowlist: e.target.value }))}
              />
            </FieldRow>
          </div>

          <SaveBar saving={saving} label="Save security policy" />
        </form>
      </CardContent>
    </Card>
  );
}

// ── API keys ────────────────────────────────────────────────────────────────

function ApiKeysPanel({ orgId }: { orgId: string }) {
  const { data, isLoading, isError, error, refetch } = useApiKeys(orgId);
  const create = useCreateApiKey(orgId);
  const revoke = useRevokeApiKey(orgId);
  const [openCreate, setOpenCreate] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyView | null>(null);
  const [freshToken, setFreshToken] = useState<ApiKeyView | null>(null);

  const keys = data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(error)} retry={() => void refetch()} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Developer API keys</CardTitle>
          <CardDescription>
            Bearer tokens for calling the Green Ngoria API from external
            systems. The full token is shown only at creation time — copy it
            now, we don&apos;t store the plaintext.
          </CardDescription>
        </div>
        <Button
          variant="brand"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setOpenCreate(true)}
        >
          Create key
        </Button>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="h-6 w-6" />}
            title="No API keys yet"
            description="Create one to start integrating external systems."
          />
        ) : (
          <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 bg-card p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{k.name}</span>
                    <Badge variant={k.status === 'ACTIVE' ? 'success' : 'destructive'}>
                      {k.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{k.keyPrefix}…</code>
                    <span>·</span>
                    <span>Created {formatRelativeDate(k.createdAt)}</span>
                    {k.lastUsedAt && (
                      <>
                        <span>·</span>
                        <span>Last used {formatRelativeDate(k.lastUsedAt)}</span>
                      </>
                    )}
                    {k.expiresAt && (
                      <>
                        <span>·</span>
                        <span>Expires {formatRelativeDate(k.expiresAt)}</span>
                      </>
                    )}
                  </div>
                  {k.scopes?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {k.status === 'ACTIVE' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Revoke"
                    onClick={() => setRevokeTarget(k)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CreateApiKeyDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        pending={create.isPending}
        onCreate={async (payload) => {
          try {
            const key = await create.mutateAsync(payload);
            setOpenCreate(false);
            setFreshToken(key);
            toast.success('API key created');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not create key'));
          }
        }}
      />

      {freshToken && <RevealTokenDialog apiKey={freshToken} onClose={() => setFreshToken(null)} />}

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
        title={`Revoke API key "${revokeTarget?.name}"?`}
        description="Any external system using this token will start receiving 401 Unauthorized immediately."
        confirmLabel="Revoke"
        destructive
        loading={revoke.isPending}
        onConfirm={() => {
          if (!revokeTarget) return;
          revoke.mutate(revokeTarget.id, {
            onSuccess: () => {
              toast.success('Key revoked');
              setRevokeTarget(null);
            },
            onError: (err) => toast.error(getApiErrorMessage(err, 'Revoke failed')),
          });
        }}
      />
    </Card>
  );
}

function CreateApiKeyDialog({
  open,
  onOpenChange,
  pending,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pending: boolean;
  onCreate: (v: { name: string; scopes: string[]; expiresInDays?: number }) => void;
}) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');

  useEffect(() => {
    if (!open) {
      setName('');
      setScopes([]);
      setExpiresInDays('');
    }
  }, [open]);

  const toggle = (s: string) =>
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>Pick scopes and (optionally) an expiry. The full token is shown once.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FieldRow label="Key name">
            <Input placeholder="e.g. Zapier integration" value={name} onChange={(e) => setName(e.target.value)} />
          </FieldRow>
          <FieldRow label="Scopes" hint="Pick the smallest set that will work.">
            <div className="flex flex-wrap gap-2">
              {API_KEY_SCOPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-mono transition-colors',
                    scopes.includes(s)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Expires in (days)" hint="Blank = no expiry">
            <Input
              type="number"
              min={1}
              value={expiresInDays === '' ? '' : String(expiresInDays)}
              onChange={(e) => setExpiresInDays(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </FieldRow>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="brand"
            loading={pending}
            disabled={!name || scopes.length === 0}
            onClick={() =>
              onCreate({
                name,
                scopes,
                expiresInDays: expiresInDays === '' ? undefined : expiresInDays,
              })
            }
          >
            Create key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevealTokenDialog({ apiKey, onClose }: { apiKey: ApiKeyView; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const value = apiKey.token ?? '';
  const masked = value ? `${value.slice(0, 8)}${'•'.repeat(Math.max(0, value.length - 12))}${value.slice(-4)}` : '';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy your new API key</DialogTitle>
          <DialogDescription>
            This is the only time the full token is shown. Store it in your
            secret manager before closing this dialog.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-hairline bg-muted/40 p-3 font-mono text-sm break-all">
          {shown ? value : masked || value}
        </div>
        <DialogFooter>
          <Button variant="ghost" leftIcon={shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} onClick={() => setShown((s) => !s)}>
            {shown ? 'Hide' : 'Reveal'}
          </Button>
          <Button
            variant="outline"
            leftIcon={copied ? <CheckCircle2 className="h-4 w-4 text-brand-500" /> : <Copy className="h-4 w-4" />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                toast.error('Copy failed — select and copy manually');
              }
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="brand" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Webhooks ────────────────────────────────────────────────────────────────

function WebhooksPanel({ orgId }: { orgId: string }) {
  const { data, isLoading, isError, error, refetch } = useWebhooks(orgId);
  const create = useCreateWebhook(orgId);
  const del = useDeleteWebhook(orgId);
  const test = useTestWebhook(orgId);
  const [openCreate, setOpenCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebhookView | null>(null);

  const hooks = data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(error)} retry={() => void refetch()} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Webhook endpoints</CardTitle>
          <CardDescription>
            Get notified in real time when events fire — POSTs a signed JSON
            payload to each registered URL.
          </CardDescription>
        </div>
        <Button
          variant="brand"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setOpenCreate(true)}
        >
          Add webhook
        </Button>
      </CardHeader>
      <CardContent>
        {hooks.length === 0 ? (
          <EmptyState
            icon={<Webhook className="h-6 w-6" />}
            title="No webhook endpoints"
            description="Add one to stream event notifications to your systems."
          />
        ) : (
          <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
            {hooks.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 bg-card p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{h.name}</span>
                    <Badge variant={h.isActive ? 'success' : 'mineral'}>
                      {h.isActive ? 'active' : 'inactive'}
                    </Badge>
                    {h.lastStatus && (
                      <Badge
                        variant={h.lastStatus === 'SUCCESS' ? 'success' : h.lastStatus === 'FAILED' ? 'destructive' : 'warning'}
                      >
                        last: {h.lastStatus.toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground truncate font-mono">{h.url}</div>
                  {h.events?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {h.events.map((e) => (
                        <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Send test"
                    disabled={test.isPending}
                    onClick={() => {
                      test.mutate(
                        { url: h.url, event: h.events?.[0] ?? 'test.ping' },
                        {
                          onSuccess: (r) =>
                            r.delivered
                              ? toast.success(`Delivered (HTTP ${r.status})`)
                              : toast.error(`Failed (${r.status}) — ${r.message}`),
                          onError: (err) => toast.error(getApiErrorMessage(err, 'Test failed')),
                        },
                      );
                    }}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => setDeleteTarget(h)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CreateWebhookDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        pending={create.isPending}
        testPending={test.isPending}
        onTest={(url) =>
          test.mutate(
            { url, event: 'test.ping' },
            {
              onSuccess: (r) =>
                r.delivered
                  ? toast.success(`OK (HTTP ${r.status})`)
                  : toast.error(`Failed (${r.status}) — ${r.message}`),
              onError: (err) => toast.error(getApiErrorMessage(err, 'Test failed')),
            },
          )
        }
        onCreate={async (payload) => {
          try {
            await create.mutateAsync(payload);
            setOpenCreate(false);
            toast.success('Webhook added');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not add webhook'));
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete webhook "${deleteTarget?.name}"?`}
        description="Event notifications will stop being delivered to this URL."
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          del.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('Webhook deleted');
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getApiErrorMessage(err, 'Delete failed')),
          });
        }}
      />
    </Card>
  );
}

function CreateWebhookDialog({
  open,
  onOpenChange,
  pending,
  testPending,
  onTest,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pending: boolean;
  testPending: boolean;
  onTest: (url: string) => void;
  onCreate: (v: { name: string; url: string; events: string[]; secret?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const urlValid = useMemo(() => {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  }, [url]);

  useEffect(() => {
    if (!open) {
      setName('');
      setUrl('');
      setSecret('');
      setEvents([]);
    }
  }, [open]);

  const toggle = (e: string) =>
    setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a webhook endpoint</DialogTitle>
          <DialogDescription>
            We POST a signed JSON payload to your URL when any subscribed event
            fires. Use the shared secret to verify signatures.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FieldRow label="Name">
            <Input placeholder="e.g. Prod Slack notifier" value={name} onChange={(e) => setName(e.target.value)} />
          </FieldRow>
          <FieldRow label="URL">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                variant="outline"
                loading={testPending}
                disabled={!urlValid}
                onClick={() => onTest(url)}
              >
                Test
              </Button>
            </div>
          </FieldRow>
          <FieldRow label="Signing secret (optional)" hint="Leave blank to auto-generate.">
            <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="whsec_…" />
          </FieldRow>
          <FieldRow label="Events" hint="Pick at least one.">
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggle(e)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-mono transition-colors',
                    events.includes(e)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </FieldRow>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="brand"
            loading={pending}
            disabled={!name || !urlValid || events.length === 0}
            onClick={() => onCreate({ name, url, events, secret: secret || undefined })}
          >
            Add webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Diagnostics ─────────────────────────────────────────────────────────────

function DiagnosticsPanel({ orgId }: { orgId: string }) {
  const { data, isLoading, isError, error, refetch } = useSystemDiagnostics(orgId);
  const purge = usePurgeCache(orgId);
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(error)} retry={() => void refetch()} />;
  if (!data) return null;

  const uptime = formatUptime(data.uptimeSeconds);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>System health</CardTitle>
            <CardDescription>Live diagnostics for the API server, database, cache and storage. Auto-refreshes every 30s.</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            onClick={() => void refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HealthCard
            icon={<Database className="h-4 w-4" />}
            label="Database"
            status={data.database.status}
            detail={`${data.database.provider} · ${data.database.latencyMs}ms`}
          />
          <HealthCard
            icon={<Zap className="h-4 w-4" />}
            label="Cache"
            status={data.cache.status}
            detail={data.cache.engine}
          />
          <HealthCard
            icon={<Cpu className="h-4 w-4" />}
            label="Storage"
            status={data.storage.status}
            detail={data.storage.provider}
          />
          <HealthCard
            icon={<Activity className="h-4 w-4" />}
            label="Server"
            status="OK"
            detail={`uptime ${uptime} · Node ${data.nodeVersion}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data volume</CardTitle>
          <CardDescription>Row counts across the largest tables — a quick smoke test that migrations landed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <StatBlock label="Users" value={data.counts.totalUsers} />
          <StatBlock label="Active projects" value={data.counts.activeProjects} />
          <StatBlock label="CRM leads" value={data.counts.crmLeads} />
          <StatBlock label="Audit records" value={data.counts.auditRecords} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>Operational actions — use with care in production.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Zap className="h-4 w-4" />}
            loading={purge.isPending}
            onClick={() => setConfirmingPurge(true)}
          >
            Purge Redis cache
          </Button>
          <p className="text-xs text-muted-foreground">
            Flushes all cache tags. The next request for each resource repopulates from Postgres.
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmingPurge}
        onOpenChange={setConfirmingPurge}
        title="Purge cache?"
        description="Every cached read is dropped. Users will see a brief cold-cache latency until reads warm up again."
        confirmLabel="Purge"
        destructive
        loading={purge.isPending}
        onConfirm={() => {
          purge.mutate(undefined, {
            onSuccess: (r) => {
              toast.success(r.message ?? 'Cache purged');
              setConfirmingPurge(false);
            },
            onError: (err) => {
              toast.error(getApiErrorMessage(err, 'Purge failed'));
              setConfirmingPurge(false);
            },
          });
        }}
      />
    </div>
  );
}

function HealthCard({
  icon,
  label,
  status,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  detail: string;
}) {
  const good = /ok|ready|healthy|connected/i.test(status);
  return (
    <div className="rounded-xl border border-hairline bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full',
            good ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
          )}
        >
          {good ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        </span>
        {label}
        <span className="ml-auto">{icon}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{status}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-elevated p-3 text-center">
      <div className="font-mono text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function formatUptime(sec: number) {
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
}

// ── Shared UI ───────────────────────────────────────────────────────────────

function FieldRow({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SaveBar({ saving, label }: { saving: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Button type="submit" variant="brand" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
        {label}
      </Button>
      <span className="text-xs text-muted-foreground">Changes persist to the database and take effect immediately.</span>
    </div>
  );
}
