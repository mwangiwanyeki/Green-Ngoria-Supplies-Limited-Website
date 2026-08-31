'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { post } from '@/lib/api/api-client';

const itemSchema = z.object({
  description: z.string().min(3, 'Required'),
  quantity: z.coerce.number().min(1, 'Min 1'),
  unit: z.string().default('EA'),
  notes: z.string().optional(),
});

const schema = z.object({
  companyName: z.string().min(2, 'Required'),
  contactName: z.string().min(2, 'Required'),
  contactEmail: z.string().email('Valid email required'),
  contactPhone: z.string().optional(),
  country: z.string().optional(),
  deliveryLocation: z.string().optional(),
  description: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  // Honeypot — must stay empty. Hidden from real users; bots that fill it
  // are silently accepted server-side.
  company_website: z.string().max(0).optional(),
});

type FormData = z.infer<typeof schema>;

export function RfqForm() {
  const [sent, setSent] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ description: '', quantity: 1, unit: 'EA' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data: FormData) => {
    try {
      await post('/public/rfq', data);
      setSent(true);
      toast.success('RFQ submitted', {
        description: 'Our team will respond within 2 business days.',
      });
      reset({ items: [{ description: '', quantity: 1, unit: 'EA' }] });
    } catch {
      toast.error('Submission failed', {
        description: 'Please try again or contact us directly.',
      });
    }
  };

  /* Confirmed state — the form is replaced by its own receipt. */
  if (sent) {
    return (
      <div className="rounded-xl border border-brand-500/30 bg-accent/60 p-8 shadow-low sm:p-10">
        <CheckCircle2
          className="h-7 w-7 text-brand-700 dark:text-brand-400"
          aria-hidden="true"
        />
        <h2 className="mt-5 font-display text-xl font-bold tracking-tight">
          Your RFQ is with the office
        </h2>
        <p className="measure mt-3 text-sm leading-7 text-muted-foreground">
          The team reviews requests in the order they arrive and normally
          responds within two business days. A copy has been sent to your email
          for your records.
        </p>
        <Button
          variant="outline"
          className="mt-7"
          onClick={() => setSent(false)}
        >
          Submit another RFQ
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-8 rounded-xl border border-border bg-card p-8"
      noValidate
    >
      {/* Company info */}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Your Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              id: 'companyName',
              label: 'Company *',
              placeholder: 'Acacia Mining Ltd',
            },
            {
              id: 'contactName',
              label: 'Contact Name *',
              placeholder: 'James Kamau',
            },
            {
              id: 'contactEmail',
              label: 'Email *',
              placeholder: 'james@example.com',
              type: 'email',
            },
            {
              id: 'contactPhone',
              label: 'Phone',
              placeholder: '+254 700 000 000',
            },
            { id: 'country', label: 'Country', placeholder: 'Kenya' },
            {
              id: 'deliveryLocation',
              label: 'Delivery Location',
              placeholder: 'Bondo, Siaya County',
            },
          ].map(({ id, label, placeholder, type }) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={id}>{label}</Label>
              <Input
                id={id}
                type={type ?? 'text'}
                placeholder={placeholder}
                {...register(id as keyof FormData)}
                error={
                  (errors as Record<string, { message?: string }>)[id]?.message
                }
              />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Project / Technical Requirements</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={3}
            placeholder="Describe the project, specifications or any technical requirements…"
          />
        </div>
      </section>

      {/* Line items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Items Requested</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => append({ description: '', quantity: 1, unit: 'EA' })}
          >
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, i) => (
            <div
              key={field.id}
              className="rounded-lg border border-border bg-muted/20 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="tech-label">Item {i + 1}</span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor={`items.${i}.description`}>
                    Description *
                  </Label>
                  <Input
                    id={`items.${i}.description`}
                    {...register(`items.${i}.description`)}
                    placeholder="CIP Agitator Drive Gearbox"
                    error={errors.items?.[i]?.description?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`items.${i}.quantity`}>Qty *</Label>
                    <Input
                      id={`items.${i}.quantity`}
                      type="number"
                      min={1}
                      {...register(`items.${i}.quantity`)}
                      error={errors.items?.[i]?.quantity?.message}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`items.${i}.unit`}>Unit</Label>
                    <Input
                      id={`items.${i}.unit`}
                      {...register(`items.${i}.unit`)}
                      placeholder="EA"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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
        className="w-full"
        loading={isSubmitting}
      >
        {isSubmitting ? 'Submitting RFQ…' : 'Submit RFQ'}
      </Button>
    </form>
  );
}
