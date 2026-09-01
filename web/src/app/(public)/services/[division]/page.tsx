import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { ScopeRegister } from '@/components/marketing/spec-panel';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { InteractiveEngineeringGallery } from '@/components/marketing/interactive-engineering-gallery';
import { getServiceDivision, serviceDivisions } from '@/config/services';
import { company } from '@/config/company';

export function generateStaticParams() {
  return serviceDivisions.map((division) => ({ division: division.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ division: string }>;
}): Promise<Metadata> {
  const { division: slug } = await params;
  const division = getServiceDivision(slug);
  if (!division) return {};

  return {
    title: `${division.name} | ${company.legalName}`,
    description: division.summary,
    openGraph: {
      title: `${division.name} | ${company.legalName}`,
      description: division.summary,
      type: 'website',
      url: `/services/${division.slug}`,
      images: division.primaryImage ? [{ url: division.primaryImage.src }] : [],
    },
  };
}

export default async function ServiceDivisionPage({
  params,
}: {
  params: Promise<{ division: string }>;
}) {
  const { division: slug } = await params;
  const division = getServiceDivision(slug);
  if (!division) notFound();

  const otherDivisions = serviceDivisions.filter((d) => d.slug !== slug);

  return (
    <>
      {/* 1 — Page Hero */}
      <PageHero
        title={division.headline}
        lead={division.intro}
        primaryAction={division.cta}
        secondaryAction={division.secondaryCta ?? { label: 'All ten divisions', href: '/services' }}
        facts={
          division.keyMetrics && division.keyMetrics.length > 0
            ? division.keyMetrics.map((m) => ({
                term: m.label,
                value: `${m.value} (${m.detail})`,
              }))
            : [
                { term: 'Division', value: division.name },
                { term: 'Category', value: division.eyebrow },
                { term: 'Recorded scope items', value: String(division.scope.length) },
                {
                  term: division.reach ? division.reach.title : 'Delivered across',
                  value: division.reach
                    ? division.reach.items.slice(0, 2).join(' · ')
                    : 'Kenya · Tanzania · Uganda · Rwanda · Burundi',
                },
              ]
        }
      />

      {/* 2 — Primary Hero Feature Visual Banner */}
      {division.primaryImage && (
        <section className="relative -mt-10 border-b border-hairline bg-surface-sunken pb-12 pt-0 sm:-mt-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-panel">
              <div className="relative aspect-[21/9] w-full min-h-[280px] bg-muted sm:min-h-[380px]">
                <Image
                  src={division.primaryImage.src}
                  alt={division.primaryImage.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 sm:bottom-6 sm:left-8 sm:right-8">
                  <div className="max-w-2xl">
                    <span className="rounded-md bg-brand-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-md">
                      {division.primaryImage.badge}
                    </span>
                    <h2 className="mt-2 font-display text-lg font-bold text-white sm:text-2xl">
                      {division.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80 sm:text-sm">
                      {division.primaryImage.caption}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={division.cta.href}>
                      <Button variant="brand" size="sm">
                        {division.cta.label}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3 — Interactive High-Resolution Field Gallery & Lightbox */}
      {division.gallery && division.gallery.length > 0 && (
        <Section labelledBy="division-gallery">
          <InteractiveEngineeringGallery
            items={division.gallery.map((item) => ({
              src: item.src,
              alt: item.caption,
              title: item.title || division.name,
              description: item.caption,
              tag: item.tag || division.eyebrow,
            }))}
            headline={`${division.name} — Technical Portfolio`}
            subhead="Authentic high-resolution documentation from Green Ngoria operations, field sites, and technical delivery across East Africa. Click any photo to zoom in up to 2.5x with full pixel clarity."
          />
        </Section>
      )}

      {/* 4 — Technical Scope & Categorized Deliverables */}
      <Section tone="sunken" rule labelledBy="division-scope">
        <SectionIntro
          id="division-scope"
          title="Technical Scope &amp; Certified Deliverables"
          lead={division.summary}
          align="stack"
        />

        {division.deliverableCategories && division.deliverableCategories.length > 0 ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {division.deliverableCategories.map((category) => (
              <div
                key={category.category}
                className="flex flex-col justify-between rounded-2xl border border-hairline bg-card p-6 shadow-card"
              >
                <div>
                  <div className="flex items-center gap-2 border-b border-hairline pb-4">
                    <Layers className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <h3 className="font-display text-base font-bold text-foreground">
                      {category.category}
                    </h3>
                  </div>
                  <ul className="mt-5 space-y-4">
                    {category.items.map((item) => (
                      <li key={item.name} className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-display text-sm font-semibold text-foreground">
                            {item.name}
                          </span>
                          {item.standard && (
                            <span className="shrink-0 font-mono text-[0.6875rem] font-bold text-brand-700 dark:text-brand-400">
                              {item.standard}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Primary Scope Checklist */}
        <div className="mt-12 rounded-2xl border border-hairline bg-card p-6 lg:p-8">
          <h3 className="tech-label text-foreground">Scope of Work — Official Company Profile</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {division.scope.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-xs leading-5 text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 5 — Execution Pathway */}
      {division.lifecyclePhases && division.lifecyclePhases.length > 0 && (
        <Section rule labelledBy="pathway-heading">
          <SectionIntro
            id="pathway-heading"
            title="Phase-by-Phase Execution Pathway"
            lead="Every stage produces auditable records and signoff gates so the project advances on verified empirical data rather than assumptions."
            align="stack"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {division.lifecyclePhases.map((phase) => (
              <div
                key={phase.phase}
                className="group relative flex flex-col justify-between rounded-xl border border-hairline bg-card p-6 shadow-sm transition-all hover:border-brand-500/40 hover:shadow-card"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-hairline pb-3">
                    <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400">
                      {phase.phase}
                    </span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-foreground">
                    {phase.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {phase.objective}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-hairline pt-3">
                    <span className="tech-label text-[0.6875rem]">Key Deliverables:</span>
                    <ul className="space-y-1">
                      {phase.deliverables.map((d) => (
                        <li key={d} className="flex items-start gap-1.5 text-[0.75rem] text-foreground/80">
                          <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-brand-500" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 border-t border-hairline pt-3">
                  <span className="block font-mono text-[0.6875rem] text-muted-foreground">
                    Signoff Gate: <strong className="text-foreground">{phase.milestoneRecord}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 6 — Technical Specifications & Parameters Table */}
      {division.technicalSpecs && division.technicalSpecs.length > 0 && (
        <Section tone="sunken" rule labelledBy="specs-heading">
          <SectionIntro
            id="specs-heading"
            title="Design Criteria &amp; Technical Parameters"
            lead="Key engineering tolerances, capacities, material grades, and statutory standards applicable to this scope."
            align="stack"
          />

          <div className="mt-10 overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-4">Parameter / Specification</th>
                    <th scope="col" className="px-6 py-4">Standard Design Criteria</th>
                    <th scope="col" className="px-6 py-4">Application &amp; Engineering Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {division.technicalSpecs.map((spec) => (
                    <tr key={spec.parameter} className="transition-colors hover:bg-accent/40">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {spec.parameter}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-brand-700 dark:text-brand-400">
                        {spec.standardValue}
                      </td>
                      <td className="px-6 py-4 text-xs leading-5 text-muted-foreground">
                        {spec.engineeringNotes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {/* 7 — Grouped product / capability registers */}
      {division.groups && division.groups.length > 0 && (
        <Section rule labelledBy="division-detail">
          <SectionIntro
            id="division-detail"
            title={
              division.slug === 'gold-mining'
                ? 'Strategic Mining Directives'
                : 'Products and Sub-Divisions'
            }
            align="stack"
          />
          <div className="mt-14 space-y-14">
            {division.groups.map((group) => (
              <div
                key={group.title}
                className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16"
              >
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    {group.title}
                  </h3>
                  {group.description && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </div>
                <ScopeRegister items={group.items} columns={2} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 8 — Standing Commitments & Quality Verification */}
      <Section tone="sunken" rule labelledBy="division-commitments">
        <SectionIntro
          id="division-commitments"
          title="Standing Quality &amp; EHS Commitments"
          align="stack"
        />
        <Reveal
          kind="draw"
          as="dl"
          className="mt-12 grid gap-x-12 gap-y-10 border-t border-hairline pt-10 lg:grid-cols-3"
        >
          {[
            {
              term: 'Health, Safety & Environment',
              value:
                'Environment, Health and Safety is given absolute priority in all projects the company undertakes, adhering strictly to ISO 14001:2015 and OHSAS 18001:2007 frameworks.',
            },
            {
              term: 'Independent Quality Control',
              value:
                'Recognised quality-control institutions and accredited materials consultants are contracted to perform batch testing that verifies high product quality on every site.',
            },
            {
              term: 'Regional Delivery Footprint',
              value: `Green Ngoria operates across ${company.regions
                .map((r) => r.name)
                .join(
                  ', ',
                )}, with corporate headquarters at Rehema House on Standard Street, Nairobi.`,
            },
          ].map((item) => (
            <RevealItem key={item.term}>
              <dt className="font-display text-base font-bold tracking-tight">
                {item.term}
              </dt>
              <dd className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.value}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* 9 — Division FAQs */}
      {division.faqs && division.faqs.length > 0 && (
        <Section rule labelledBy="faq-heading">
          <SectionIntro
            id="faq-heading"
            title="Frequently Answered Questions"
            lead="Direct technical guidance regarding specifications, contracting models, and delivery timelines."
            align="stack"
          />

          <div className="mx-auto mt-10 max-w-4xl space-y-4">
            {division.faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-hairline bg-card p-6 shadow-sm"
              >
                <h3 className="flex items-start gap-3 font-display text-base font-bold text-foreground">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span>{faq.question}</span>
                </h3>
                <p className="mt-3 pl-8 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 10 — Other Divisions Navigation */}
      <Section tone="sunken" rule labelledBy="other-divisions">
        <SectionIntro
          id="other-divisions"
          title="Explore Other Service Divisions"
          action={
            <Link href="/services">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Open full division index
              </Button>
            </Link>
          }
        />
        <Reveal
          kind="draw"
          as="ul"
          className="mt-12 grid border-t border-hairline sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-10"
        >
          {otherDivisions.map((other) => (
            <RevealItem
              key={other.slug}
              as="li"
              className="border-b border-hairline"
            >
              <Link
                href={`/services/${other.slug}`}
                className="group flex items-center gap-4 py-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline bg-card text-muted-foreground transition-colors duration-micro group-hover:border-brand-500/40 group-hover:text-brand-700 dark:group-hover:text-brand-400">
                  <ServiceIcon name={other.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {other.name}
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    {other.eyebrow}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-subtle transition-transform duration-ui ease-out-expo group-hover:translate-x-1"
                />
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* 11 — Action Banner */}
      <CtaBanner
        title={division.cta.label}
        body={`Reach our customer care on ${company.customerCare.phone} or email ${company.customerCare.email} — or send the details through the request for quotation form and our engineering team will respond with a full proposal.`}
        primary={division.cta}
        secondary={division.secondaryCta ?? { label: 'Contact customer care', href: '/contact' }}
      />
    </>
  );
}
