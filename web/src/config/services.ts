/**
 * The ten service divisions of Green Ngoria Supplies Limited.
 *
 * Content is drawn from the official company profile (`.agents/COMPANY_PROFILE.md`).
 * Capability and product lists are the profile's own lists — do not extend them
 * with services, products or figures that are not in that source.
 */

export interface ServiceGroup {
  title: string;
  description?: string;
  items: string[];
}

export interface ServiceDivision {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  /** Short description used in cards, nav and page metadata. */
  summary: string;
  /** Two or three opening paragraphs for the detail page. */
  intro: string[];
  /** Icon name from lucide-react. */
  icon: string;
  /** Primary scope bullets. */
  scope: string[];
  /** Grouped product / capability lists. */
  groups?: ServiceGroup[];
  /** Where the work is delivered or which sectors it serves. */
  reach?: { title: string; items: string[] };
  cta: { label: string; href: string };
}

export const serviceDivisions: ServiceDivision[] = [
  {
    slug: 'gold-mining',
    name: 'Gold Mining',
    eyebrow: 'Mining',
    headline: 'Gold mining across Kenya and Tanzania',
    summary:
      'All aspects of gold mining services, with operating sites in Bondo (Siaya County), Taita Taveta and Tanzania.',
    intro: [
      'Green Ngoria provides all aspects of gold mining services. The company began by pursuing mining activities in Tanzania and later extended its operations into Bondo in Siaya County, Kenya, and into Taita Taveta.',
      'Mining is the discipline the rest of the business grew around: the engineering, construction, mechanical, electrical and supply divisions all exist to support producing sites and the plants that serve them.',
      'A small-scale gold processing plant at Bondo, Siaya, approved by NEMA, sits at the centre of the Kenyan operation.',
    ],
    icon: 'Pickaxe',
    scope: [
      'Gold mining operations at Bondo, Siaya County, Kenya',
      'Gold mining operations at Taita Taveta, Kenya',
      'Gold mining operations in Tanzania',
      'Small-scale gold processing plant at Bondo, Siaya',
      'Mining licences held with stamp duty paid in October 2019',
      'Site work carried out under the company health, safety and environment policy',
    ],
    groups: [
      {
        title: 'Growth strategy',
        description:
          'The six commitments that direct how the mining business is run.',
        items: [
          'Growing production',
          'Growing margins',
          'Growing partnerships',
          'Growing people',
          'Growing reserves',
          'Growing safety',
        ],
      },
    ],
    cta: { label: 'Discuss a mining project', href: '/contact' },
  },
  {
    slug: 'gemstone-mining',
    name: 'Gemstone Mining',
    eyebrow: 'Mining',
    headline: 'International gemstone mining, development and marketing',
    summary:
      'Gemstone mining, development and marketing, supported by two company-owned mines — one in Kenya and one in Tanzania.',
    intro: [
      'Green Ngoria is involved in international gemstone mining, development and marketing.',
      'The company owns two gemstone mines: one in Kenya and one in Tanzania. Both sit within the same operating framework as the gold business — qualified engineers heading each technical department, and environmental management held to the standards set out in the company policy.',
    ],
    icon: 'Gem',
    scope: [
      'International gemstone mining',
      'Mine development',
      'Gemstone marketing',
      'One company-owned gemstone mine in Kenya',
      'One company-owned gemstone mine in Tanzania',
    ],
    cta: { label: 'Enquire about gemstones', href: '/contact' },
  },
  {
    slug: 'building-works',
    name: 'Building Works',
    eyebrow: 'Construction',
    headline: 'New build, renovation and refurbishment',
    summary:
      'New buildings, renovation, restoration, partitioning, finishes and painting — the division behind our completed bank and institutional projects in Rwanda and Burundi.',
    intro: [
      'The building works division covers new buildings through to detailed interior finishing. It is the division behind the majority of Green Ngoria’s completed projects across East and Central Africa.',
      'That portfolio includes bank branch renovations for Banque Populaire du Rwanda, Fina Bank and Bank of Kigali, headquarters refurbishment for Soras, aluminium windows, doors and curtain walling for the Kabgayi Diocese Building, and the design and build of a lift shaft core at Hotel Amahoro in Burundi.',
    ],
    icon: 'Building2',
    scope: [
      'New buildings',
      'Renovation',
      'Restoration',
      'Partitioning',
      'Finishes',
      'Painting',
    ],
    cta: { label: 'See completed projects', href: '/projects' },
  },
  {
    slug: 'road-construction',
    name: 'Road Construction',
    eyebrow: 'Civil works',
    headline: 'Roads, bridges, culverts and storm drainage',
    summary:
      'Site clearance through to asphaltic concrete, surface dressing and overlays, plus bridges, box culverts and storm drainage systems.',
    intro: [
      'Green Ngoria’s road construction division handles the full civil sequence, from first site clearance through formation and stabilisation to the finished running surface.',
      'The same division delivers the structures and drainage that go with a road: bridges, box culverts and storm drainage systems.',
    ],
    icon: 'Route',
    scope: [
      'Site clearance',
      'Sub-base and base formation',
      'Soil stabilization',
      'Asphaltic concrete laying',
      'Surface dressing',
      'Asphaltic concrete overlays',
      'Bridges',
      'Box culverts',
      'Storm drainage systems',
    ],
    cta: { label: 'Discuss a roads package', href: '/contact' },
  },
  {
    slug: 'water-projects',
    name: 'Water Projects',
    eyebrow: 'Civil works',
    headline: 'Water supply, reticulation and sewerage',
    summary:
      'Water supply projects, water reticulation systems, and water and sewerage works.',
    intro: [
      'The water division delivers water supply schemes and the reticulation systems that distribute them, together with water and sewerage works.',
      'Like every technical department at Green Ngoria, it is headed by a qualified engineer, with qualified staff available for construction and supervision.',
    ],
    icon: 'Droplets',
    scope: [
      'Water supply projects',
      'Water reticulation systems',
      'Water and sewerage works',
    ],
    cta: { label: 'Discuss a water project', href: '/contact' },
  },
  {
    slug: 'mechanical',
    name: 'Mechanical',
    eyebrow: 'Engineering',
    headline: 'A decade of mechanical works contracts',
    summary:
      'More than ten years of mechanical works contracts, including specialised erection work in the oil industry and power sector.',
    intro: [
      'Green Ngoria has carried out mechanical works contracts for more than ten years.',
      'The company’s engineers bring long practical experience in engineering, construction and specialised erection — particularly in the oil industry and the power sector.',
      'Mechanical scope has also been delivered as part of building projects: the design and build of the lift shaft core at Hotel Amahoro in Burundi included the supply of a Schindler lift.',
    ],
    icon: 'Cog',
    scope: [
      'Mechanical works contracts',
      'Specialised erection work',
      'Oil industry mechanical scope',
      'Power sector mechanical scope',
      'Plant and equipment installation on company projects',
    ],
    cta: { label: 'Discuss mechanical scope', href: '/contact' },
  },
  {
    slug: 'electrical-services',
    name: 'Electrical Services',
    eyebrow: 'Engineering',
    headline: 'Design, construct, commission and maintain',
    summary:
      'Electrical, instrumentation and communication services from design and construct through testing, commissioning and preventive maintenance.',
    intro: [
      'The electrical division works across the whole life of an installation: design and construct, commissioning, and ongoing maintenance support.',
      'Scope covers electrical, instrumentation and communication services, product installation, testing and commissioning, preventive maintenance, automation, and energy-saving solutions.',
    ],
    icon: 'Zap',
    scope: [
      'Design and construct',
      'Commissioning',
      'Maintenance support',
      'Electrical services',
      'Instrumentation services',
      'Communication services',
      'Product installation',
      'Testing and commissioning',
      'Preventive maintenance',
      'Automation',
      'Energy-saving solutions',
    ],
    reach: {
      title: 'Sectors served',
      items: [
        'Industry',
        'Financial services',
        'Insurance',
        'Information technology',
        'Manufacturing',
        'Government ministries',
      ],
    },
    cta: { label: 'Discuss an electrical package', href: '/contact' },
  },
  {
    slug: 'oil-and-petroleum',
    name: 'Oil & Petroleum',
    eyebrow: 'Importation & supply',
    headline: 'Six divisions across the petroleum value chain',
    summary:
      'Petroleum, Lubricants, Chemicals, Logistics, Infrastructure and Retail — including fuel optimisation solutions for clients in all 47 counties of Kenya.',
    intro: [
      'Green Ngoria’s oil importation business is organised into six divisions: Petroleum, Lubricants, Chemicals, Logistics, Infrastructure and Retail.',
      'Together they cover product supply, the logistics that move it, the depots and stations that hold and sell it, and the technical design work behind new fuel infrastructure.',
      'The division provides fuel optimisation solutions for clients in all 47 counties of Kenya.',
    ],
    icon: 'Fuel',
    scope: [
      'Petroleum',
      'Lubricants',
      'Chemicals',
      'Logistics',
      'Infrastructure',
      'Retail',
    ],
    groups: [
      {
        title: 'Petroleum products',
        items: [
          'Diesel',
          'Petrol',
          'Paraffin',
          'Heavy Fuel Oil (HFO)',
          'LPG',
          'Gases and gas mixtures',
          'Jet fuel',
          'Aviation gasoline',
          'Bitumen',
        ],
      },
      {
        title: 'Lubricants',
        items: [
          'Automotive lubricants',
          'On-road transportation — trucks and buses',
          'Off-road equipment — earth-moving machinery',
          'Marine and railroad lubricants',
          'Industrial lubricants',
        ],
      },
      {
        title: 'Chemicals',
        items: ['Polymers', 'Solvents', 'Fertilisers'],
      },
      {
        title: 'Infrastructure',
        description:
          'Technical and regulatory work behind new fuel storage and handling facilities.',
        items: [
          'Site selection',
          'Depot design',
          'Regulatory compliance and approval',
          'Construction',
        ],
      },
      {
        title: 'Retail',
        items: [
          'Design and development of fuel stations for new businesses',
          'Design and development of fuel stations for existing businesses',
        ],
      },
    ],
    reach: {
      title: 'Coverage',
      items: [
        'Fuel optimisation solutions for clients in all 47 counties of Kenya',
      ],
    },
    cta: { label: 'Request a fuel supply quote', href: '/request-rfq' },
  },
  {
    slug: 'timber-importation',
    name: 'Timber Importation',
    eyebrow: 'Importation & supply',
    headline: 'Certified hardwood, softwood and bespoke timber products',
    summary:
      'Certified tropical hardwood and softwood, treated timber, decking, crane mats, utility poles and custom-milled special sizes.',
    intro: [
      'Green Ngoria imports and supplies certified timber across a wide product range — from sawn hardwood and round logs through to finished decking, bollards and live edge tabletop slabs.',
      'Product is supplied for external applications, heavy construction, fabrication yards, marine work, civil construction and oil field development.',
    ],
    icon: 'TreePine',
    scope: [
      'Certified Deciduous Hardwood Sawn Timber',
      'Certified Hardwood and Softwood Round Logs',
      'Certified Tropical Hardwood',
      'Coniferous Softwood',
      'Crane Mats, Skid Mats and Fenders',
      'Custom Milled Special Sizes',
      'Decking and Burmese Teak Decking',
      'Dunnage and Shoring Timber',
      'Hardwood Railroad Ties and Marine Timber Piling',
      'Rustic Furniture and Live Edge Tabletop Slabs',
      'Timber Seasoning and Treatment',
      'Utility Poles, Wooden Bollards and Fence Posts',
    ],
    groups: [
      {
        title: 'Product categories',
        items: [
          'Tropical Hardwood Timber — standard sizes (D70 and D60 grade)',
          'Tropical Hardwood Timber — special sizes (D70 and D60 grade)',
          'Softwood — standard sizes',
          'Softwood — special sizes',
          'Pressure Treated Timber',
          'Bespoke Timber Products',
          'Heavy Duty Timber Decking',
          'Timber Posts and Bollards',
          'Plywood',
        ],
      },
    ],
    reach: {
      title: 'Applications',
      items: [
        'External applications',
        'Heavy construction',
        'Fabrication yards',
        'Marine — shipyards and dry docks',
        'Civil construction works',
        'Oil field development',
      ],
    },
    cta: { label: 'Request a timber quote', href: '/request-rfq' },
  },
  {
    slug: 'general-supplies',
    name: 'General Supplies',
    eyebrow: 'Importation & supply',
    headline: 'General merchandise, office and relief supplies',
    summary:
      'General merchandise, office supplies and relief supplies for consumer companies, the financial sector, NGOs and government.',
    intro: [
      'The general supplies division handles general merchandise, office supplies and relief supplies.',
      'It serves clients in consumer companies, the financial sector, the NGO sector and the government sector.',
    ],
    icon: 'Package',
    scope: ['General merchandise', 'Office supplies', 'Relief supplies'],
    reach: {
      title: 'Client sectors',
      items: [
        'Consumer companies',
        'Financial sector',
        'NGO sector',
        'Government sector',
      ],
    },
    cta: { label: 'Request a supply quote', href: '/request-rfq' },
  },
];

export const serviceDivisionsBySlug: Record<string, ServiceDivision> =
  Object.fromEntries(serviceDivisions.map((d) => [d.slug, d]));

export function getServiceDivision(slug: string): ServiceDivision | undefined {
  return serviceDivisionsBySlug[slug];
}
