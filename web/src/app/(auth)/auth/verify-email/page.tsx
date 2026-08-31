'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, MailWarning, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVerifyEmail } from '@/lib/api/hooks/use-auth';

function VerifyEmailInner() {
  const token = useSearchParams().get('token') ?? '';
  const verify = useVerifyEmail();
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verify.mutate(token);
  }, [token, verify]);

  // ── No token in the URL ────────────────────────────────────────────────
  if (!token) {
    return (
      <StateShell
        icon={<MailWarning className="h-8 w-8 text-destructive" />}
        tone="danger"
        title="Verification link incomplete"
        description="This link is missing its verification token. Please open the most recent verification email and use the button there."
      >
        <SignInLinks />
      </StateShell>
    );
  }

  // ── In flight ───────────────────────────────────────────────────────────
  if (verify.isPending || verify.isIdle) {
    return (
      <StateShell
        icon={<Loader2 className="h-8 w-8 animate-spin text-brand-500" />}
        tone="brand"
        title="Verifying your email"
        description="Hang tight while we confirm your email address."
      />
    );
  }

  // ── Failure — invalid or expired ─────────────────────────────────────────
  if (verify.isError) {
    const message =
      verify.error instanceof Error
        ? verify.error.message
        : 'This verification link is invalid or has expired.';
    return (
      <StateShell
        icon={<MailWarning className="h-8 w-8 text-destructive" />}
        tone="danger"
        title="Verification failed"
        description={message}
      >
        <p className="text-sm text-muted-foreground">
          Verification links expire after 48 hours. You can request a new one by
          signing in — we&apos;ll prompt you to resend if your email is still
          unverified.
        </p>
        <SignInLinks />
      </StateShell>
    );
  }

  // ── Success (verified or already verified) ───────────────────────────────
  const alreadyVerified = verify.data?.status === 'already-verified';
  return (
    <StateShell
      icon={<CheckCircle2 className="h-8 w-8 text-brand-500" />}
      tone="brand"
      title={alreadyVerified ? 'Email already verified' : 'Email verified'}
      description={
        alreadyVerified
          ? 'Your email address was already confirmed. You can sign in to your account.'
          : 'Your email address has been confirmed. You can now sign in to your account.'
      }
    >
      <SignInLinks primary />
    </StateShell>
  );
}

function SignInLinks({ primary = false }: { primary?: boolean }) {
  return (
    <div className="space-y-3">
      <Link href="/auth/login" className="block">
        <Button
          variant={primary ? 'brand' : 'outline'}
          className="w-full"
          size="lg"
        >
          Continue to client sign in
        </Button>
      </Link>
      <p className="text-center text-sm text-muted-foreground">
        Staff member?{' '}
        <Link
          href="/auth/admin"
          className="font-medium text-primary hover:underline"
        >
          Go to the admin sign-in
        </Link>
      </p>
    </div>
  );
}

function StateShell({
  icon,
  tone,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  tone: 'brand' | 'danger';
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div
            className={
              tone === 'brand'
                ? 'flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10'
                : 'flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'
            }
          >
            {icon}
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="space-y-6 text-center" role="status" aria-live="polite">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10">
          <ShieldCheck className="h-8 w-8 text-brand-500" />
        </div>
      </div>
      <div className="mx-auto h-8 w-56 animate-pulse rounded-md bg-muted" />
      <span className="sr-only">Loading email verification</span>
    </div>
  );
}
