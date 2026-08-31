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
      'Green Ngoria Supplies Limited is a Kenyan company providing gold and gemstone mining, building works, road construction, water projects, mechanical and electrical services, oil and petroleum supply, timber importation and general supplies across East and Central Africa.',
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
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.contact.street,
      addressLocality: company.contact.city,
      addressCountry: 'KE',
      postOfficeBoxNumber: 'P.O. Box 11350-00400',
    },
    email: company.contact.emails[0].value,
    telephone: company.contact.phones.map((phone) => phone.value),
    contactPoint: company.contact.phones.map((phone) => ({
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: phone.value,
      areaServed: phone.label === 'Uganda' ? 'UG' : 'KE',
      email: company.contact.emails[0].value,
    })),
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
