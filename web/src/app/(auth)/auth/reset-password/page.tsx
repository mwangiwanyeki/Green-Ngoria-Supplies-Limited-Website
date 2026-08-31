'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useResetPassword } from '@/lib/api/hooks/use-auth';

const schema = z
  .object({
    password: z
      .string()
      .min(12, 'Minimum 12 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#\-_])/,
        'Must include uppercase, lowercase, number and symbol',
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [showPass, setShowPass] = useState(false);
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ password }: FormData) => {
    try {
      await reset.mutateAsync({ token, password });
      toast.success('Password reset successfully');
      router.push('/auth/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Invalid link</h1>
        <p className="text-muted-foreground text-sm">
          This reset link is invalid or has expired.
        </p>
        <Link href="/auth/forgot-password">
          <Button variant="brand" className="w-full">
            Request a new link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold">Set new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type={showPass ? 'text' : 'password'}
            autoFocus
            rightIcon={
              <button type="button" onClick={() => setShowPass(!showPass)}>
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
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type={showPass ? 'text' : 'password'}
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>
        <Button
          type="submit"
          variant="brand"
          className="w-full"
          size="lg"
          loading={isSubmitting || reset.isPending}
        >
          Reset password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function AuthFormFallback() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
      <span className="sr-only">Loading password reset form</span>
    </div>
  );
}
