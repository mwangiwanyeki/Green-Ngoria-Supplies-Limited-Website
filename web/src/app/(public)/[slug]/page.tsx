import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { ScopeRegister } from '@/components/marketing/spec-panel';
import { LifecycleTrack } from '@/components/marketing/lifecycle-track';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { Reveal } from '@/components/marketing/reveal';
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
    title: page.title,
    description: page.description,
    openGraph: {
      title: `${page.title} | ${company.legalName}`,
      description: page.description,
      type: 'website',
      url: `/${slug}`,
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
      <PageHero
        title={page.title}
        lead={page.intro}
        primaryAction={page.primaryCta}
        secondaryAction={{ label: 'Browse the divisions', href: '/services' }}
        facts={[
          { term: 'Capability area', value: page.eyebrow },
          { term: 'Scope items', value: String(page.capabilities.length) },
          { term: 'Delivery stages', value: String(page.lifecycle.length) },
          {
            term: 'Regional coverage',
            value: 'Kenya · Tanzania · Uganda · Rwanda · Burundi',
          },
        ]}
      />

      <Section labelledBy="capability-scope">
        <SectionIntro
          id="capability-scope"
          title="What this capability covers"
          lead={page.description}
          align="stack"
        />
        <Reveal kind="wipe" className="mt-12">
          <ScopeRegister items={page.capabilities} columns={2} />
        </Reveal>
      </Section>

      <Section tone="sunken" rule labelledBy="capability-pathway">
        <SectionIntro
          id="capability-pathway"
          title="The delivery pathway"
          lead="Each stage produces the record the next one depends on, so the project moves forward on evidence rather than assumption."
          align="stack"
        />
        <LifecycleTrack stages={page.lifecycle} className="mt-14" />
      </Section>

      <Section rule width="prose" className="py-16 sm:py-20 lg:py-20">
        <div className="flex gap-5">
          <ShieldCheck
            className="mt-0.5 h-6 w-6 shrink-0 text-brand-600 dark:text-brand-400"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-display text-base font-bold">
              Professional-review boundary
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {page.note}
            </p>
            <Link href="/certifications" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                See our compliance record
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <CtaBanner
        primary={page.primaryCta}
        secondary={{ label: 'Talk to an engineer', href: '/contact' }}
      />
    </>
  );
}
