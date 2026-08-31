import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { company } from '@/config/company';
import { serviceDivisions } from '@/config/services';
import { Logo } from '@/components/brand/logo';

const columns: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: 'Mining & processing',
      links: [
        { label: 'Mining overview', href: '/mining' },
        { label: 'Gold processing plant', href: '/gold-processing' },
        { label: 'Gold mining', href: '/services/gold-mining' },
        { label: 'Gemstone mining', href: '/services/gemstone-mining' },
        { label: 'Plant engineering', href: '/mining-plant-engineering' },
        { label: 'Plant construction', href: '/mining-plant-construction' },
        { label: 'Plant optimization', href: '/plant-optimization' },
      ],
    },
    {
      heading: 'Divisions',
      links: [
        { label: 'All ten divisions', href: '/services' },
        ...serviceDivisions
          .filter((d) => !d.slug.includes('mining'))
          .map((division) => ({
            label: division.name,
            href: `/services/${division.slug}`,
          })),
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Green Ngoria', href: '/about' },
        { label: 'Leadership', href: '/leadership' },
        { label: 'Completed projects', href: '/projects' },
        { label: 'Certifications & compliance', href: '/certifications' },
        { label: 'Insights', href: '/insights' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      heading: 'Start a request',
      links: [
        { label: 'Request a quotation', href: '/request-rfq' },
        { label: 'Request a plant assessment', href: '/technical-assessment' },
        { label: 'Equipment', href: '/equipment' },
        { label: 'Spare parts', href: '/spares' },
        { label: 'Client portal', href: '/auth/login' },
      ],
    },
  ];

export function SiteFooter() {
  return (
    <footer className="surface-ink on-ink relative overflow-hidden">
      <div className="linework pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-20 sm:px-8 lg:px-10 lg:pt-24">
        <div className="grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)]">
          {/* Identity + contact */}
          <div>
            <Link
              href="/"
              className="inline-flex"
              aria-label={`${company.legalName} — home`}
            >
              <Logo height={46} onDark />
            </Link>
            <p className="measure-tight mt-4 text-sm leading-7 text-[hsl(var(--on-ink-muted))]">
              Gold and gemstone mining, mineral processing, building and civil
              works, mechanical and electrical engineering, petroleum, timber
              and general supplies — across Kenya, Tanzania, Uganda, Rwanda and
              Burundi.
            </p>

            <address className="mt-8 space-y-5 not-italic">
              <div className="flex gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--on-ink-subtle))]"
                  aria-hidden="true"
                />
                <p className="text-sm leading-6 text-[hsl(var(--on-ink-muted))]">
                  {company.contact.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  <span className="mt-1 block text-[hsl(var(--on-ink-subtle))]">
                    {company.contact.postal}
                  </span>
                </p>
              </div>

              <ul className="space-y-2">
                {company.contact.phones.map((phone) => (
                  <li key={phone.value}>
                    <a
                      href={`tel:${phone.value.replace(/\s/g, '')}`}
                      className="group inline-flex items-center gap-3 text-sm text-[hsl(var(--on-ink-muted))] transition-colors hover:text-[hsl(var(--on-ink))]"
                    >
                      <Phone
                        className="h-4 w-4 shrink-0 text-[hsl(var(--on-ink-subtle))]"
                        aria-hidden="true"
                      />
                      <span className="font-mono underline decoration-white/15 underline-offset-4 transition-colors group-hover:decoration-white/60">
                        {phone.value}
                      </span>
                      <span className="text-xs text-[hsl(var(--on-ink-subtle))]">
                        {phone.label}
                      </span>
                    </a>
                  </li>
                ))}
                {company.contact.emails.map((email) => (
                  <li key={email.value}>
                    <a
                      href={`mailto:${email.value}`}
                      className="group inline-flex items-center gap-3 text-sm text-[hsl(var(--on-ink-muted))] transition-colors hover:text-[hsl(var(--on-ink))]"
                    >
                      <Mail
                        className="h-4 w-4 shrink-0 text-[hsl(var(--on-ink-subtle))]"
                        aria-hidden="true"
                      />
                      <span className="underline decoration-white/15 underline-offset-4 transition-colors group-hover:decoration-white/60">
                        {email.value}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </address>
          </div>

          {/* Link register */}
          <nav
            aria-label="Footer"
            className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
          >
            {columns.map((column) => (
              <div key={column.heading}>
                <h2 className="tech-label border-b border-white/10 pb-3 text-[hsl(var(--on-ink-subtle))]">
                  {column.heading}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[hsl(var(--on-ink-muted))] underline decoration-transparent underline-offset-4 transition-colors hover:text-[hsl(var(--on-ink))] hover:decoration-white/40"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Certification + registration record */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                Certified to
              </dt>
              <dd className="mt-2 font-mono text-xs leading-5 text-[hsl(var(--on-ink-muted))]">
                {company.certifications.map((c) => c.name).join(' · ')}
              </dd>
            </div>
            <div>
              <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                Company number
              </dt>
              <dd className="mt-2 font-mono text-xs text-[hsl(var(--on-ink-muted))]">
                {company.registration.companyNumber}
              </dd>
            </div>
            <div>
              <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                KRA PIN
              </dt>
              <dd className="mt-2 font-mono text-xs text-[hsl(var(--on-ink-muted))]">
                {company.registration.kraPin}
              </dd>
            </div>
            <div>
              <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                Incorporated
              </dt>
              <dd className="mt-2 text-xs tabular-figures text-[hsl(var(--on-ink-muted))]">
                {company.registration.incorporated}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-10">
          <p className="text-xs text-[hsl(var(--on-ink-subtle))]">
            © {new Date().getFullYear()} {company.legalName} · &ldquo;
            {company.tagline}&rdquo;
          </p>
          <ul className="flex items-center gap-6">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Client portal', href: '/auth/login' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-[hsl(var(--on-ink-subtle))] underline decoration-transparent underline-offset-4 transition-colors hover:text-[hsl(var(--on-ink))] hover:decoration-white/40"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
