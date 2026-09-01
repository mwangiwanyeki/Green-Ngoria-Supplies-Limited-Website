import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileText,
  Clock,
  Layers,
  Wrench,
  HelpCircle,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { ScopeRegister } from '@/components/marketing/spec-panel';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { InteractiveEngineeringGallery } from '@/components/marketing/interactive-engineering-gallery';
import { capabilityPages } from '@/config/capabilities';
import { company } from '@/config/company';

export function generateStaticParams() {
  return Object.keys(capabilityPages).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = capabilityPages[slug];
  if (!page) return {};
  return {
    title: `${page.title} | ${company.legalName}`,
    description: page.description,
    openGraph: {
      title: `${page.title} | ${company.legalName}`,
      description: page.description,
      type: 'website',
      url: `/${slug}`,
      images: page.primaryImage ? [{ url: page.primaryImage.src }] : [],
    },
  };
}

export default async function PublicCapabilityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = capabilityPages[slug];
  if (!page) notFound();

  return (
    <>
      {/* 1 — Comprehensive Hero */}
      <PageHero
        title={page.title}
        lead={page.leadParagraphs && page.leadParagraphs.length > 0 ? page.leadParagraphs : [page.intro]}
        primaryAction={page.primaryCta}
        secondaryAction={page.secondaryCta ?? { label: 'Contact engineering team', href: '/contact' }}
        facts={page.keyMetrics.map((m) => ({
          term: m.label,
          value: `${m.value} (${m.detail})`,
        }))}
      />

      {/* 2 — Primary Hero Feature Visual Banner */}
      {page.primaryImage && (
        <section className="relative -mt-10 border-b border-hairline bg-surface-sunken pb-12 pt-0 sm:-mt-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-panel">
              <div className="relative aspect-[21/9] w-full min-h-[280px] bg-muted sm:min-h-[380px]">
                <Image
                  src={page.primaryImage.src}
                  alt={page.primaryImage.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 sm:bottom-6 sm:left-8 sm:right-8">
                  <div className="max-w-2xl">
                    <span className="rounded-md bg-brand-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-md">
                      {page.primaryImage.badge}
                    </span>
                    <h2 className="mt-2 font-display text-lg font-bold text-white sm:text-2xl">
                      {page.headline}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80 sm:text-sm">
                      {page.primaryImage.caption}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={page.primaryCta.href}>
                      <Button variant="brand" size="sm">
                        {page.primaryCta.label}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3 — Interactive High-Resolution Gallery & Lightbox */}
      {page.gallery && page.gallery.length > 0 && (
        <Section labelledBy="gallery-heading">
          <InteractiveEngineeringGallery
            items={page.gallery}
            headline={`Visual Assets & Field Records — ${page.title}`}
            subhead="Inspect high-resolution mechanical assemblies, 3D CAD flowsheets, on-site construction rigging, and diagnostic testing apparatus. Click any record to zoom up to 2.5x with full pixel clarity."
          />
        </Section>
      )}

      {/* 4 — Technical Scope & Categorized Engineering Deliverables */}
      <Section tone="sunken" rule labelledBy="scope-heading">
        <SectionIntro
          id="scope-heading"
          title="Technical Scope &amp; Certified Deliverables"
          lead={page.description}
          align="stack"
        />

        {page.deliverableCategories && page.deliverableCategories.length > 0 ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {page.deliverableCategories.map((category) => (
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
        ) : (
          <Reveal kind="wipe" className="mt-12">
            <ScopeRegister items={page.capabilities} columns={2} />
          </Reveal>
        )}

        {/* Capabilities Checklist */}
        <div className="mt-12 rounded-2xl border border-hairline bg-card p-6 lg:p-8">
          <h3 className="tech-label text-foreground">Core Competency Register</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {page.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2.5 text-xs leading-5 text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 5 — Engineering Phase-by-Phase Execution Pathway */}
      {page.lifecyclePhases && page.lifecyclePhases.length > 0 && (
        <Section rule labelledBy="pathway-heading">
          <SectionIntro
            id="pathway-heading"
            title="Phase-by-Phase Execution Pathway"
            lead="Every stage produces auditable records and signoff gates so the project advances on verified empirical data rather than assumptions."
            align="stack"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {page.lifecyclePhases.map((phase) => (
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
      {page.technicalSpecs && page.technicalSpecs.length > 0 && (
        <Section tone="sunken" rule labelledBy="specs-heading">
          <SectionIntro
            id="specs-heading"
            title="Design Criteria &amp; Technical Parameters"
            lead="Key engineering tolerances, process capacities, and design standards applicable to this scope."
            align="stack"
          />

          <div className="mt-10 overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-4">Engineering Parameter</th>
                    <th scope="col" className="px-6 py-4">Standard Design Criteria</th>
                    <th scope="col" className="px-6 py-4">Application &amp; Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {page.technicalSpecs.map((spec) => (
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

      {/* 7 — Professional Review & Statutory Boundary */}
      <Section rule width="prose" className="py-16 sm:py-20 lg:py-20">
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/[0.04] p-6 sm:p-8">
          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Registered Engineering Standards &amp; Review Boundary
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {page.note}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/certifications">
                  <Button variant="outline" size="sm">
                    View full compliance record &amp; permits
                  </Button>
                </Link>
                <Link href="/technical-assessment">
                  <Button variant="brand" size="sm">
                    Request technical assessment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 8 — Engineering FAQs */}
      {page.faqs && page.faqs.length > 0 && (
        <Section tone="sunken" rule labelledBy="faq-heading">
          <SectionIntro
            id="faq-heading"
            title="Frequently Answered Engineering Questions"
            lead="Direct technical guidance regarding specifications, implementation, and regulatory compliance."
            align="stack"
          />

          <div className="mx-auto mt-10 max-w-4xl space-y-4">
            {page.faqs.map((faq) => (
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

      {/* 9 — Final Action Banner */}
      <CtaBanner
        primary={page.primaryCta}
        secondary={page.secondaryCta ?? { label: 'Talk to an engineer', href: '/contact' }}
      />
    </>
  );
}
