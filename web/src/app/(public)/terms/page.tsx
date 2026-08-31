import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/page-hero';
import { LegalDocument } from '@/components/marketing/legal-document';
import { company } from '@/config/company';

const title = 'Terms of Use';
const description =
  'The terms on which Green Ngoria Supplies Limited makes this website, its published information and its enquiry forms available.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/terms',
  },
};

const sections = [
  {
    heading: 'About these terms',
    body: [
      `This website is published by ${company.legalName}, a private limited company incorporated in Kenya on ${company.registration.incorporated} under company number ${company.registration.companyNumber}, with its head office at ${company.contact.addressOneLine}.`,
      'By using this website you accept the terms set out on this page. If you do not accept them, please do not use the site.',
    ],
  },
  {
    heading: 'Information on this site',
    body: [
      'The pages describing our service divisions, products, operations, projects and credentials are drawn from the Green Ngoria company profile. They are published to describe what the company does.',
      'They are general information, not a technical specification, a professional engineering opinion, or an offer capable of acceptance. Scope, specification, quantities, programme, price and terms for any particular piece of work are fixed only in a written quotation and contract signed by both parties.',
    ],
  },
  {
    heading: 'Enquiries, RFQs and quotations',
    body: [
      'Submitting the enquiry form or a request for quotation does not create a contract and does not oblige Green Ngoria to quote, supply or perform.',
      'A request for quotation is an invitation for us to price a requirement. Any resulting quotation states its own validity period and conditions, and a binding agreement arises only when it is accepted in writing and any conditions in it are met.',
      'Please make sure the information you submit is accurate. Quotations are prepared on the basis of the descriptions, quantities, units and delivery locations you provide.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: [
      'You may read, print and share the information on this site for the purpose of evaluating or working with Green Ngoria.',
      'You may not use the site to submit unlawful, misleading or abusive material, to attempt to gain unauthorised access to the client portal or any other part of the platform, or to interfere with the operation of the site.',
    ],
  },
  {
    heading: 'The client portal',
    body: [
      'Access to the client portal is granted to named users. If you hold portal credentials, you are responsible for keeping them confidential and for activity carried out under your account. Tell us promptly if you believe an account has been compromised.',
    ],
  },
  {
    heading: 'Intellectual property',
    body: [
      'The Green Ngoria name, logo, page content, text, layout and design on this site belong to Green Ngoria Supplies Limited unless stated otherwise. They may not be reproduced for commercial purposes or presented as another party’s material without our written permission.',
    ],
  },
  {
    heading: 'Third-party names',
    body: [
      'Where the names of clients, projects or manufacturers appear on this site, they are used to describe work Green Ngoria has completed or products it has supplied. Those names remain the property of their respective owners and their use here does not imply any endorsement by them.',
    ],
  },
  {
    heading: 'Availability and changes',
    body: [
      'We aim to keep the site available and its information current, but we do not guarantee uninterrupted availability. We may change, add to or remove content, including service and product descriptions, at any time.',
    ],
  },
  {
    heading: 'Governing law',
    body: [
      'These terms and any dispute arising from the use of this website are governed by the laws of Kenya, and the Kenyan courts have jurisdiction over them.',
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Terms of use"
        lead="The basis on which this website and its enquiry forms are made available."
      />

      <LegalDocument
        sections={sections}
        footer={
          <>
            <h2 className="font-display text-lg font-bold tracking-tight">
              Questions about these terms
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Legal and contractual questions are handled by our legal officer.
              Write to{' '}
              <a
                href={`mailto:${company.contact.emails[0].value}`}
                className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {company.contact.emails[0].value}
              </a>{' '}
              or use the{' '}
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
