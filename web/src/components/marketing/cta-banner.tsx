import Link from 'next/link';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { company } from '@/config/company';

/**
 * Closing call to action. Buttons name the action they perform — there is no
 * generic "learn more" here.
 */
export function CtaBanner({
  title = 'Tell us what you need built, processed or supplied',
  body = 'Send the scope, quantities and delivery location and the enquiry reaches the right division. For an installed circuit, a technical plant assessment is the faster route.',
  primary = { label: 'Send a request for quotation', href: '/request-rfq' },
  secondary = {
    label: 'Request a plant assessment',
    href: '/technical-assessment',
  },
}: {
  title?: string;
  body?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="surface-ink on-ink texture-grain relative overflow-hidden">
      <div className="linework pointer-events-none absolute inset-0 opacity-50" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/[0.14] blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-20">
          <div>
            <h2 className="max-w-[18ch] font-display text-display-lg font-extrabold text-[hsl(var(--on-ink))]">
              {title}
            </h2>
            <p className="measure mt-6 text-[1.0625rem] leading-8 text-[hsl(var(--on-ink-muted))]">
              {body}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href={primary.href}>
                <Button
                  variant="brand"
                  size="lg"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {primary.label}
                </Button>
              </Link>
              <Link href={secondary.href}>
                <Button variant="on-ink" size="lg" className="w-full sm:w-auto">
                  {secondary.label}
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
            <h3 className="tech-label text-[hsl(var(--on-ink-subtle))]">
              Or reach the office directly
            </h3>
            <ul className="mt-5 space-y-4">
              {company.contact.phones.slice(0, 2).map((phone) => (
                <li key={phone.value}>
                  <a
                    href={`tel:${phone.value.replace(/\s/g, '')}`}
                    className="group flex items-center gap-3 text-[hsl(var(--on-ink))]"
                  >
                    <Phone
                      className="h-4 w-4 shrink-0 text-[hsl(var(--on-ink-subtle))]"
                      aria-hidden="true"
                    />
                    <span className="font-mono text-sm underline decoration-white/25 underline-offset-4 transition-colors group-hover:decoration-white">
                      {phone.value}
                    </span>
                    <span className="text-xs text-[hsl(var(--on-ink-subtle))]">
                      {phone.label}
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${company.contact.emails[0].value}`}
                  className="group flex items-center gap-3 text-[hsl(var(--on-ink))]"
                >
                  <Mail
                    className="h-4 w-4 shrink-0 text-[hsl(var(--on-ink-subtle))]"
                    aria-hidden="true"
                  />
                  <span className="text-sm underline decoration-white/25 underline-offset-4 transition-colors group-hover:decoration-white">
                    {company.contact.emails[0].value}
                  </span>
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm leading-6 text-[hsl(var(--on-ink-muted))]">
              {company.contact.addressOneLine}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
