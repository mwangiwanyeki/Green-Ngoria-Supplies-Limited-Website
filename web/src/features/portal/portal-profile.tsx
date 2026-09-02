'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
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
  type MyProfile,
} from '@/lib/api/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { MfaSection } from '@/components/account/mfa-section';

/**
 * Client-portal profile page. Mirrors the admin profile's shape (identity
 * summary + tabs for Profile / Security) but keeps the surface intentionally
 * narrower: no session-manager tab (portal users won't need to reason about
 * many concurrent staff sessions). MFA disable/re-enable is the same UI as
 * the admin side because it's the same component.
 */
export function PortalProfile() {
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
        description="Manage your personal details and account security."
      />
      <ProfileSummary profile={data} />
      {/* If a link steers the user here with `#mfa` (e.g. from a security
        * banner), default to the Security tab so the MFA UI is front-and-centre. */}
      <Tabs defaultValue={
        typeof window !== 'undefined' && window.location.hash === '#mfa'
          ? 'security'
          : 'profile'
      }>
        <TabsList>
          <TabsTrigger value="profile">
            <UserRound className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileForm profile={data} />
        </TabsContent>
        <TabsContent value="security" className="mt-6 space-y-6">
          <MfaSection profile={data} />
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSummary({ profile }: { profile: MyProfile }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 font-display text-xl font-bold text-brand-600 dark:text-brand-400">
          {getInitials(`${profile.firstName ?? ''} ${profile.lastName ?? ''}`)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            {profile.mfaEnabled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
                <ShieldCheck className="h-3 w-3" />
                MFA on
              </span>
            )}
            {profile.emailVerifiedAt && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                <BadgeCheck className="h-3 w-3 text-brand-500" />
                Email verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {profile.email}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
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
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    update.mutate(data, {
      onSuccess: (updated) => {
        toast.success('Profile updated');
        reset({
          firstName: updated.firstName ?? '',
          lastName: updated.lastName ?? '',
          phone: updated.phone ?? '',
        });
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'Update failed'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal details</CardTitle>
        <CardDescription>
          Your name and contact details. Your email is your login and can only
          be changed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+254 700 000 000"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
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

  const onSubmit = (data: PasswordFormData) => {
    change.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          toast.success('Password updated. Please sign in again on other devices.');
          reset();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : 'Password change failed',
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
          Use a strong, unique password of at least 12 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
              rightIcon={
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShow((v) => !v)}
                  className="hover:text-foreground transition-colors"
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
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

          <Button
            type="submit"
            variant="brand"
            loading={change.isPending}
            leftIcon={change.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
