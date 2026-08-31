'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { post } from '@/lib/api/api-client';
import { useMe } from '@/lib/api/hooks/use-auth';

const schema = z.object({
  subject: z.string().min(5, 'Required'),
  category: z.string().min(1, 'Required'),
  description: z.string().min(20, 'Provide more detail (min 20 chars)'),
});
type FormData = z.infer<typeof schema>;

export default function PortalSupportPage() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'GENERAL' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await post(`/organizations/${orgId}/support/tickets`, data);
      toast.success('Support ticket created', {
        description: 'Our team will respond within 1–2 business days.',
      });
      reset();
      setSubmitted(true);
    } catch {
      toast.error('Could not create ticket. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Support"
        description="Contact the Green Ngoria technical and customer support team"
      />

      {submitted && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-6 text-center space-y-2">
          <p className="font-semibold">Ticket submitted successfully</p>
          <p className="text-sm text-muted-foreground">
            Our team will be in touch soon.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubmitted(false)}
          >
            Open another ticket
          </Button>
        </div>
      )}

      {!submitted && (
        <form
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          className="rounded-xl border border-border bg-card p-8 space-y-5"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              {...register('category')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="TECHNICAL">Technical Support</option>
              <option value="SPARE_PARTS">Spare Parts</option>
              <option value="WARRANTY">Warranty</option>
              <option value="GENERAL">General Enquiry</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              {...register('subject')}
              error={errors.subject?.message}
              placeholder="Brief description of the issue"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={6}
              {...register('description')}
              error={errors.description?.message}
              placeholder="Describe the issue in detail, including the asset/equipment involved, when it started and any error messages…"
            />
          </div>

          <Button
            type="submit"
            variant="brand"
            className="w-full"
            size="lg"
            loading={isSubmitting}
          >
            Submit Support Ticket
          </Button>
        </form>
      )}
    </div>
  );
}
