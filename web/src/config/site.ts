/**
 * Site-level configuration.
 *
 * Company facts (contact details, registration, certifications) are transcribed
 * from the official company profile — see `@/config/company` for the full set.
 * Nothing in this file may be invented: no placeholder phone numbers, no
 * fabricated social profiles, no unverified capability claims.
 */

import { company } from '@/config/company';

export const siteConfig = {
  name: company.legalName,
  shortName: company.shortName,
  description:
    'Gold and gemstone mining, building works, road construction, water projects, mechanical and electrical services, oil and petroleum, timber importation and general supplies across East and Central Africa.',
  tagline: company.tagline,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://greenngoria.com',
  portalUrl:
    process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.greenngoria.com',
  adminUrl:
    process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.greenngoria.com',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'https://api.greenngoria.com',

  contact: {
    email: company.contact.emails[0].value,
    phone: company.contact.phones[0].value,
    address: company.contact.addressOneLine,
    regions: company.regions.map((region) => region.name).join(' · '),
  },

  incorporated: company.registration.incorporated,
  country: company.contact.country,

  /** The ten service divisions, by name. */
  capabilities: [
    'Gold Mining',
    'Gemstone Mining',
    'Building Works',
    'Road Construction',
    'Water Projects',
    'Mechanical',
    'Electrical Services',
    'Oil & Petroleum',
    'Timber Importation',
    'General Supplies',
  ],

  certifications: company.certifications.map((certification) => ({
    name: certification.name,
    note: certification.scope,
  })),

  values: company.values.map((value) => value.name),
} as const;

export type SiteConfig = typeof siteConfig;
