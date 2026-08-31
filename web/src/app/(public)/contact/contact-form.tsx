'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { post } from '@/lib/api/api-client';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  company: z.string().min(2, 'Please enter your company name'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Please enter a subject'),
  message: z
    .string()
    .min(20, 'Please provide more detail — at least 20 characters'),
  // Honeypot — must stay empty. Hidden from real users; bots that fill it
  // are silently accepted server-side.
  company_website: z.string().max(0).optional(),
});

type FormData = z.infer<typeof schema>;
type Status = 'idle' | 'sent' | 'failed';

export function ContactForm() {
  const [status, setStatus] = React.useState<Status>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await post('/public/contact', data);
      setStatus('sent');
      toast.success('Message sent', {
        description: 'Our team will respond within 1–2 business days.',
      });
      reset();
    } catch {
      setStatus('failed');
      toast.error('Could not send message', {
        description: 'Please try again, or email the office directly.',
      });
    }
  };

  /* Confirmed state — the form is replaced by its own receipt. */
  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-brand-500/30 bg-accent/60 p-8 shadow-low sm:p-10">
        <CheckCircle2
          className="h-7 w-7 text-brand-700 dark:text-brand-400"
          aria-hidden="true"
        />
        <h2 className="mt-5 font-display text-xl font-bold tracking-tight">
          Your enquiry is with the office
        </h2>
        <p className="measure mt-3 text-sm leading-7 text-muted-foreground">
          The team reviews enquiries in the order they arrive and normally
          responds within one to two business days. If it is urgent, call the
          Nairobi office on the number listed alongside.
        </p>
        <Button
          variant="outline"
          className="mt-7"
          onClick={() => setStatus('idle')}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="rounded-xl border border-border bg-card p-7 shadow-mid sm:p-9"
      noValidate
    >
      <h2 className="font-display text-xl font-bold tracking-tight">
        Send an enquiry
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Fields marked with an asterisk are required. The more scope you give,
        the faster the right division can respond.
      </p>

      {status === 'failed' && (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-lg border border-destructive/40 bg-destructive/[0.06] p-4"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm leading-6 text-foreground">
            The message could not be sent. Please try again, or email{' '}
            <a
              href="mailto:info@greenngoriasupplies.com"
              className="font-medium underline decoration-border underline-offset-4"
            >
              info@greenngoriasupplies.com
            </a>{' '}
            directly.
          </p>
        </div>
      )}

      <div className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name *</Label>
            <Input
              id="name"
              autoComplete="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              autoComplete="organization"
              {...register('company')}
              error={errors.company?.message}
              placeholder="Your organisation"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              placeholder="+254 700 000 000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            {...register('subject')}
            error={errors.subject?.message}
            placeholder="What the enquiry is about"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            rows={6}
            {...register('message')}
            error={errors.message?.message}
            placeholder="Describe the scope, location, mineral or product, quantities and programme."
          />
        </div>
      </div>

      {/* Honeypot — visually hidden, not tabbable, ignored by real users. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="company_website">Leave this field empty</label>
        <input
          id="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('company_website')}
        />
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="mt-8 w-full"
        loading={isSubmitting}
        rightIcon={!isSubmitting ? <Send className="h-4 w-4" /> : undefined}
      >
        {isSubmitting ? 'Sending your enquiry…' : 'Send the enquiry'}
      </Button>

      <p className="mt-4 text-xs leading-5 text-subtle">
        We use the details you send only to respond to the enquiry. See our
        privacy policy for how that information is handled.
      </p>
    </form>
  );
}
