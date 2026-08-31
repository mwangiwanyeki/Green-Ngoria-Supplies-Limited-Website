/**
 * Content for the capability pages served by `src/app/(public)/[slug]`.
 *
 * Transcribed from the platform capability descriptions already published on
 * the site. Do not add claims, figures or credentials that are not recorded
 * here or in `@/config/company`.
 */

export interface PublicPageContent {
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  capabilities: string[];
  lifecycle: string[];
  note: string;
  primaryCta: { label: string; href: string };
}

export const capabilityPages: Record<string, PublicPageContent> = {
  mining: {
    eyebrow: 'Mining & mineral processing',
    title: 'Mining opportunities connected to engineered delivery',
    description:
      'Gold and gemstone mining in Kenya and Tanzania, connected to the engineering and construction that supports it.',
    intro:
      'Green Ngoria mines gold at Bondo in Siaya County and at Taita Taveta, mines in Tanzania where the company began, and owns two gemstone mines. The engineering, construction, mechanical, electrical and supply divisions exist to support those sites and the plants that serve them.',
    capabilities: [
      'Gold mining at Bondo, Siaya County and at Taita Taveta',
      'Mining activity in Tanzania',
      'Two company-owned gemstone mines — one in Kenya, one in Tanzania',
      'A NEMA-approved small-scale gold processing plant at Bondo',
      'Mechanical and electrical departments supporting plant and machinery',
      'Technical departments each headed by a qualified engineer',
    ],
    lifecycle: [
      'Opportunity',
      'Consultation',
      'Technical assessment',
      'Feasibility and engineering',
      'Plant delivery',
      'Operations support',
    ],
    note: 'Geological resources, reserves and process performance require qualified professional verification and are never inferred by this platform.',
    primaryCta: {
      label: 'See our gold processing plant',
      href: '/gold-processing',
    },
  },
  'mining-plant-engineering': {
    eyebrow: 'Engineering',
    title: 'Coordinated process, mechanical and electrical engineering',
    description:
      'Controlled engineering deliverables for mining and mineral-processing plants.',
    intro:
      'Engineering information is managed as a controlled project record, linking requirements, drawings, specifications, equipment data and approvals.',
    capabilities: [
      'Process-flow and design-basis development',
      'P&IDs, layouts and equipment interfaces',
      'Mechanical and electrical coordination',
      'Specifications and technical datasheets',
      'Revision, review and approval control',
      'Construction and commissioning support',
    ],
    lifecycle: [
      'Requirements',
      'Design basis',
      'Engineering deliverables',
      'Review',
      'Approved-for-use issue',
      'As-built and handover',
    ],
    note: 'Engineering outputs remain subject to discipline review, statutory requirements and project-specific approval.',
    primaryCta: { label: 'Discuss engineering scope', href: '/contact' },
  },
  'mining-plant-construction': {
    eyebrow: 'Construction & installation',
    title: 'Mining-plant construction managed around safe delivery',
    description:
      'Construction, installation and site coordination for mining-plant projects.',
    intro:
      'Site delivery connects approved engineering information to procurement, workforce activity, quality inspections, HSE observations, punch lists and commissioning readiness.',
    capabilities: [
      'Site establishment and construction planning',
      'Civil, structural and building interfaces',
      'Mechanical equipment installation',
      'Electrical and instrumentation installation',
      'Daily progress and inspection records',
      'Punch-list and readiness management',
    ],
    lifecycle: [
      'Mobilization',
      'Civil works',
      'Mechanical installation',
      'Electrical and controls',
      'Inspection',
      'Pre-commissioning',
    ],
    note: 'Construction scope and responsibility boundaries are defined in the contract and approved project execution plan.',
    primaryCta: { label: 'Plan a plant project', href: '/contact' },
  },
  'plant-optimization': {
    eyebrow: 'Plant performance',
    title: 'Find bottlenecks before prescribing modifications',
    description:
      'Structured technical assessment for existing mineral-processing plants.',
    intro:
      'Optimization begins with evidence: process configuration, operating data, equipment condition, sampling context, utilities, constraints and the client’s operating objectives.',
    capabilities: [
      'Process-stage performance review',
      'Equipment condition and constraint capture',
      'Water, power and reagent context',
      'Operational bottleneck identification',
      'Prioritized findings and recommendations',
      'Implementation and follow-up planning',
    ],
    lifecycle: [
      'Baseline',
      'Evidence collection',
      'Findings',
      'Engineering review',
      'Prioritization',
      'Implementation support',
    ],
    note: 'Recommendations are decision-support inputs and require qualified engineering review before implementation.',
    primaryCta: {
      label: 'Assess an existing plant',
      href: '/technical-assessment',
    },
  },
  'technical-assessment': {
    eyebrow: 'Technical plant assessment',
    title: 'Turn plant challenges into a qualified technical opportunity',
    description:
      'A structured intake for mining-site and processing-plant requirements.',
    intro:
      'Capture the site, mineral, process, equipment, performance, utilities, constraints and supporting documents needed for a productive engineering consultation.',
    capabilities: [
      'Project and mining-site context',
      'Mineral and ore characteristics',
      'Existing process and equipment',
      'Performance challenges and objectives',
      'Environmental and HSE constraints',
      'Photographs and controlled attachments',
    ],
    lifecycle: [
      'Project',
      'Site',
      'Mineral',
      'Existing plant',
      'Process',
      'Equipment',
      'Performance',
      'Challenges',
      'Review',
    ],
    note: 'Submitting an assessment does not create certified engineering advice. Green Ngoria reviews the information before defining next steps.',
    primaryCta: { label: 'Start with an RFQ', href: '/request-rfq' },
  },
  equipment: {
    eyebrow: 'Plant equipment',
    title: 'Equipment selected around process duty and project context',
    description:
      'Technical equipment and plant-component sourcing for mining projects.',
    intro:
      'Catalogue information supports technical discussion and RFQ preparation. Availability, final specifications, lead time and commercial terms are confirmed during quotation.',
    capabilities: [
      'Crushing and size-reduction equipment',
      'Grinding and classification equipment',
      'Leaching and adsorption systems',
      'Pumping, piping and material handling',
      'Electrical, instrumentation and controls',
      'Technical datasheets and RFQ support',
    ],
    lifecycle: [
      'Duty definition',
      'Technical selection',
      'RFQ',
      'Supplier comparison',
      'Approval',
      'Delivery and receipt',
    ],
    note: 'Published catalogue entries must not be interpreted as confirmed stock or fixed pricing.',
    primaryCta: { label: 'Request equipment quote', href: '/request-rfq' },
  },
  spares: {
    eyebrow: 'Spares & consumables',
    title: 'Traceable spares support for plant reliability',
    description: 'Spare-parts identification, sourcing and lifecycle support.',
    intro:
      'Requests can be linked to the installed asset, manufacturer reference, equipment duty, urgency and project location to reduce costly specification errors.',
    capabilities: [
      'Asset and equipment identification',
      'Manufacturer and part-reference capture',
      'Critical-spares planning',
      'Technical equivalence review',
      'RFQ and supplier comparison',
      'Delivery and maintenance linkage',
    ],
    lifecycle: [
      'Identify',
      'Verify',
      'Source',
      'Compare',
      'Approve',
      'Deliver',
      'Record against asset',
    ],
    note: 'Compatibility is confirmed against the equipment record and technical documentation before supply.',
    primaryCta: { label: 'Request spare parts', href: '/request-rfq' },
  },
  insights: {
    eyebrow: 'Technical insights',
    title: 'Practical knowledge for mining-plant decisions',
    description:
      'Engineering-led articles on processing plants, delivery and reliability.',
    intro:
      'The insights library is intended for reviewed technical content covering plant assessment, CIP/CIL systems, equipment selection, project controls, HSE, commissioning and maintenance.',
    capabilities: [
      'Plant-assessment guidance',
      'Process and equipment explainers',
      'Engineering document-control practice',
      'Construction and commissioning readiness',
      'HSE and operational reliability',
      'Maintenance and lifecycle planning',
    ],
    lifecycle: [
      'Draft',
      'Technical review',
      'Compliance review',
      'Approval',
      'Publication',
      'Revision',
    ],
    note: 'Technical articles provide general information and do not replace project-specific professional engineering advice.',
    primaryCta: { label: 'Request a technical discussion', href: '/contact' },
  },
};
