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
    /** Photograph shown at the top of the rail (public path). */
    image?: string;
    /** Chip caption over the photograph. */
    imageCaption?: string;
    /** Small eyebrow above the rail's title. */
    eyebrow?: string;
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
    feature: {
      image: '/images/gallery/greenngoria-01.webp',
      imageCaption: 'Bondo · NEMA/PR/SYA/002',
      eyebrow: 'Producing gold plant',
      title: 'Ore to poured doré, one integrated operation',
      body: 'Producing concessions in Bondo and Taita Taveta, backed by a licensed CIP/CIL processing circuit at Nyangoma.',
      href: '/gold-processing',
      action: 'Tour the Bondo plant',
    },
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
      image: '/images/gallery/ace4116.webp',
      imageCaption: 'CIP plant · Nyangoma',
      eyebrow: 'Ten in-house divisions',
      title: 'Every division headed by a qualified engineer',
      body: 'One point of contact for mining, plant construction, civil works, electrical, water, fuel and materials — coordinated from Nairobi head office.',
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
    feature: {
      image: '/images/gallery/greenngoria-10.webp',
      imageCaption: 'Ball mill · Bondo',
      eyebrow: 'Turnkey EPC',
      title: 'From engineering to commissioned circuit',
      body: 'Process design, foundation and steelwork, mechanical installation, electrical automation, and post-commissioning optimisation.',
      href: '/technical-assessment',
      action: 'Request a plant assessment',
    },
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
    feature: {
      image: '/images/gallery/dji-0338.webp',
      imageCaption: 'Head office · Nairobi',
      eyebrow: 'Five countries',
      title: 'Operating sites in Kenya and Tanzania, projects across the region',
      body: 'Delivered institutional works in Uganda, Rwanda and Burundi. Customer Care on the ground in Nairobi.',
      href: '/about',
      action: 'About Green Ngoria',
    },
  },
  { label: 'Contact', href: '/contact' },
];
