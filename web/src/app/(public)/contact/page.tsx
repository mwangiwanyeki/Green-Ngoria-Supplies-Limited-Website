import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PageHero } from '@/components/marketing/page-hero';
import { Section } from '@/components/marketing/section';
import { SpecPanel } from '@/components/marketing/spec-panel';
import { company } from '@/config/company';
import { ContactForm } from './contact-form';

const title = 'Contact Us';
const description = `Reach Green Ngoria Supplies Limited at ${company.contact.addressOneLine}, by phone on ${company.contact.phones[0].value}, or by email at ${company.contact.emails[0].value}.`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/contact',
  },
};

const mapQuery = encodeURIComponent(
  'Rehema House, Standard Street, Nairobi, Kenya',
);

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Green Ngoria"
        lead="Enquiries about mining and processing, building and civil works, mechanical and electrical contracts, petroleum, timber or general supplies are all handled from the head office in Nairobi."
        primaryAction={{
          label: 'Send a request for quotation',
          href: '/request-rfq',
        }}
        secondaryAction={{
          label: 'Request a plant assessment',
          href: '/technical-assessment',
        }}
        facts={[
          {
            term: 'Head office',
            value: 'Rehema House, Standard Street, Nairobi',
          },
          { term: 'Kenya', value: company.contact.phones[0].value },
          { term: 'Uganda', value: company.contact.phones[2].value },
          { term: 'General enquiries', value: company.contact.emails[0].value },
        ]}
      />

      <Section labelledBy="contact-heading">
        <h2 id="contact-heading" className="sr-only">
          Contact details and enquiry form
        </h2>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          {/* Details register */}
          <div className="space-y-12">
            <div>
              <h3 className="tech-label">Head office</h3>
              <address className="mt-4 not-italic">
                <p className="font-display text-lg font-semibold leading-8 tracking-tight">
                  {company.contact.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {company.contact.postal}
                </p>
              </address>
            </div>

            <div>
              <h3 className="tech-label">Telephone</h3>
              <dl className="mt-4 divide-y divide-hairline border-y border-hairline">
                {company.contact.phones.map((phone) => (
                  <div
                    key={phone.value}
                    className="flex items-baseline justify-between gap-4 py-3.5"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                      {phone.label}
                    </dt>
                    <dd>
                      <a
                        href={`tel:${phone.value.replace(/\s/g, '')}`}
                        className="font-mono text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                      >
                        {phone.value}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="tech-label">Email</h3>
              <dl className="mt-4 divide-y divide-hairline border-y border-hairline">
                {company.contact.emails.map((email) => (
                  <div key={email.value} className="py-3.5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                      {email.label}
                    </dt>
                    <dd className="mt-1.5">
                      <a
                        href={`mailto:${email.value}`}
                        className="text-sm font-medium underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                      >
                        {email.value}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <SpecPanel
              title="Registered details"
              rows={[
                { term: 'Registered name', value: company.legalName },
                { term: 'Entity type', value: company.registration.entityType },
                {
                  term: 'Company number',
                  value: company.registration.companyNumber,
                  mono: true,
                },
                {
                  term: 'KRA PIN',
                  value: company.registration.kraPin,
                  mono: true,
                },
                {
                  term: 'Incorporated',
                  value: company.registration.incorporated,
                },
              ]}
              footnote={
                <Link
                  href="/certifications"
                  className="font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:decoration-brand-700 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
                >
                  Certifications and compliance
                </Link>
              }
            />

            <div>
              <h3 className="tech-label">Where we work</h3>
              <p className="measure mt-4 text-sm leading-7 text-muted-foreground">
                {company.regions.map((region) => region.name).join(' · ')}. For
                a priced requirement, the{' '}
                <Link
                  href="/request-rfq"
                  className="font-medium text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:decoration-brand-700 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
                >
                  request-for-quotation form
                </Link>{' '}
                captures line items, quantities and delivery location.
              </p>
            </div>
          </div>

          {/* Form + map */}
          <div className="space-y-10">
            <ContactForm />

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-low">
              <iframe
                title="Map showing Rehema House, Standard Street, Nairobi"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-72 w-full border-0 grayscale-[0.35] transition-[filter] duration-emphasis ease-out-expo hover:grayscale-0"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline p-5">
                <p className="text-sm text-muted-foreground">
                  {company.contact.addressOneLine}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:decoration-brand-700 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
                >
                  Open in Google Maps
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
