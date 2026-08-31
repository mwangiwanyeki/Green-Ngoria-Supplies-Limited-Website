import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { ScopeRegister } from '@/components/marketing/spec-panel';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';

const title = 'Certifications & Compliance';
const description =
  'ISO 9001:2015, ISO 14001:2015 and OHSAS 18001:2007, together with company registration, KRA PIN and tax compliance, county permits, mining licences and NEMA approval.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/certifications',
  },
};

export default function CertificationsPage() {
  return (
    <>
      <PageHero
        title="Certified, registered and compliant"
        lead={[
          'Green Ngoria holds quality, environmental and occupational health and safety certifications, and maintains the statutory registrations, permits and approvals required to operate and to bid for work in Kenya.',
          'The credentials below are the ones recorded in the company profile. Documentary copies are held on file and provided during prequalification on request.',
        ]}
        primaryAction={{ label: 'Request our documents', href: '/contact' }}
        secondaryAction={{ label: 'About the company', href: '/about' }}
        facts={[
          {
            term: 'Management standards',
            value: String(company.certifications.length),
          },
          {
            term: 'Statutory records',
            value: String(company.compliance.length),
          },
          {
            term: 'Company number',
            value: company.registration.companyNumber,
          },
          { term: 'KRA PIN', value: company.registration.kraPin },
        ]}
      />

      {/* Management system certifications */}
      <Section labelledBy="standards-heading">
        <SectionIntro
          id="standards-heading"
          title="Three standards behind how we work"
          align="stack"
        />
        <Reveal
          kind="draw"
          as="dl"
          className="mt-12 grid border-t border-hairline lg:grid-cols-3 lg:gap-x-16"
        >
          {company.certifications.map((certification) => (
            <RevealItem
              key={certification.name}
              className="border-b border-hairline py-8 lg:border-b-0"
            >
              <dt>
                <span className="block font-display text-2xl font-bold tracking-tight tabular-figures">
                  {certification.name}
                </span>
                <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-400">
                  {certification.scope}
                </span>
              </dt>
              <dd className="measure mt-4 text-sm leading-7 text-muted-foreground">
                {certification.description}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Statutory compliance */}
      <Section tone="sunken" rule labelledBy="statutory-heading">
        <SectionIntro
          id="statutory-heading"
          title="Statutory compliance held on file"
          lead="These are records the company holds, not downloadable documents. Certified copies are supplied directly to clients and procuring entities as part of a prequalification or tender submission."
          align="stack"
        />
        <Reveal
          kind="draw"
          as="dl"
          className="mt-14 divide-y divide-hairline border-y border-hairline"
        >
          {company.compliance.map((item) => (
            <RevealItem
              key={item.name}
              className="grid gap-2 py-7 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-12"
            >
              <dt className="font-display text-base font-bold tracking-tight">
                {item.name}
              </dt>
              <dd className="measure text-sm leading-7 text-muted-foreground">
                {item.detail}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Policy commitments */}
      <Section rule labelledBy="policy-heading">
        <SectionIntro
          id="policy-heading"
          title="The policies those certificates describe"
          align="stack"
        />
        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal kind="wipe">
            <h3 className="tech-label">Quality assurance</h3>
            <p className="measure mt-4 text-sm leading-7 text-muted-foreground">
              {company.qualityAssurance.summary}
            </p>
            <ScopeRegister
              items={company.qualityAssurance.points}
              columns={1}
              className="mt-6"
            />
          </Reveal>
          <Reveal kind="wipe" delay={0.06}>
            <h3 className="tech-label">Health, safety and environment</h3>
            <p className="measure mt-4 text-sm leading-7 text-muted-foreground">
              {company.hse.summary}
            </p>
            <ScopeRegister
              items={company.hse.points}
              columns={1}
              className="mt-6"
            />
          </Reveal>
        </div>
      </Section>

      <CtaBanner
        title="Prequalifying Green Ngoria?"
        body="Tell us which documents your process requires — registration certificate, KRA PIN, tax compliance certificate, permits or licences — and the office will supply them."
        primary={{ label: 'Request the documents', href: '/contact' }}
        secondary={{ label: 'See completed projects', href: '/projects' }}
      />
    </>
  );
}
