'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  BadgeCheck,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MailWarning,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { PageHeader, ErrorState } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useMyProfile,
  useUpdateProfile,
  useChangePassword,
  useMfaSetup,
  useMfaEnable,
  useMfaDisable,
  useSessions,
  useRevokeSession,
  useLogoutAll,
  type MyProfile,
} from '@/lib/api/hooks/use-auth';
import { getInitials } from '@/lib/utils';

export function AdminProfile() {
  const { data, isLoading, isError, refetch } = useMyProfile();

  if (isLoading) return <PageSkeleton />;
  if (isError || !data)
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState retry={() => void refetch()} />
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Your profile"
        description="Manage your personal details, account security and active sessions."
      />
      <ProfileSummary profile={data} />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <UserRound className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="mr-2 h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileForm profile={data} />
        </TabsContent>
        <TabsContent value="security" className="mt-6 space-y-6">
          <MfaSection profile={data} />
          <ChangePasswordForm />
        </TabsContent>
        <TabsContent value="sessions" className="mt-6">
          <SessionsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Summary header card ────────────────────────────────────────────────────

function ProfileSummary({ profile }: { profile: MyProfile }) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const roleLabel =
    profile.userRoles?.[0]?.role.displayName ??
    profile.userRoles?.[0]?.role.name.replace(/_/g, ' ') ??
    'Staff member';
  const verified = !!profile.emailVerifiedAt;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xl font-semibold text-white select-none">
          {getInitials(fullName || profile.email)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{fullName || '—'}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </span>
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <MailWarning className="h-3 w-3" /> Unverified
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
            {roleLabel.toLowerCase()}
          </span>
          <span
            className={
              profile.mfaEnabled
                ? 'inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 dark:text-brand-400'
                : 'inline-flex items-center gap-1 rounded-full bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground'
            }
          >
            <ShieldCheck className="h-3 w-3" />
            {profile.mfaEnabled ? 'MFA on' : 'MFA off'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Profile details form ───────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z
    .string()
    .trim()
    .max(30, 'Too long')
    .regex(/^[+()\d][\d\s()-]*$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  timezone: z.string().trim().max(60).optional().or(z.literal('')),
});
type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileForm({ profile }: { profile: MyProfile }) {
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? '',
      timezone: profile.timezone ?? '',
    },
  });

  const onSubmit = (values: ProfileFormData) => {
    update.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone?.trim() || undefined,
        timezone: values.timezone?.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success('Profile updated');
          reset({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone ?? '',
            timezone: data.timezone ?? '',
          });
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Update failed'),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal details</CardTitle>
        <CardDescription>
          Update how your name and contact details appear across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="space-y-6"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                {...register('firstName')}
                error={errors.firstName?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground">
                Contact an administrator to change your work email.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+254 700 000000"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="Africa/Nairobi"
                {...register('timezone')}
                error={errors.timezone?.message}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="brand"
              loading={update.isPending}
              disabled={!isDirty || update.isPending}
            >
              Save changes
            </Button>
            {isDirty && !update.isPending && (
              <span className="text-xs text-muted-foreground">
                You have unsaved changes
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── MFA section ─────────────────────────────────────────────────────────────

function MfaSection({ profile }: { profile: MyProfile }) {
  if (profile.mfaEnabled) return <MfaEnabled />;
  return <MfaSetup email={profile.email} />;
}

function MfaEnabled() {
  const disable = useMfaDisable();
  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);

  const onDisable = () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your authenticator');
      return;
    }
    disable.mutate(code, {
      onSuccess: () => {
        toast.success('Two-factor authentication disabled');
        setCode('');
        setConfirming(false);
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : 'Could not disable MFA',
        ),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-500" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Your account is protected with an authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-md border border-brand-500/30 bg-brand-500/5 p-4 text-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand-500" />
          <p className="text-foreground">
            Two-factor authentication is <strong>active</strong>. You&apos;ll be
            asked for a code from your authenticator app each time you sign in.
          </p>
        </div>

        {!confirming ? (
          <Button
            variant="outline"
            leftIcon={<ShieldAlert className="h-4 w-4" />}
            onClick={() => setConfirming(true)}
          >
            Disable two-factor authentication
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Enter a current code from your authenticator app to confirm.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="sm:max-w-[200px] tabular-nums tracking-[0.3em]"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  loading={disable.isPending}
                  disabled={code.length !== 6 || disable.isPending}
                  onClick={onDisable}
                >
                  Confirm disable
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setConfirming(false);
                    setCode('');
                  }}
                  disabled={disable.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MfaSetup({ email }: { email: string }) {
  const setup = useMfaSetup();
  const enable = useMfaEnable();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const secret = setup.data?.secret;
  const otpauthUrl = setup.data?.otpauthUrl;
  const grouped = useMemo(
    () => (secret ? secret.replace(/(.{4})/g, '$1 ').trim() : ''),
    [secret],
  );

  const start = () => {
    setup.mutate(undefined, {
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : 'Could not start MFA setup',
        ),
    });
  };

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — select and copy the code manually');
    }
  };

  const onEnable = () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your authenticator');
      return;
    }
    enable.mutate(code, {
      onSuccess: () => {
        toast.success('Two-factor authentication enabled');
        setCode('');
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'Invalid code'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-500" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security with a time-based authenticator app
          (Google Authenticator, 1Password, Authy).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!setup.data ? (
          <>
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
              <p>
                You&apos;ll scan a QR code with your authenticator app, then
                enter a 6-digit code to confirm. Two-factor authentication is{' '}
                <strong className="text-foreground">not yet enabled</strong>.
              </p>
            </div>
            <Button
              variant="brand"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              loading={setup.isPending}
              onClick={start}
            >
              Set up two-factor authentication
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-lg border border-border bg-white p-3">
                  {otpauthUrl && (
                    <QRCodeSVG
                      value={otpauthUrl}
                      size={168}
                      level="M"
                      marginSize={0}
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Scan with your authenticator
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    1. Scan the QR code, or enter the key manually
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Account: {email}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Setup key</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 select-all break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm tracking-wider">
                      {grouped}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Copy setup key"
                      onClick={() => void copySecret()}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-brand-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-5">
              <Label htmlFor="mfa-enable-code">
                2. Enter the 6-digit code to confirm
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="mfa-enable-code"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="sm:max-w-[200px] tabular-nums tracking-[0.3em]"
                />
                <Button
                  variant="brand"
                  loading={enable.isPending}
                  disabled={code.length !== 6 || enable.isPending}
                  onClick={onEnable}
                >
                  Verify &amp; enable
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Change password form ────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'Minimum 12 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#\-_])/,
        'Must include uppercase, lowercase, number and symbol',
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

function ChangePasswordForm() {
  const change = useChangePassword();
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = (values: PasswordFormData) => {
    change.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success(
            'Password changed. Other sessions have been signed out.',
          );
          reset();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : 'Could not change password',
          ),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-500" />
          Change password
        </CardTitle>
        <CardDescription>
          Changing your password signs you out of all other devices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label="Toggle password visibility"
                    className="hover:text-foreground transition-colors"
                  >
                    {show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                {...register('newPassword')}
                error={errors.newPassword?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
            </div>
          </div>
          <Button type="submit" variant="brand" loading={change.isPending}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Active sessions ─────────────────────────────────────────────────────────

function SessionsSection() {
  const { data, isLoading, isError, refetch } = useSessions();
  const revoke = useRevokeSession();
  const logoutAll = useLogoutAll();

  const sessions = data ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Devices currently signed in to your account.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<LogOut className="h-4 w-4" />}
          loading={logoutAll.isPending}
          disabled={sessions.length === 0 || logoutAll.isPending}
          onClick={() =>
            logoutAll.mutate(undefined, {
              onSuccess: () => toast.success('Signed out of all sessions'),
              onError: () => toast.error('Could not sign out sessions'),
            })
          }
        >
          Sign out all
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sessions…
          </div>
        ) : isError ? (
          <ErrorState retry={() => void refetch()} />
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active sessions found.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatUserAgent(session.userAgent)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.ipAddress ?? 'Unknown IP'} · signed in{' '}
                      {formatDate(session.createdAt)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={revoke.isPending && revoke.variables === session.id}
                  disabled={revoke.isPending}
                  onClick={() =>
                    revoke.mutate(session.id, {
                      onSuccess: () => toast.success('Session revoked'),
                      onError: () => toast.error('Could not revoke session'),
                    })
                  }
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function formatUserAgent(ua?: string | null): string {
  if (!ua) return 'Unknown device';
  const browser = /edg/i.test(ua)
    ? 'Edge'
    : /chrome|crios/i.test(ua)
      ? 'Chrome'
      : /firefox|fxios/i.test(ua)
        ? 'Firefox'
        : /safari/i.test(ua)
          ? 'Safari'
          : 'Browser';
  const os = /windows/i.test(ua)
    ? 'Windows'
    : /mac os|macintosh/i.test(ua)
      ? 'macOS'
      : /android/i.test(ua)
        ? 'Android'
        : /iphone|ipad|ios/i.test(ua)
          ? 'iOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : '';
  return os ? `${browser} on ${os}` : browser;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
