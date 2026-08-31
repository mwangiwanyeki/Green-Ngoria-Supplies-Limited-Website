import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/page-hero';
import { Section } from '@/components/marketing/section';
import { ScopeRegister } from '@/components/marketing/spec-panel';
import { capabilityPages } from '@/config/capabilities';
import { company } from '@/config/company';
import { RfqForm } from './rfq-form';

const title = 'Request for Quotation';
const description =
  'Submit an RFQ for equipment, spare parts, plant services or supply. The commercial team responds with a formal quotation.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/request-rfq',
  },
};

export default function RequestRfqPage() {
  const equipment = capabilityPages.equipment;

  return (
    <>
      <PageHero
        title="Request for quotation"
        lead="Submit a requirement for equipment, spare parts, plant services or supply. The commercial team reviews the scope and responds with a formal quotation."
        facts={[
          { term: 'Response', value: 'Formal written quotation' },
          { term: 'Covers', value: 'Equipment · Spares · Services · Supply' },
          { term: 'Enquiries', value: company.contact.emails[0].value },
          { term: 'Telephone', value: company.contact.phones[0].value },
        ]}
      />

      <Section labelledBy="rfq-heading">
        <h2 id="rfq-heading" className="sr-only">
          Quotation request form
        </h2>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
          <RfqForm />

          <aside className="space-y-12">
            <div>
              <h3 className="tech-label">How a request becomes a quotation</h3>
              <ScopeRegister
                items={equipment.lifecycle}
                columns={1}
                className="mt-4"
              />
            </div>
            <div>
              <h3 className="tech-label">What we can quote for</h3>
              <ScopeRegister
                items={equipment.capabilities}
                columns={1}
                className="mt-4"
              />
            </div>
            <p className="measure text-sm leading-7 text-subtle">
              {equipment.note}
            </p>
          </aside>
        </div>
      </Section>
    </>
  );
}
