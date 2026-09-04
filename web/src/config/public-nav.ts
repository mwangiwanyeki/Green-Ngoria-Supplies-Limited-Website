/**
 * Navigation for the public marketing site.
 *
 * Kept separate from `@/config/navigation` (portal and admin navigation) so the
 * public information architecture can evolve with the public content without
 * touching the authenticated areas of the platform.
 *
 * Every href below must resolve to a real route. See:
 *  - `src/app/(public)/*`            — dedicated public routes
 *  - `src/app/(public)/[slug]`       — capability pages
 *  - `src/app/(public)/services/[division]` — the ten service divisions
 */

import { serviceDivisions } from '@/config/services';

export interface PublicNavLink {
  label: string;
  href: string;
  description?: string;
  /** lucide-react icon name, resolved by `ServiceIcon`. */
  icon?: string;
}

export interface PublicNavColumn {
  heading: string;
  links: PublicNavLink[];
}

export interface PublicNavItem {
  label: string;
  href: string;
  /** Grouped panel — the Services mega menu. */
  columns?: PublicNavColumn[];
  /** Single-column panel. */
  children?: PublicNavLink[];
  /** Promoted link rendered in the panel's side rail. */
  feature?: {
    title: string;
    body: string;
    href: string;
    action: string;
  };
}

const divisionLink = (slug: string): PublicNavLink => {
  const division = serviceDivisions.find((d) => d.slug === slug)!;
  return {
    label: division.name,
    href: `/services/${division.slug}`,
    description: division.headline,
    icon: division.icon,
  };
};

export const publicSiteNav: PublicNavItem[] = [
  {
    label: 'Mining & processing',
    href: '/mining',
    children: [
      {
        label: 'Mining overview',
        href: '/mining',
        description: 'How mining work reaches engineered delivery',
      },
      {
        label: 'Gold processing plant',
        href: '/gold-processing',
        description: 'The NEMA-approved Bondo plant and our mining sites',
      },
      {
        label: 'Gold mining',
        href: '/services/gold-mining',
        description: 'Bondo, Taita Taveta and Tanzania',
      },
      {
        label: 'Gemstone mining',
        href: '/services/gemstone-mining',
        description: 'Two company-owned mines, development and marketing',
      },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    columns: [
      {
        heading: 'Mining',
        links: [divisionLink('gold-mining'), divisionLink('gemstone-mining')],
      },
      {
        heading: 'Construction & civil works',
        links: [
          divisionLink('building-works'),
          divisionLink('road-construction'),
          divisionLink('water-projects'),
        ],
      },
      {
        heading: 'Engineering',
        links: [
          divisionLink('mechanical'),
          divisionLink('electrical-services'),
        ],
      },
      {
        heading: 'Importation & supply',
        links: [
          divisionLink('oil-and-petroleum'),
          divisionLink('timber-importation'),
          divisionLink('general-supplies'),
        ],
      },
    ],
    feature: {
      title: 'All ten divisions',
      body: 'Every technical department is headed by a qualified engineer, with staff for construction, supervision and supply.',
      href: '/services',
      action: 'Open the division index',
    },
  },
  {
    label: 'Engineering',
    href: '/mining-plant-engineering',
    children: [
      {
        label: 'Plant engineering',
        href: '/mining-plant-engineering',
        description: 'Process, mechanical and electrical deliverables',
      },
      {
        label: 'Plant construction',
        href: '/mining-plant-construction',
        description: 'Construction, installation and site coordination',
      },
      {
        label: 'Plant optimization',
        href: '/plant-optimization',
        description: 'Improving an installed circuit',
      },
      {
        label: 'Technical assessment',
        href: '/technical-assessment',
        description: 'Structured review of an existing plant',
      },
      {
        label: 'Equipment',
        href: '/equipment',
        description: 'Equipment categories and enquiry route',
      },
      {
        label: 'Spare parts',
        href: '/spares',
        description: 'Spares support for installed plant',
      },
    ],
  },
  {
    label: 'Company',
    href: '/about',
    children: [
      {
        label: 'About Green Ngoria',
        href: '/about',
        description: 'Background, vision, mission and values',
      },
      {
        label: 'Leadership',
        href: '/leadership',
        description: 'The people directing the company',
      },
      {
        label: 'Certifications & compliance',
        href: '/certifications',
        description: 'ISO, OHSAS, registration and permits',
      },
      {
        label: 'Completed projects',
        href: '/projects',
        description: 'Delivered work across East and Central Africa',
      },
      {
        label: 'Gallery',
        href: '/gallery',
        description: 'Photographs from our mines, plants and project sites',
      },
      {
        label: 'Insights',
        href: '/insights',
        description: 'Technical notes from the divisions',
      },
    ],
  },
  { label: 'Contact', href: '/contact' },
];
