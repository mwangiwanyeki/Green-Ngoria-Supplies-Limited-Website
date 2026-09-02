'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/lib/api/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api/api-error';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STAFF_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'LEGAL_OFFICER',
  'PRODUCTION_MANAGER',
  'PROJECT_MANAGER',
  'MINING_ENGINEER',
  'PROCESS_ENGINEER',
  'MECHANICAL_ENGINEER',
  'ELECTRICAL_ENGINEER',
  'PROCUREMENT_OFFICER',
  'FINANCE_OFFICER',
  'HSE_OFFICER',
  'SITE_SUPERVISOR',
  'SALES_MANAGER',
  'CRM_OFFICER',
  'CUSTOMER_CARE',
]);

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectParam = params.get('redirect');
  const [showPass, setShowPass] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await login.mutateAsync(data);
      // Backend signals an MFA challenge with a success response carrying
      // `requiresMfa` (no session yet) — reveal the code field and wait.
      if (res.requiresMfa || !res.user) {
        setNeedsMfa(true);
        toast.info('Enter your MFA code to continue');
        return;
      }
      const isStaff = res.user.roles.some((r) => STAFF_ROLES.has(r));
      if (!isStaff) {
        toast.error('This account does not have staff access.');
        router.push('/portal');
        return;
      }
      // Privileged staff without MFA are sent straight to enrol before they
      // land on the dashboard. Login still succeeds so we don't lock anyone
      // out, but the next screen is the security setup.
      if (res.mfaEnrollmentRequired) {
        toast.warning(
          'Your role requires two-factor authentication. Set it up now.',
          { duration: 6000 },
        );
        router.push('/admin/profile#mfa');
        return;
      }
      toast.success('Welcome back');
      const target =
        redirectParam && redirectParam.startsWith('/admin')
          ? redirectParam
          : '/admin';
      router.push(target);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Login failed');
      // A rejected MFA code keeps the field open and surfaces the error.
      if (msg.toLowerCase().includes('mfa')) {
        setNeedsMfa(true);
      }
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
          Staff &amp; Administrator access
        </div>
        <h1 className="font-display text-2xl font-bold">Admin sign in</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to the Green Ngoria operations and management platform.
        </p>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            leftIcon={<Mail className="h-4 w-4" />}
            placeholder="you@greenngoria.com"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="hover:text-foreground transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        {needsMfa && (
          <div className="space-y-1.5">
            <Label htmlFor="mfaCode">Authentication code</Label>
            <Input
              id="mfaCode"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="6-digit code from your authenticator"
              {...register('mfaCode')}
              error={errors.mfaCode?.message}
            />
            <p className="text-xs text-muted-foreground">
              Open your authenticator app and enter the current code.
            </p>
          </div>
        )}

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          size="lg"
          loading={isSubmitting || login.isPending}
        >
          Sign in to admin
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground border-t border-border pt-4">
        Are you a client?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          Go to the client portal sign-in
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginFallback() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
      <span className="sr-only">Loading admin sign-in form</span>
    </div>
  );
}
