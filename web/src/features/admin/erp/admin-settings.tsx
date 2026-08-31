'use client';

import { useEffect, useState } from 'react';
import { Building2, Cog, ShieldCheck, Save } from 'lucide-react';
import { PageHeader, ErrorState } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBranchStore } from '@/stores/branch-store';
import {
  useBranchBusinessProfile,
  useUpdateBranchBusinessProfile,
  useBranchGeneralSettings,
  useUpdateBranchGeneralSettings,
  useBranchSessionSecurity,
  useUpdateBranchSessionSecurity,
} from '@/lib/api/hooks/use-branches';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const IDLE_PRESETS = [5, 10, 15, 30, 60, 120];

export function AdminSettings() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  if (!activeBranchId) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Settings"
          description="Select a branch from the sidebar to configure its settings."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Settings"
        description="Per-branch business profile and system-wide preferences."
      />
      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">
            <Building2 className="mr-2 h-4 w-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="general">
            <Cog className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Session Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="business">
          <BusinessProfileForm branchId={activeBranchId} />
        </TabsContent>
        <TabsContent value="general">
          <GeneralSettingsForm branchId={activeBranchId} />
        </TabsContent>
        <TabsContent value="security">
          <SessionSecurityForm branchId={activeBranchId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BusinessProfileValues {
  businessName?: string;
  systemName?: string;
  phone?: string;
  email?: string;
  county?: string;
  address?: string;
}

function BusinessProfileForm({ branchId }: { branchId: string }) {
  const { data, isLoading, isError, refetch } =
    useBranchBusinessProfile(branchId);
  const update = useUpdateBranchBusinessProfile(branchId);
  const [values, setValues] = useState<BusinessProfileValues>({});
  useEffect(() => {
    if (data) setValues(data as BusinessProfileValues);
  }, [data]);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const set = (k: keyof BusinessProfileValues) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(values, {
          onSuccess: () => toast.success('Business profile saved'),
          onError: () => toast.error('Could not save profile'),
        });
      }}
      className="space-y-6 rounded-xl border border-border bg-card p-6"
    >
      <p className="text-sm text-muted-foreground">
        Configure the business profile for this branch — each branch can have
        its own name and contact info.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business Name">
          <Input value={values.businessName ?? ''} onChange={set('businessName')} />
        </Field>
        <Field label="System Name">
          <Input value={values.systemName ?? ''} onChange={set('systemName')} />
        </Field>
        <Field label="Phone">
          <Input value={values.phone ?? ''} onChange={set('phone')} />
        </Field>
        <Field label="Email">
          <Input type="email" value={values.email ?? ''} onChange={set('email')} />
        </Field>
        <Field label="County">
          <Input value={values.county ?? ''} onChange={set('county')} />
        </Field>
        <Field label="Address">
          <Input value={values.address ?? ''} onChange={set('address')} />
        </Field>
      </div>
      <Button
        type="submit"
        variant="brand"
        leftIcon={<Save className="h-4 w-4" />}
        loading={update.isPending}
      >
        Save Business Profile
      </Button>
    </form>
  );
}

interface GeneralSettingsValues {
  currencySymbol?: string;
  taxRate?: number;
  lowStockThreshold?: number;
}

function GeneralSettingsForm({ branchId }: { branchId: string }) {
  const { data, isLoading, isError, refetch } =
    useBranchGeneralSettings(branchId);
  const update = useUpdateBranchGeneralSettings(branchId);
  const [values, setValues] = useState<GeneralSettingsValues>({});
  useEffect(() => {
    if (data) setValues(data as GeneralSettingsValues);
  }, [data]);
  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(values, {
          onSuccess: () => toast.success('General settings saved'),
        });
      }}
      className="space-y-6 rounded-xl border border-border bg-card p-6"
    >
      <p className="text-sm text-muted-foreground">
        System-wide preferences for currency, tax and stock alerts.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Currency Symbol" hint="Used in all monetary displays">
          <Input
            value={values.currencySymbol ?? 'KSh'}
            onChange={(e) =>
              setValues((v) => ({ ...v, currencySymbol: e.target.value }))
            }
          />
        </Field>
        <Field label="Tax Rate (%)" hint="Applied to sales if enabled">
          <Input
            type="number"
            value={values.taxRate ?? 0}
            onChange={(e) =>
              setValues((v) => ({ ...v, taxRate: Number(e.target.value) }))
            }
          />
        </Field>
        <Field label="Low Stock Threshold" hint="Default reorder alert level">
          <Input
            type="number"
            value={values.lowStockThreshold ?? 10}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                lowStockThreshold: Number(e.target.value),
              }))
            }
          />
        </Field>
      </div>
      <Button
        type="submit"
        variant="brand"
        leftIcon={<Save className="h-4 w-4" />}
        loading={update.isPending}
      >
        Save General Settings
      </Button>
    </form>
  );
}

interface SessionSecurityValues {
  autoLogoutEnabled: boolean;
  idleTimeoutMinutes: number;
  warningCountdownSeconds: number;
}

function SessionSecurityForm({ branchId }: { branchId: string }) {
  const { data, isLoading, isError, refetch } =
    useBranchSessionSecurity(branchId);
  const update = useUpdateBranchSessionSecurity(branchId);
  const [values, setValues] = useState<SessionSecurityValues>({
    autoLogoutEnabled: true,
    idleTimeoutMinutes: 120,
    warningCountdownSeconds: 60,
  });
  useEffect(() => {
    if (data) setValues(data);
  }, [data]);
  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(values, {
          onSuccess: () => toast.success('Session security saved'),
        });
      }}
      className="space-y-6 rounded-xl border border-border bg-card p-6"
    >
      <p className="text-sm text-muted-foreground">
        Automatically sign users out after a period of inactivity.
      </p>
      <label className="flex items-start gap-3 rounded-md border border-border p-3">
        <input
          type="checkbox"
          checked={values.autoLogoutEnabled}
          onChange={(e) =>
            setValues((v) => ({ ...v, autoLogoutEnabled: e.target.checked }))
          }
          className="mt-1 h-4 w-4"
        />
        <div>
          <div className="text-sm font-semibold">Auto Logout When Idle</div>
          <p className="text-xs text-muted-foreground">
            Ends the session if there is no mouse, keyboard or touch activity.
          </p>
        </div>
      </label>
      <Field label="Logout After">
        <div className="flex flex-wrap gap-2">
          {IDLE_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() =>
                setValues((v) => ({ ...v, idleTimeoutMinutes: m }))
              }
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                values.idleTimeoutMinutes === m
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {m < 60 ? `${m} min` : `${m / 60} hr`}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Idle Timeout (minutes)" hint="Between 1 and 480 minutes">
          <Input
            type="number"
            min={1}
            max={480}
            value={values.idleTimeoutMinutes}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                idleTimeoutMinutes: Number(e.target.value),
              }))
            }
          />
        </Field>
        <Field
          label="Warning Countdown (seconds)"
          hint="Between 10 and 300 seconds"
        >
          <Input
            type="number"
            min={10}
            max={300}
            value={values.warningCountdownSeconds}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                warningCountdownSeconds: Number(e.target.value),
              }))
            }
          />
        </Field>
      </div>
      <Button
        type="submit"
        variant="brand"
        leftIcon={<Save className="h-4 w-4" />}
        loading={update.isPending}
      >
        Save Session Security
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
