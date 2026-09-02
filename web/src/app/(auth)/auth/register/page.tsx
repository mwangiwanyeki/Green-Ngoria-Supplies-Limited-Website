'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRegister } from '@/lib/api/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api/api-error';

const schema = z
  .object({
    firstName: z.string().min(2, 'Required'),
    lastName: z.string().min(2, 'Required'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(12, 'Minimum 12 characters')
      .max(128, 'Maximum 128 characters')
      // Mirrors the backend RegisterDto Matches regex exactly (including the
      // trailing character-class restriction). Previously the frontend only
      // enforced the four "must contain" lookaheads, so a user with a space
      // or an accented character passed zod, POSTed, then hit a 400 from the
      // API. Same regex both sides means the form flags it before submit.
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#\-_])[A-Za-z\d@$!%*?&^#\-_]+$/,
        'Must include uppercase, lowercase, number and one of @$!%*?&^#-_; no spaces or accented characters',
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const register_ = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ confirmPassword, ...data }: FormData) => {
    void confirmPassword;
    try {
      await register_.mutateAsync(data);
      // Show a persistent "check your inbox" screen rather than bouncing to
      // /auth/login with no context — the user hasn't verified yet, so login
      // won't work and the toast disappears before they read it.
      setSubmittedEmail(data.email);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
    }
  };

  if (submittedEmail) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
          <Mail className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-foreground">{submittedEmail}</span>
            . Click it to activate your account, then sign in.
          </p>
        </div>
        <ul className="mx-auto max-w-sm space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <span>The link expires in 48 hours.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <span>Check your spam folder if it&apos;s not in your inbox.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <span>You can close this tab — the link works on any device.</span>
          </li>
        </ul>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Request access to the Green Ngoria client portal
        </p>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="space-y-4"
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              autoFocus
              {...register('firstName')}
              error={errors.firstName?.message}
              placeholder="James"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              error={errors.lastName?.message}
              placeholder="Kamau"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+254 700 000 000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle visibility"
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
          <p className="text-xs text-muted-foreground">
            Min 12 chars, uppercase, lowercase, number and symbol
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password *</Label>
          <Input
            id="confirmPassword"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          size="lg"
          loading={isSubmitting || register_.isPending}
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
