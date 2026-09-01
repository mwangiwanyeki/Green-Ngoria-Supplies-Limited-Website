import { company } from '@/config/company';
import { siteConfig } from '@/config/site';
import { serviceDivisions } from '@/config/services';

/**
 * Schema.org `Organization` structured data.
 *
 * Every value is taken from the official company profile
 * (`.agents/COMPANY_PROFILE.md`). Nothing here is inferred.
 */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.legalName,
    alternateName: company.shortName,
    slogan: company.tagline,
    url: siteConfig.url,
    description:
      'Green Ngoria Supplies Limited is an enterprise mining and engineering company specializing in gold mining, Carbon-in-Pulp (CIP) and Carbon-in-Leach (CIL) gold processing plant construction, mining machinery and equipment installation, and multi-disciplinary engineering support across Kenya, Tanzania, and East Africa.',
    foundingDate: '2011-09-27',
    legalName: company.legalName,
    identifier: [
      {
        '@type': 'PropertyValue',
        name: 'Company registration number',
        value: company.registration.companyNumber,
      },
      {
        '@type': 'PropertyValue',
        name: 'KRA PIN',
        value: company.registration.kraPin,
      },
      {
        '@type': 'PropertyValue',
        name: 'NEMA Gold Processing Plant Permit',
        value: 'NEMA/PR/SYA/002',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.contact.street,
      addressLocality: company.contact.city,
      addressCountry: 'KE',
      postOfficeBoxNumber: 'P.O. Box 11350-00400',
    },
    email: company.customerCare.email,
    telephone: company.customerCare.phone,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer care',
        telephone: company.customerCare.phone,
        areaServed: ['KE', 'TZ', 'UG', 'RW', 'BI'],
        email: company.customerCare.email,
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales and enquiries',
        telephone: company.customerCare.phone,
        areaServed: ['KE', 'TZ', 'UG', 'RW', 'BI'],
        email: company.customerCare.generalEmail,
      },
    ],
    areaServed: company.regions.map((region) => ({
      '@type': 'Country',
      name: region.name,
    })),
    hasCredential: company.certifications.map((certification) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certification',
      name: certification.name,
      description: certification.scope,
    })),
    knowsAbout: serviceDivisions.map((division) => division.name),
    makesOffer: serviceDivisions.map((division) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: division.name,
        description: division.summary,
        url: `${siteConfig.url}/services/${division.slug}`,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Structured data is static, author-controlled JSON built from config above.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
