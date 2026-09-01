import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { Reveal } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { LeadershipSection } from '@/components/marketing/leadership-section';
import { company } from '@/config/company';
import { ShieldCheck, Award, Quote } from 'lucide-react';

const title = 'Executive Leadership & Technical Governance';
const description =
  'Meet the Board of Directors, Executive Management, and Technical Engineering Leads directing Green Ngoria Supplies Limited across East Africa.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/leadership',
  },
};

export default function LeadershipPage() {
  const chair = company.leadership[0];

  return (
    <>
      <PageHero
        title="Engineering-Led Leadership & Technical Governance"
        lead={[
          'Green Ngoria is directed by a seasoned executive board covering mineral strategy, operational plant execution, legal compliance, and metallurgical processing.',
          'Every technical discipline is directed by certified professional engineers, delivering turnkey gold CIP/CIL processing plants and industrial infrastructure across East & Central Africa.',
        ]}
        primaryAction={{ label: 'Contact Executive Office', href: '/contact' }}
        secondaryAction={{ label: 'Technical Plant Assessment', href: '/request-plant-assessment' }}
        facts={[
          { term: 'Board Governance', value: '4 Key Principals' },
          { term: 'Head Office', value: 'Nairobi, Kenya' },
          { term: 'Regional Reach', value: 'Kenya, Uganda, Tanzania' },
          {
            term: 'Technical Execution',
            value: 'Each Division Headed by Qualified Engineers',
          },
        ]}
      />

      {/* ── Main Interactive Team Section with Pop-Up Detail Modals ── */}
      <Section labelledBy="team-heading">
        <SectionIntro
          id="team-heading"
          title="Board of Directors & Executive Management"
          lead="Click on any executive director or manager to inspect their full executive dossier, operational mandate, strategic focus portfolios, and direct contact coordinates."
          align="stack"
        />

        <div className="mt-12">
          <LeadershipSection />
        </div>
      </Section>

      {/* ── Shareholding & Corporate Governance ── */}
      <Section tone="sunken" rule labelledBy="governance-heading">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
          <Reveal kind="rise">
            <div className="space-y-4">
              <span className="tech-label">EQUITY &amp; STATUTORY GOVERNANCE</span>
              <h2
                id="governance-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
              >
                Shareholding &amp; Capital Structure
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Incorporated under the Companies Act 2015 as a private limited company (CPR/2011/57284). Nominal share capital: <span className="font-semibold text-foreground">{company.shareholding.nominalCapital}</span>.
              </p>
            </div>

            {/* Equity Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-sunken border border-hairline p-0.5">
                <div className="h-full rounded-l-full bg-teal-600" style={{ width: '50%' }} title="Davis Mragha Ngoo (50%)" />
                <div className="h-full bg-amber-500" style={{ width: '25%' }} title="Kenneth Madete Namboga (25%)" />
                <div className="h-full rounded-r-full bg-indigo-500" style={{ width: '25%' }} title="Raymond Nyange Ngoo (25%)" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-600" /> Davis (50%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Kenneth (25%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Raymond (25%)</span>
              </div>
            </div>

            <div className="mt-6 divide-y divide-hairline rounded-2xl border border-hairline bg-card p-6 shadow-card">
              {company.shareholding.directors.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <span className="font-display text-sm font-bold text-foreground">
                      {d.name}
                    </span>
                    <div className="text-xs text-muted-foreground">Ordinary Shareholder</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400">
                      {d.shares} shares
                    </span>
                    <div className="font-mono text-xs text-muted-foreground">
                      {d.percentage} Equity
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal kind="rise" delay={0.08}>
            <div className="space-y-4">
              <span className="tech-label">CORE OPERATIONAL VALUES</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Corporate Governance Standards
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Operating with institutional accountability across Kenya, Tanzania, Uganda, Rwanda, and Burundi.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {company.values.slice(0, 6).map((val) => (
                <div
                  key={val.name}
                  className="rounded-xl border border-hairline bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <h4 className="font-display text-xs font-bold text-foreground">
                      {val.name}
                    </h4>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── Chairperson's Official Message ── */}
      <Section tone="sunken" rule width="prose" labelledBy="chair-heading">
        <div className="relative rounded-3xl border border-hairline bg-card/90 p-8 sm:p-12 shadow-card backdrop-blur-md">
          <Quote className="h-10 w-10 text-brand-600/20 absolute right-8 top-8" />

          <h2 id="chair-heading" className="tech-label">
            THE CHAIRPERSON&rsquo;S MESSAGE
          </h2>

          <Reveal kind="unblur" className="mt-6">
            <blockquote className="space-y-4">
              {company.chairmanMessage.map((paragraph) => (
                <p
                  key={paragraph}
                  className="font-display text-base sm:text-lg font-medium leading-relaxed text-foreground/90"
                >
                  &ldquo;{paragraph}&rdquo;
                </p>
              ))}
            </blockquote>

            <div className="mt-8 pt-6 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-display text-base font-bold text-brand-700 dark:text-brand-400">
                  &ldquo;{company.chairmanMotto}&rdquo;
                </p>
                <p className="mt-1 text-xs font-mono text-muted-foreground">
                  {chair.name} · {chair.role}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
                <Award className="h-3.5 w-3.5" />
                Est. September 2011
              </span>
            </div>
          </Reveal>
        </div>
      </Section>

      <CtaBanner
        title="Consult directly with our leadership team"
        body="Technical plant assessments, mineral concession feasibility, EPC prequalifications, and corporate inquiries are managed directly from our Nairobi headquarters."
        primary={{ label: 'Contact Executive Office', href: '/contact' }}
        secondary={{
          label: 'Request Plant Assessment',
          href: '/request-plant-assessment',
        }}
      />
    </>
  );
}
