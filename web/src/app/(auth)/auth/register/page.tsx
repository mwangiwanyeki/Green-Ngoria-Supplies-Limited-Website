'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
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
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#\-_])/,
        'Must include uppercase, lowercase, number and special character',
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
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
      toast.success('Account created', {
        description: 'Check your email to verify your account.',
      });
      router.push('/auth/login');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
    }
  };

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
