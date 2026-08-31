import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/page-hero';
import { LegalDocument } from '@/components/marketing/legal-document';
import { company } from '@/config/company';

const title = 'Privacy Policy';
const description =
  'How Green Ngoria Supplies Limited collects, uses and protects the personal information submitted through this website.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/privacy',
  },
};

const sections = [
  {
    heading: 'Who we are',
    body: [
      `${company.legalName} is a private limited company incorporated in Kenya on ${company.registration.incorporated}, company number ${company.registration.companyNumber}. Our head office is at ${company.contact.addressOneLine}, ${company.contact.postal}.`,
      'We are responsible for the personal information collected through this website and for how it is used.',
    ],
  },
  {
    heading: 'What we collect',
    body: [
      'We only collect the information you choose to send us. The enquiry form on our contact page asks for your name, your company name, your email address, an optional phone number, a subject and your message.',
      'The request-for-quotation form asks for your company name, contact name, contact email, an optional contact phone number, your country and delivery location, a description of the requirement, and the line items you want quoted with quantities and units.',
      'We do not ask for financial details, identity document numbers or payment information through this website.',
    ],
  },
  {
    heading: 'Why we use it',
    body: [
      'Information submitted through the forms is used to respond to your enquiry, to prepare and issue a quotation, and to keep a record of the correspondence relating to a potential or active contract.',
      'If you become a client, information you send us may also be used to administer the resulting project, order or supply contract.',
      'We do not sell personal information, and we do not use it for advertising.',
    ],
  },
  {
    heading: 'Who can see it',
    body: [
      'Enquiries are handled by the Green Ngoria staff who need them to reply — typically the commercial office and the technical department responsible for the division you have contacted.',
      'We may share details with a supplier or subcontractor where that is necessary to price or deliver what you have asked for, and with our professional advisers or a regulator where the law requires it.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'Enquiry and quotation records are retained for as long as they are commercially relevant and for as long as tax, contractual and statutory record-keeping obligations require. When a record is no longer needed for either purpose, it is deleted.',
    ],
  },
  {
    heading: 'Your rights',
    body: [
      'You may ask us what personal information we hold about you, ask for it to be corrected if it is wrong, ask for it to be deleted where we have no continuing legal or contractual reason to keep it, or ask us to stop using it for a particular purpose.',
      'Personal information submitted through this website is handled in line with the Kenyan Data Protection Act, 2019.',
    ],
  },
  {
    heading: 'Cookies and analytics',
    body: [
      'This website uses only the storage needed for the site to function, such as remembering your light or dark theme preference and keeping you signed in if you use the client portal. It does not run third-party advertising trackers.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'If this policy changes, the revised version will be published on this page. Please check back before submitting information if it matters to you how it will be used.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Privacy policy"
        lead="How we handle the information you send us through this website."
      />

      <LegalDocument
        sections={sections}
        footer={
          <>
            <h2 className="font-display text-lg font-bold tracking-tight">
              Contact us about privacy
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Write to{' '}
              <a
                href={`mailto:${company.contact.emails[0].value}`}
                className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {company.contact.emails[0].value}
              </a>{' '}
              or call{' '}
              <a
                href={`tel:${company.contact.phones[0].value.replace(/\s/g, '')}`}
                className="font-mono text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {company.contact.phones[0].value}
              </a>
              . You can also use the{' '}
              <Link
                href="/contact"
                className="font-medium text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:decoration-brand-700 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
              >
                enquiry form
              </Link>
              .
            </p>
          </>
        }
      />
    </>
  );
}
