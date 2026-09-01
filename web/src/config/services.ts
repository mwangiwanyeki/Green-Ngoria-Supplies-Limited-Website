/**
 * The ten service divisions of Green Ngoria Supplies Limited.
 *
 * Content is drawn from and expands the official company profile,
 * linking civil, mechanical, electrical, mining, energy, and supply deliverables
 * with high-resolution imagery and engineering specifications.
 */

export interface ServiceGroup {
  title: string;
  description?: string;
  items: string[];
}

export interface ServiceGalleryItem {
  src: string;
  title: string;
  caption: string;
  tag: string;
}

export interface TechnicalDeliverableCategory {
  category: string;
  items: {
    name: string;
    standard?: string;
    description: string;
  }[];
}

export interface LifecyclePhase {
  phase: string;
  title: string;
  objective: string;
  deliverables: string[];
  milestoneRecord: string;
}

export interface TechnicalSpecification {
  parameter: string;
  standardValue: string;
  engineeringNotes: string;
}

export interface ServiceDivision {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  summary: string;
  intro: string[];
  icon: string;
  primaryImage: {
    src: string;
    alt: string;
    caption: string;
    badge: string;
  };
  keyMetrics: {
    label: string;
    value: string;
    detail: string;
  }[];
  gallery: ServiceGalleryItem[];
  scope: string[];
  deliverableCategories: TechnicalDeliverableCategory[];
  lifecyclePhases: LifecyclePhase[];
  technicalSpecs: TechnicalSpecification[];
  groups?: ServiceGroup[];
  reach?: { title: string; items: string[] };
  faqs: {
    question: string;
    answer: string;
  }[];
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export const serviceDivisions: ServiceDivision[] = [
  {
    slug: 'gold-mining',
    name: 'Gold Mining & Mineral Extraction',
    eyebrow: 'Mining Operations',
    headline: 'Active gold vein mining, concessions and mineral processing across East Africa',
    summary:
      'Turnkey gold mining operations, shaft sinking, vein extraction, and NEMA-approved CIP/CIL processing facilities in Bondo, Taita Taveta, and Tanzania.',
    intro: [
      'Green Ngoria provides all aspects of gold mining services. The company began by pursuing mining activities in Tanzania and later extended its operations into Bondo in Siaya County, Kenya, and into Taita Taveta.',
      'Mining is the core discipline the rest of the business grew around: our engineering, construction, mechanical, electrical and supply divisions all exist to support producing sites and the processing plants that serve them.',
      'A small-scale gold processing plant at Nyangoma, Bondo Sub-County, approved by NEMA (Permit Ref: NEMA/PR/SYA/002), sits at the operational centre of our Kenyan gold extraction activity.',
    ],
    icon: 'Pickaxe',
    primaryImage: {
      src: '/images/mining/poured-dore-bar-bondo.webp',
      alt: 'Poured gold doré bullion bar produced on site at Green Ngoria Bondo mine',
      caption: 'Refined gold doré bullion bar smelted and poured directly from Green Ngoria’s operating Bondo gold facility.',
      badge: 'Active Gold Production',
    },
    keyMetrics: [
      { label: 'Mining Concessions', value: 'Kenya & Tanzania', detail: 'Bondo, Taita Taveta & Tanzanian Assets' },
      { label: 'Processing Plant', value: 'NEMA Approved', detail: 'Permit Ref: NEMA/PR/SYA/002' },
      { label: 'Extraction Circuits', value: 'CIP / CIL / Gravity', detail: 'Shaking Tables & Cyanidation' },
      { label: 'Licensing Status', value: 'Stamp Duty Paid', detail: 'Ministry of Mining Compliance' },
    ],
    gallery: [
      {
        src: '/images/mining/poured-dore-bar-bondo.webp',
        title: 'Poured Gold Doré Bullion',
        caption: 'Poured gold doré bar smelted on site from Bondo processing plant output.',
        tag: 'Gold Doré',
      },
      {
        src: '/images/mining/gold-nuggets-raw.webp',
        title: 'Natural High-Grade Nuggets',
        caption: 'Coarse native gold nuggets recovered through gravity sluicing and optical sorting.',
        tag: 'Native Gold',
      },
      {
        src: '/images/mining/production-weighed-digital-scale.webp',
        title: 'Precision Assay & Bullion Weighing',
        caption:
          'Refined gold bullion bars batch weighed (4.207 kg) on certified digital analytical scales for assay verification and custody transfer.',
        tag: 'Assay Verification',
      },
      {
        src: '/images/mining/gold-ore-specimen.webp',
        title: 'Quartz Vein Mineralization',
        caption: 'High-grade gold ore specimen showing visible gold mineralization in quartz matrix.',
        tag: 'Ore Geology',
      },
      {
        src: '/images/mining/drilling-rig-mast.webp',
        title: 'Exploration Core Drilling',
        caption: 'Deep exploration diamond drill rig investigating orebody continuity and grade.',
        tag: 'Exploration',
      },
    ],
    scope: [
      'Gold mining operations at Bondo, Siaya County, Kenya',
      'Gold mining operations at Taita Taveta, Kenya',
      'Gold mining operations and concessions in Tanzania',
      'NEMA-approved small-scale gold processing plant at Bondo, Siaya',
      'Mining licences held with stamp duty paid in October 2019',
      'Responsible environmental containment and lined tailings storage',
      'Full statutory compliance under the Kenya Mining Act and NEMA regulations',
    ],
    deliverableCategories: [
      {
        category: 'Mining & Extraction Scope',
        items: [
          {
            name: 'Underground Vein Shaft Sinking',
            standard: 'Mining Safety Code',
            description: 'Vertical and inclined shaft sinking with reinforced timbering, hoisting gear, and ventilation.',
          },
          {
            name: 'Open-Cast & Alluvial Extraction',
            standard: 'Civil Earthworks',
            description: 'Excavation of surface ore deposits and alluvial gravel beds feeding primary scrubbers.',
          },
          {
            name: 'CIP/CIL Processing & Smelting',
            standard: 'NEMA Approved',
            description: 'Closed-circuit crushing, ball milling, gravity concentrators, CIL cyanidation, and bullion smelting.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Prospecting & Geochemical Mapping',
        objective: 'Trenching, geochemical soil sampling, and structural vein mapping across concession coordinates.',
        deliverables: ['Geological Map', 'Surface Assay Log'],
        milestoneRecord: 'Target Delineation',
      },
      {
        phase: 'Phase 02',
        title: 'Shaft Sinking & Ore Intersect',
        objective: 'Excavate access shaft, install hoisting headframes, and establish ventilation and dewatering.',
        deliverables: ['Shaft Engineering Log', 'Dewatering Records'],
        milestoneRecord: 'Orebody Intersect Gate',
      },
      {
        phase: 'Phase 03',
        title: 'Commercial Extraction & Plant Feed',
        objective: 'Extract gold-bearing ore, crush, mill, and recover doré bullion at the Bondo facility.',
        deliverables: ['Daily Production Records', 'Doré Assays', 'Royalty Filings'],
        milestoneRecord: 'Commercial Bullion Smelt',
      },
    ],
    technicalSpecs: [
      { parameter: 'Target Commodities', standardValue: 'Gold (Au), Silver (Ag) by-product', engineeringNotes: 'Primary quartz vein and alluvial deposits' },
      { parameter: 'Environmental Licence', standardValue: 'NEMA/PR/SYA/002', engineeringNotes: 'Issued by County Director of Environment, Siaya' },
      { parameter: 'Doré Bullion Purity', standardValue: '88% – 96% Au content prior to refining', engineeringNotes: 'Directly smelted using induction furnaces' },
    ],
    groups: [
      {
        title: 'Growth Strategy Commitments',
        description: 'The six strategic pillars that guide Green Ngoria’s mining operations.',
        items: [
          'Growing production throughput responsibly',
          'Growing operating margins through in-house plant engineering',
          'Growing international and regional joint-venture partnerships',
          'Growing skilled local workforce and engineering talent',
          'Growing geological reserves through disciplined exploration',
          'Growing safety standards with zero-harm EHS policies',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does Green Ngoria partner with international mining investors?',
        answer: 'Yes. We engage with institutional investors and joint-venture partners on concession expansion, exploration drilling, and processing plant upgrades.',
      },
      {
        question: 'How is environmental protection maintained at the Bondo processing plant?',
        answer: 'The plant operates under NEMA approval Ref: NEMA/PR/SYA/002, featuring impermeable lined tailings containment, cyanide destruction protocols, and zero untreated discharge.',
      },
    ],
    cta: { label: 'Discuss a Mining Opportunity', href: '/contact' },
    secondaryCta: { label: 'Explore Bondo Processing Plant', href: '/gold-processing' },
  },

  {
    slug: 'gemstone-mining',
    name: 'Gemstone Mining & Mineral Properties',
    eyebrow: 'Mining Operations',
    headline: 'International gemstone mining, concession development and marketing',
    summary:
      'Precious colored gemstone mining and marketing, backed by two company-owned mines in Kenya and Tanzania producing Tanzanite, Tsavorite, Sapphire, and Ruby.',
    intro: [
      'Green Ngoria is involved in international gemstone mining, concession development and direct marketing of precious colored stones.',
      'The company owns two gemstone mines: one in Kenya and one in Tanzania. Both sit within the same disciplined operating framework as our gold business — qualified engineers heading each technical site, and environmental stewardship held to strict standards.',
      'We handle both rough mineral crystals and certified cut stones, marketing to international buyers in the global gemstone trade with complete chain-of-custody traceability.',
    ],
    icon: 'Gem',
    primaryImage: {
      src: '/images/gemstones/cut-tanzanite-parcel.webp',
      alt: 'Graded faceted Tanzanite gemstones from Green Ngoria concession in Tanzania',
      caption: 'International-grade faceted Tanzanite gemstones mined from company-owned concessions.',
      badge: 'Certified Gemstones',
    },
    keyMetrics: [
      { label: 'Company Mines', value: '2 Concessions', detail: 'Kenya & Tanzania Assets' },
      { label: 'Varieties', value: '5 Precious Species', detail: 'Tanzanite, Tsavorite, Sapphire, Ruby' },
      { label: 'Grading Framework', value: 'GIA Standard', detail: 'Color, Clarity, Cut & Carat' },
      { label: 'Traceability', value: '100% Provenance', detail: 'Direct Mine-to-Market' },
    ],
    gallery: [
      {
        src: '/images/gemstones/cut-tanzanite-parcel.webp',
        title: 'Cut Tanzanite Parcel',
        caption: 'Cut Tanzanite parcel graded for international buyers.',
        tag: 'Tanzanite',
      },
      {
        src: '/images/gemstones/cut-blue-sapphire.webp',
        title: 'Faceted Blue Sapphire',
        caption: 'Faceted Blue Sapphire gemstone exhibiting vivid saturation.',
        tag: 'Sapphire',
      },
      {
        src: '/images/gemstones/ruby-in-matrix.webp',
        title: 'Ruby in Matrix',
        caption: 'Natural Ruby crystal specimen in host mineral matrix.',
        tag: 'Corundum',
      },
      {
        src: '/images/gemstones/green-tsavorite-rough.webp',
        title: 'Green Tsavorite Rough',
        caption: 'Rough Green Tsavorite garnet crystal from Kenyan concession.',
        tag: 'Tsavorite',
      },
      {
        src: '/images/gemstones/tanzanite-rough-crystal.webp',
        title: 'Rough Tanzanite Specimen',
        caption: 'Uncut rough Tanzanite crystal directly from mine extraction.',
        tag: 'Rough Crystal',
      },
    ],
    scope: [
      'International gemstone mining and underground development',
      'Two company-owned gemstone mines — one in Kenya, one in Tanzania',
      'Optical sorting, sorting by refractive index, and rough crystal grading',
      'Precision lapidary cutting, faceting, and polishing to international standards',
      'Marketing to regional and international gemological buyers',
      'Acquisition and valuation of new gemstone-bearing properties in East Africa',
    ],
    deliverableCategories: [
      {
        category: 'Gemstone Varieties Handled',
        items: [
          {
            name: 'Tanzanite (Zoisite Species)',
            standard: 'Trichroic Blue-Violet',
            description: 'Mined from Tanzanian concession; rough crystal specimens and calibrated faceted gemstones.',
          },
          {
            name: 'Tsavorite Garnet (Grossular Species)',
            standard: 'Vivid Emerald Green',
            description: 'Mined from Taita Taveta belt in Kenya; exceptional brilliance and untreated natural color.',
          },
          {
            name: 'Corundum (Sapphire & Ruby)',
            standard: 'Mohs Hardness 9.0',
            description: 'Fine blue sapphires and deep red rubies extracted from pegmatite and metamorphic host rocks.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Stage 01',
        title: 'Reef Delineation & Tunneling',
        objective: 'Follow gem-bearing pegmatite and hydrothermal veins with controlled non-explosive extraction.',
        deliverables: ['Reef Geological Log', 'Recovery Batch Record'],
        milestoneRecord: 'Vein Intersect',
      },
      {
        phase: 'Stage 02',
        title: 'Sorting, Grading & Valuation',
        objective: 'Clean, sort rough crystals by color, clarity, and facet potential under gemological daylight.',
        deliverables: ['Gemological Sorting Sheet', 'Carat Weight Register'],
        milestoneRecord: 'Batch Grading Certificate',
      },
      {
        phase: 'Stage 03',
        title: 'Faceting & International Export',
        objective: 'Cut and polish top-grade rough into certified gemstones with official Ministry of Mining export permits.',
        deliverables: ['Export Royalty Receipts', 'GIA Standard Appraisal'],
        milestoneRecord: 'Export Clearance Release',
      },
    ],
    technicalSpecs: [
      { parameter: 'Hardness Range (Mohs Scale)', standardValue: '7.0 – 9.0 (Garnet to Corundum)', engineeringNotes: 'Ideal for fine jewelry and collectors' },
      { parameter: 'Grading Standard', standardValue: '4Cs (Color, Clarity, Cut, Carat)', engineeringNotes: 'Master color sets used for calibration' },
      { parameter: 'Treatment Policy', standardValue: '100% Disclosure of any thermal treatment', engineeringNotes: 'Guaranteed natural untreated Tsavorite and Sapphire' },
    ],
    groups: [
      {
        title: 'Materials Handled',
        description: 'Rough crystals and precision-cut gemstones marketed to international gem merchants.',
        items: [
          'Tanzanite (Rough & Cut parcels)',
          'Blue Sapphire (Vivid royal blue)',
          'Natural Ruby (Matrix & Faceted)',
          'Green Tsavorite Garnet (Taita Taveta origin)',
          'Green Tourmaline and Chrome Tourmaline',
          'Collector mineral specimens and rough lots',
        ],
      },
    ],
    faqs: [
      {
        question: 'How do international buyers purchase gemstone parcels from Green Ngoria?',
        answer: 'We accommodate private viewing at our Nairobi corporate office or arrange insured international courier delivery with statutory export clearances.',
      },
      {
        question: 'Are all gemstones supplied with export documentation and royalty receipts?',
        answer: 'Yes. Every parcel is exported with verified mining provenance, mineral dealer licences, and official royalty documentation.',
      },
    ],
    cta: { label: 'Enquire About Gemstone Lots', href: '/contact' },
  },

  {
    slug: 'building-works',
    name: 'Building Works & Infrastructure',
    eyebrow: 'Construction',
    headline: 'Commercial, institutional, and high-security building construction across East Africa',
    summary:
      'New building construction, structural masonry, curtain walling, banking branch fit-out, and institutional facilities delivered across Kenya, Rwanda, and Burundi.',
    intro: [
      'The building works division covers complete new building construction through to specialized interior and high-security finishing. It represents the foundation of Green Ngoria’s general contracting track record across East and Central Africa.',
      'Our portfolio includes landmark bank branch renovations for Banque Populaire du Rwanda, Fina Bank, and Bank of Kigali, headquarters refurbishment for Soras, architectural aluminium curtain walling for the Kabgayi Diocese Building, and the design and construction of the lift shaft core at Hotel Amahoro in Burundi.',
      'Every project is executed by qualified resident civil and structural engineers, adhering to National Construction Authority (NCA) standards and ISO 9001 quality controls.',
    ],
    icon: 'Building2',
    primaryImage: {
      src: '/images/construction/grand-park-complex.webp',
      alt: 'Grand Park commercial and residential multi-storey building complex constructed by Green Ngoria',
      caption: 'Modern commercial and residential multi-storey complex delivered with structural reinforced concrete and glass facades.',
      badge: 'Turnkey Building EPC',
    },
    keyMetrics: [
      { label: 'Regional Delivery', value: 'Kenya, Rwanda, Burundi', detail: 'Cross-Border Institutional Contracts' },
      { label: 'Banking Portfolio', value: 'Bank of Kigali & BPR', detail: 'Fina Bank & Soras HQ Fit-Outs' },
      { label: 'Structural Concrete', value: 'BS 8110 / Eurocode', detail: 'Reinforced Framing & Lift Cores' },
      { label: 'Workforce', value: 'Qualified Site Engineers', detail: 'Permanent Construction Staff' },
    ],
    gallery: [
      {
        src: '/images/construction/grand-park-complex.webp',
        title: 'Grand Park Complex',
        caption: 'Grand Park modern multi-storey commercial & residential complex.',
        tag: 'Commercial Complex',
      },
      {
        src: '/images/construction/residential-villa-design-build.webp',
        title: 'Residential Design & Build',
        caption: 'Turnkey residential villas designed and constructed from foundation to finishes.',
        tag: 'Residential',
      },
      {
        src: '/images/construction/institutional-building-project.webp',
        title: 'Institutional Projects',
        caption: 'Institutional facilities, schools, and diocesan administration buildings.',
        tag: 'Institutional',
      },
      {
        src: '/images/construction/commercial-property-nairobi.webp',
        title: 'Commercial Developments',
        caption: 'Nairobi commercial office developments, high-traffic finishes, and fit-outs.',
        tag: 'Office Fit-Out',
      },
      {
        src: '/images/construction/multistorey-residential.webp',
        title: 'Multi-Storey Masonry',
        caption: 'Multi-storey structural framing, masonry infill, and roofing erection.',
        tag: 'Structural Frame',
      },
    ],
    scope: [
      'Construction of new multi-storey commercial and residential buildings',
      'Institutional facilities, administration headquarters, and hospitals',
      'Banking branch construction and high-security vault fit-out',
      'Structural reinforced concrete framing, columns, and slabs',
      'Aluminium windows, doors, shopfronts, and structural glass curtain walling',
      'Partitioning, acoustic drywall, suspended ceilings, and joinery',
      'Scaffolding, access engineering, and site EHS supervision',
    ],
    deliverableCategories: [
      {
        category: 'Building Capabilities',
        items: [
          {
            name: 'Reinforced Concrete Structural Framing',
            standard: 'BS 8110 / Eurocode 2',
            description: 'Foundation pads, shear walls, columns, suspended slabs, and lift core engineering.',
          },
          {
            name: 'Architectural Glazing & Curtain Walling',
            standard: 'BS 6262 / ASTM E330',
            description: 'Thermally broken aluminium frames, double-glazed low-E safety glass, and frameless entries.',
          },
          {
            name: 'Banking & High-Security Interior Fit-Out',
            standard: 'KPDA Security Specs',
            description: 'Bullet-resistant teller counters, reinforced vault walls, access control, and acoustic partitioning.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Architectural Review & Site Mobilization',
        objective: 'Verify architectural/structural drawings, conduct soil tests, and establish perimeter security.',
        deliverables: ['Setting Out Survey', 'Site Execution Plan'],
        milestoneRecord: 'Site Mobilization Notice',
      },
      {
        phase: 'Phase 02',
        title: 'Substructure & Reinforced Concrete Frame',
        objective: 'Excavate foundations, cast base plinths, erect columns, and pour suspended floor slabs.',
        deliverables: ['Concrete Cube Test Sheets', 'Rebar Inspection Signoffs'],
        milestoneRecord: 'Structural Topping Out',
      },
      {
        phase: 'Phase 03',
        title: 'Building Envelope & Interior Fit-Out',
        objective: 'Install curtain walling, exterior masonry, drywall partitioning, mechanical lift, and electrical wiring.',
        deliverables: ['Glazing Water Test Log', 'MEP First Fix Signoff'],
        milestoneRecord: 'Building Enclosure Certificate',
      },
      {
        phase: 'Phase 04',
        title: 'Architectural Finishes & Final Handover',
        objective: 'Complete painting, joinery, flooring, commission building services, and clear punch list items.',
        deliverables: ['As-Built Drawing Dossier', 'Occupancy Compliance Certificate'],
        milestoneRecord: 'Practical Completion Certificate',
      },
    ],
    technicalSpecs: [
      { parameter: 'Concrete Compressive Strength', standardValue: 'C25/30 for slabs, C35/45 for heavy columns & plinths', engineeringNotes: 'Batch plant quality tested' },
      { parameter: 'Reinforcing High-Tensile Steel', standardValue: 'Grade 500B (BS 4449)', engineeringNotes: '100% mill test certificates verified' },
      { parameter: 'Curtain Wall Wind Load Resistance', standardValue: 'Up to 2.4 kPa positive/negative pressure', engineeringNotes: 'Engineered for high-rise commercial structures' },
    ],
    faqs: [
      {
        question: 'Can Green Ngoria handle cross-border building projects in East Africa?',
        answer: 'Yes. We have completed projects across Rwanda, Burundi, Uganda, and Kenya, coordinating international procurement, regional logistics, and on-site engineering crews.',
      },
      {
        question: 'Does Green Ngoria undertake design-and-build contracts?',
        answer: 'Yes. We provide turnkey design-and-build delivery coordinating architectural concepts, structural engineering, statutory county approvals, and construction.',
      },
    ],
    cta: { label: 'See Completed Projects', href: '/projects' },
    secondaryCta: { label: 'Discuss a Building Contract', href: '/contact' },
  },

  {
    slug: 'renovation-painting',
    name: 'Renovation, Restoration & Painting',
    eyebrow: 'Construction',
    headline: 'Commercial interior refurbishment, epoxy floors, acoustic ceilings, and structural restoration',
    summary:
      'Complete renovation, commercial re-branding, specialized epoxy floor coatings, and structural refurbishment for corporate headquarters, banks, and hotels.',
    intro: [
      'The renovation and painting division specializes in reviving, modernizing, and protecting existing commercial, institutional, and industrial structures.',
      'From corporate headquarter transformations (such as Soras HQ in Kigali) to sensitive structural restoration and bank branch network re-branding, we deliver high-spec finishes with minimal disruption to ongoing operations.',
      'We apply high-performance industrial coatings: chemical-resistant epoxy floors, heavy-duty polyurethane floor screeds, elastomeric weatherproof masonry coatings, and decorative architectural finishes.',
    ],
    icon: 'Paintbrush',
    primaryImage: {
      src: '/images/construction/renovation-architectural-finishes.webp',
      alt: 'Commercial interior renovation project with workers installing ceilings and epoxy floor coatings',
      caption: 'Commercial interior renovation showcasing epoxy resin floor application and architectural acoustic ceiling grid installation.',
      badge: 'Commercial Restoration',
    },
    keyMetrics: [
      { label: 'Renovation Portfolio', value: 'Corporate & Banking', detail: 'Bank of Kigali, BPR & Soras HQ' },
      { label: 'Flooring Systems', value: 'Heavy Duty Epoxy', detail: 'Chemical, Traffic & Slip Resistant' },
      { label: 'Acoustic Ceilings', value: 'NRC 0.75+ Rated', detail: 'Suspended Grid & Drywall Systems' },
      { label: 'Execution Speed', value: 'Phased Live Fit-Out', detail: 'Zero Downtime to Client Operations' },
    ],
    gallery: [
      {
        src: '/images/construction/renovation-architectural-finishes.webp',
        title: 'Commercial Interior Refurbishment',
        caption: 'High-end interior renovation, epoxy floor coating, and acoustic ceiling installation.',
        tag: 'Interior Fit-Out',
      },
      {
        src: '/images/construction/commercial-property-nairobi.webp',
        title: 'Corporate Facade Painting',
        caption: 'Weatherproof elastomeric painting and facade restoration on multi-storey property.',
        tag: 'Exterior Coatings',
      },
      {
        src: '/images/construction/institutional-building-project.webp',
        title: 'Institutional Renovation',
        caption: 'Refurbishment of institutional administration blocks, floor tiling, and partitions.',
        tag: 'Refurbishment',
      },
    ],
    scope: [
      'Full interior and exterior commercial renovation and refurbishment',
      'Structural repair, concrete spall remediation, and crack injection',
      'Heavy-duty seamless epoxy and polyurethane resin floor screeds',
      'Acoustic suspended ceilings, drywall partitions, and glass office dividers',
      'Commercial painting, elastomeric facade coatings, and anti-graffiti sealers',
      'Joinery, custom reception counters, doors, and architectural ironmongery',
    ],
    deliverableCategories: [
      {
        category: 'Specialized Finishing Systems',
        items: [
          {
            name: 'Seamless Epoxy Floor Screeds',
            standard: 'BS 8204-6',
            description: 'Self-leveling 2mm to 4mm solvent-free epoxy providing seamless hygiene and chemical resistance.',
          },
          {
            name: 'Acoustic Drywall & Glazed Partitions',
            standard: 'ASTM C840 / BS 5234',
            description: 'Sound-damped partition walls (STC 45+) with integrated cable raceways and vision panels.',
          },
          {
            name: 'Weatherproof Elastomeric Coatings',
            standard: 'ISO 12944 / ASTM D412',
            description: 'High-build flexible exterior coatings bridging hairline masonry cracks and preventing moisture ingress.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Step 01',
        title: 'Site Audit & Substrate Testing',
        objective: 'Evaluate moisture levels in concrete, assess old coatings, and prepare phased staging plan.',
        deliverables: ['Condition Audit Report', 'Phasing Schedule'],
        milestoneRecord: 'Pre-Start Audit Signoff',
      },
      {
        phase: 'Step 02',
        title: 'Surface Preparation & Repair',
        objective: 'Diamond grind concrete floors, strip defective coatings, and repair structural masonry defects.',
        deliverables: ['Substrate Preparation Signoff'],
        milestoneRecord: 'Surface Prep Release',
      },
      {
        phase: 'Step 03',
        title: 'Application of Finishes & Fit-Out',
        objective: 'Apply primer and epoxy screeds, erect ceilings, install partitions, and apply paint finishes.',
        deliverables: ['Dry Film Thickness (DFT) Log', 'Color Consistency Signoff'],
        milestoneRecord: 'Finishing Completion Gate',
      },
      {
        phase: 'Step 04',
        title: 'Quality Inspection & Handover',
        objective: 'Perform final touchups, clean site, and deliver warranty documentation to the client.',
        deliverables: ['Maintenance Care Manual', 'Handover Certificate'],
        milestoneRecord: 'Final Project Handover',
      },
    ],
    technicalSpecs: [
      { parameter: 'Epoxy Coating Compressive Strength', standardValue: '> 60 N/mm²', engineeringNotes: 'Withstands heavy forklift and pallet truck traffic' },
      { parameter: 'Paint VOC Compliance', standardValue: '< 50 g/L (Low-VOC eco-friendly formulations)', engineeringNotes: 'Safe for indoor occupied building renovations' },
      { parameter: 'Acoustic Ceiling Noise Reduction Coefficient', standardValue: 'NRC 0.70 – 0.85', engineeringNotes: 'Reduces echo in open-plan corporate banking halls' },
    ],
    faqs: [
      {
        question: 'Can Green Ngoria execute renovation works while building tenants remain in operation?',
        answer: 'Yes. We frequently execute phased night-shift and weekend renovations with dust-containment partitions to ensure zero disruption to live business operations.',
      },
    ],
    cta: { label: 'Request a Renovation Proposal', href: '/contact' },
    secondaryCta: { label: 'See Building Portfolio', href: '/services/building-works' },
  },

  {
    slug: 'road-construction',
    name: 'Road Construction & Civil Infrastructure',
    eyebrow: 'Civil Works',
    headline: 'Highways, urban paved roads, bridges, box culverts and major storm drainage',
    summary:
      'Turnkey civil engineering for roads and highways: site clearance, sub-base compaction, asphaltic concrete laying, bridges, and stormwater culverts across East Africa.',
    intro: [
      'Green Ngoria’s road construction division delivers full-scope civil infrastructure: from initial site clearing and mass earthworks through sub-base stabilization, asphaltic concrete paving, to structural bridges and drainage.',
      'We deploy complete paving trains: heavy vibratory compaction rollers, motor graders, asphalt pavers, pneumatic tired rollers, and bitumen distributors.',
      'Our civil engineers construct heavy hydraulic structures: reinforced concrete bridges, single and multi-cell box culverts, masonry lined drains, and flood mitigation channels built to withstand equatorial rainfall.',
    ],
    icon: 'Route',
    primaryImage: {
      src: '/images/roads/sub-base-compaction-roller.webp',
      alt: 'Heavy vibratory roller compacting road sub-base ahead of asphalt paving',
      caption: 'Sub-base layer compaction using heavy vibratory roller to achieve required California Bearing Ratio (CBR) density.',
      badge: 'Civil Earthworks & Roads',
    },
    keyMetrics: [
      { label: 'Pavement Types', value: 'Asphaltic Concrete', detail: 'Surface Dressing, Overlays & Bitumen' },
      { label: 'Hydraulic Structures', value: 'Bridges & Culverts', detail: 'Multi-Cell Reinforced Box Culverts' },
      { label: 'Machinery Fleet', value: 'Full Paving Train', detail: 'Graders, Pavers & Vibratory Rollers' },
      { label: 'Compliance Code', value: 'KeRRA / KeNHA / BS', detail: 'Standard Road Design Manuals' },
    ],
    gallery: [
      {
        src: '/images/roads/sub-base-compaction-roller.webp',
        title: 'Sub-Base Compaction',
        caption: 'Compaction of sub-base ahead of surfacing with heavy roller.',
        tag: 'Compaction',
      },
      {
        src: '/images/roads/asphalt-concrete-laying.webp',
        title: 'Asphalt Concrete Laying',
        caption: 'Asphaltic concrete placement and surface dressing operations.',
        tag: 'Asphalt Paving',
      },
      {
        src: '/images/roads/highway-grading-works.webp',
        title: 'Highway Earthworks',
        caption: 'Earthworks, cut-and-fill, and road grading operations.',
        tag: 'Grading',
      },
      {
        src: '/images/roads/paving-train-county-road.webp',
        title: 'County Paving Train',
        caption: 'Paving train operation on county highway development project.',
        tag: 'Paving Train',
      },
      {
        src: '/images/roads/masonry-drainage-culverts.webp',
        title: 'Drainage Culverts & Channels',
        caption: 'Masonry drainage channels, bridges and box culverts for flood containment.',
        tag: 'Drainage',
      },
    ],
    scope: [
      'Site clearance, mass cut-and-fill, and formation grading',
      'Sub-base and base formation using natural gravel and crushed stone',
      'Lime and cement soil stabilization for expansive clays',
      'Asphaltic concrete (AC) surfacing, dense bitumen macadam, and overlays',
      'Bituminous surface dressing (single and double seal chip sealing)',
      'Reinforced concrete bridges, abutments, and box culverts',
      'Masonry storm drainage, scour checks, and gabion riverbank protection',
      'Road furniture: kerbing, guardrails, thermo-plastic marking, and signage',
    ],
    deliverableCategories: [
      {
        category: 'Pavement & Surfacing Scope',
        items: [
          {
            name: 'Dense Bitumen Macadam (DBM) & Asphaltic Concrete',
            standard: 'BS 594 / Superpave',
            description: 'Hot-mix asphalt laid and compacted to 98% Marshall density for heavy axle traffic loads.',
          },
          {
            name: 'Soil Stabilization & Base Construction',
            standard: 'AASHTO T180',
            description: 'Cement-improved base course delivering high resilient modulus and moisture resistance.',
          },
          {
            name: 'Drainage & Hydraulic Structures',
            standard: 'Eurocode 2 / KeNHA Specs',
            description: 'Hydraulically sized concrete box culverts and masonry side drains preventing road erosion.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Topographical Survey & Alignment Design',
        objective: 'Survey alignment coordinates, establish culvert invert levels, and sample subgrade soils.',
        deliverables: ['Topographical Survey Map', 'Soil CBR Test Logs'],
        milestoneRecord: 'Alignment Setting Out Signoff',
      },
      {
        phase: 'Phase 02',
        title: 'Earthworks & Drainage Structures',
        objective: 'Execute mass cut-and-fill, excavate roadside ditches, and cast reinforced concrete culverts.',
        deliverables: ['Compaction Test Sheets', 'Culvert Concrete Cube Tests'],
        milestoneRecord: 'Earthworks Completion Certificate',
      },
      {
        phase: 'Phase 03',
        title: 'Pavement Layer Laying & Compaction',
        objective: 'Place crushed stone base, apply prime coat, and pave hot asphaltic concrete wearing course.',
        deliverables: ['Asphalt Marshall Test Logs', 'Pavement Smoothness IRI Log'],
        milestoneRecord: 'Paving Substantial Completion',
      },
      {
        phase: 'Phase 04',
        title: 'Road Furniture & Commissioning',
        objective: 'Install guardrails, apply thermoplastic road markings, erect road signs, and open to traffic.',
        deliverables: ['Final As-Built Alignment', 'Defects Liability Dossier'],
        milestoneRecord: 'Substantial Completion Handover',
      },
    ],
    technicalSpecs: [
      { parameter: 'Sub-Base California Bearing Ratio (CBR)', standardValue: 'CBR ≥ 30% at 95% MDD (BS-Heavy)', engineeringNotes: 'Ensures structural load transfer for heavy trucks' },
      { parameter: 'Asphalt Paving Temperature', standardValue: '140°C – 160°C at laydown', engineeringNotes: 'Compacted before temperature drops below 100°C' },
      { parameter: 'Culvert Concrete Characteristic Strength', standardValue: 'C30/37 (30 MPa at 28 days)', engineeringNotes: 'Waterproof concrete resistant to river scour' },
    ],
    faqs: [
      {
        question: 'Does Green Ngoria undertake private mine haul road construction?',
        answer: 'Yes. We design and construct heavy-duty haul roads engineered specifically for 60-tonne mining dump trucks and articulated loaders.',
      },
    ],
    cta: { label: 'Discuss a Roads Contract', href: '/contact' },
    secondaryCta: { label: 'Request an RFQ', href: '/request-rfq' },
  },

  {
    slug: 'water-projects',
    name: 'Water Supply, Reticulation & Civil Storage',
    eyebrow: 'Civil Works',
    headline: 'Water supply schemes, distribution reticulation, boreholes, and reinforced storage reservoirs',
    summary:
      'Design, construction, and commissioning of potable water supply schemes, pipeline reticulation, borehole equipping, and municipal sewerage projects.',
    intro: [
      'The water projects division delivers clean water supply schemes and the reticulation networks that distribute them to communities, institutions, and industrial sites.',
      'Because our mechanical and electrical engineering departments sit under the same corporate umbrella, pump sets, solar hybrid pumping drives, automated control panels, and water treatment chlorination systems are installed directly by our in-house engineers.',
      'We construct complete water infrastructure: high-capacity reinforced concrete reservoirs, elevated steel water storage towers, deep borehole drilling, and electrofusion-welded HDPE distribution piping.',
    ],
    icon: 'Droplets',
    primaryImage: {
      src: '/images/water/reservoir-treatment-tank.webp',
      alt: 'Reinforced concrete water treatment tank and reservoir construction',
      caption: 'Reinforced concrete water storage reservoir and sedimentation tank construction for municipal water distribution.',
      badge: 'Water Infrastructure',
    },
    keyMetrics: [
      { label: 'Scope Capabilities', value: 'Supply & Reticulation', detail: 'Reservoirs, Mains & Treatment' },
      { label: 'Pipeline Fusion', value: 'HDPE, D.I. & uPVC', detail: 'Electrofusion & Flanged Connections' },
      { label: 'Pumping Technology', value: 'Solar & Submersible', detail: 'Automated Variable Speed Drives' },
      { label: 'Pressure Testing', value: 'BS EN 805 / AWWA', detail: '1.5x Hydrostatic Pressure Verified' },
    ],
    gallery: [
      {
        src: '/images/water/reservoir-treatment-tank.webp',
        title: 'Reservoir & Treatment Tank',
        caption: 'Reservoir and water treatment tank construction on site.',
        tag: 'Water Reservoir',
      },
      {
        src: '/images/water/trenching-pipeline-laying.webp',
        title: 'Pipeline Trenching & Laying',
        caption: 'Pipeline trenching, bedding, and water reticulation pipe laying.',
        tag: 'Pipeline Laying',
      },
      {
        src: '/images/water/elevated-storage-tower.webp',
        title: 'Elevated Storage Tower',
        caption: 'Elevated structural steel water storage tower and booster pump house.',
        tag: 'Water Tower',
      },
      {
        src: '/images/water/pipe-jointing-reticulation.webp',
        title: 'Pipe Jointing & Valve Manifolds',
        caption: 'Pipe jointing, pressure reducing valves, and water distribution network.',
        tag: 'Valves & Manifolds',
      },
    ],
    scope: [
      'Potable water supply project design, engineering, and construction',
      'Water reticulation and distribution networks across urban and rural zones',
      'Water and sewerage treatment works (sedimentation, filtration, chlorination)',
      'Deep borehole hydrogeological surveying, drilling, casing, and pump equipping',
      'Reinforced concrete ground storage tanks and elevated steel towers',
      'Trenching, bedding, pipelaying, and backfilling under strict compaction rules',
    ],
    deliverableCategories: [
      {
        category: 'Water System Deliverables',
        items: [
          {
            name: 'Reinforced Concrete Reservoirs',
            standard: 'BS 8007 (Water Retaining Structures)',
            description: 'Crack-controlled concrete tanks with impermeable inner linings and baffled overflow systems.',
          },
          {
            name: 'High-Density Polyethylene (HDPE) Pipelines',
            standard: 'ISO 4427 / EN 12201',
            description: 'Butt-fusion and electrofusion welded HDPE pressure pipes rated from PN10 to PN25.',
          },
          {
            name: 'Solar Hybrid Borehole Equipping',
            standard: 'EPRA / IEEE Pumping Specs',
            description: 'High-efficiency submersible pumps powered by PV solar arrays with grid/diesel auto-switchover.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Stage 01',
        title: 'Hydrogeological Survey & Flow Modeling',
        objective: 'Conduct geophysical resistivity surveys, determine aquifer yield, and model pipe flow hydraulics.',
        deliverables: ['Hydrogeological Survey Report', 'EPANET Hydraulic Model'],
        milestoneRecord: 'Hydraulic Model Approval',
      },
      {
        phase: 'Stage 02',
        title: 'Borehole Drilling & Civil Storage Construction',
        objective: 'Drill and case boreholes, cast concrete reservoirs, and erect elevated steel water towers.',
        deliverables: ['Borehole Test Pumping Log', 'Water Quality Chemical Assay'],
        milestoneRecord: 'Source Water Yield Signoff',
      },
      {
        phase: 'Stage 03',
        title: 'Pipeline Trenching & Electrofusion Laying',
        objective: 'Excavate trenches, lay HDPE/Ductile Iron pipes, and install air valves and washout chambers.',
        deliverables: ['Pipe Fusion Weld Logs', 'Hydrostatic Pressure Test Sheets'],
        milestoneRecord: 'Pressure Test Certificate',
      },
      {
        phase: 'Stage 04',
        title: 'Disinfection & Commissioning Handover',
        objective: 'Chlorinate and flush pipeline network, verify residual chlorine, and commission pump automation.',
        deliverables: ['Bacteriological Test Clearance', 'As-Built Pipeline Map'],
        milestoneRecord: 'Water Supply Commissioning Gate',
      },
    ],
    technicalSpecs: [
      { parameter: 'Hydrostatic Pressure Test Rating', standardValue: '1.5x Maximum Operating Pressure for 24 hours', engineeringNotes: 'Zero pressure drop on sealed test sections' },
      { parameter: 'Concrete Water Retaining Crack Width Limit', standardValue: 'Wmax ≤ 0.2 mm (BS 8007)', engineeringNotes: 'Prevents leakage and internal rebar corrosion' },
      { parameter: 'Treated Potable Water Standard', standardValue: 'KEBS KS EAS 12 (Drinking Water Specs)', engineeringNotes: '0 CFU/100ml E. coli, residual chlorine 0.2–0.5 mg/L' },
    ],
    faqs: [
      {
        question: 'Can Green Ngoria engineer industrial process water systems for mining sites?',
        answer: 'Yes. We engineer raw water intake, settling ponds, filtration systems, and recycling water circuits tailored to mineral processing plants.',
      },
    ],
    cta: { label: 'Discuss a Water Project', href: '/contact' },
    secondaryCta: { label: 'Request an RFQ', href: '/request-rfq' },
  },

  {
    slug: 'mechanical',
    name: 'Mechanical Engineering & Structural Erection',
    eyebrow: 'Engineering',
    headline: 'Over a decade of heavy structural steel, industrial pipework, and plant erection',
    summary:
      'Over ten years of specialized mechanical engineering contracts: structural steel erection, coded ASME welding, process pipework fabrication, bulk terminals, and mining rig assembly.',
    intro: [
      'Green Ngoria has delivered heavy mechanical works contracts for more than ten years across East and Central Africa.',
      'Our engineers bring extensive practical expertise in heavy industrial construction, bulk fuel terminal steelwork, power station mechanical systems, mining headframes, and process machinery installation.',
      'Our mechanical capabilities have also supported complex building projects: including the design and structural delivery of the multi-storey lift shaft core at Hotel Amahoro in Burundi featuring a high-speed Schindler elevator installation.',
    ],
    icon: 'Cog',
    primaryImage: {
      src: '/images/mechanical/structural-steel-bulk-terminal.webp',
      alt: 'Structural steel erection and crane assembly at bulk storage terminal',
      caption: 'Structural steel framing and pipe rack erection at an industrial bulk storage terminal.',
      badge: 'Heavy Mechanical Erection',
    },
    keyMetrics: [
      { label: 'Industry Experience', value: '10+ Years Delivery', detail: 'Oil Terminals & Power Sector' },
      { label: 'Welding Standards', value: 'ASME IX Certified', detail: '100% NDT on High-Pressure Lines' },
      { label: 'Mining Rigging', value: 'Headframes & Mills', detail: 'Shaft Hoisting & Heavy Steel' },
      { label: 'Lifting & Elevators', value: 'Schindler Lift Delivery', detail: 'Hotel Amahoro Lift Shaft Core' },
    ],
    gallery: [
      {
        src: '/images/mechanical/structural-steel-bulk-terminal.webp',
        title: 'Bulk Storage Steel Erection',
        caption: 'Structural steel erection and framing at a bulk storage terminal.',
        tag: 'Structural Steel',
      },
      {
        src: '/images/mechanical/site-welding-qualified.webp',
        title: 'Coded Site Welding',
        caption: 'Site welding to procedure with ASME-qualified welders.',
        tag: 'Coded Welding',
      },
      {
        src: '/images/mechanical/pipework-fabrication.webp',
        title: 'Industrial Pipe Fabrication',
        caption: 'Industrial process pipework fabrication, manifolds, and installation.',
        tag: 'Process Piping',
      },
      {
        src: '/images/mechanical/headframe-erection-assembly.webp',
        title: 'Mining Headframe Assembly',
        caption: 'Mining rig and shaft headframe erection for underground extraction.',
        tag: 'Mining Rigging',
      },
    ],
    scope: [
      'Heavy structural steel fabrication, crane erection, and bolt-up assembly',
      'Specialized mechanical erection for oil depots, power plants, and mining sites',
      'Process pipework fabrication, spools, manifolds, and high-pressure lines',
      'Welding to WPS procedures with ASME Section IX certified welders',
      'Industrial machinery installation, laser alignment, and shutdown overhaul support',
      'Mining shaft headframe erection, winches, and hoisting gear assembly',
    ],
    deliverableCategories: [
      {
        category: 'Mechanical Engineering Scope',
        items: [
          {
            name: 'Structural Steel Fabrication & Erection',
            standard: 'BS 5950 / AISC 360',
            description: 'Heavy portal frames, crane runway beams, pipe bridges, and access stair towers.',
          },
          {
            name: 'Process Piping & Spool Fabrication',
            standard: 'ASME B31.3 / B31.4',
            description: 'Carbon steel and stainless steel pipe spools for fuels, chemicals, and high-density slurries.',
          },
          {
            name: 'Coded Welding & Nondestructive Testing',
            standard: 'ASME IX / AWS D1.1',
            description: '100% visual inspection backed by radiographic, ultrasonic, and dye penetrant testing.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Shop Fabrication & Spool Detailing',
        objective: 'Develop 3D isometric piping blueprints, fabricate spools in workshop, and perform NDT.',
        deliverables: ['Piping Isometrics', 'Weld NDT Inspection Sheets'],
        milestoneRecord: 'Fabrication Release Gate',
      },
      {
        phase: 'Phase 02',
        title: 'On-Site Heavy Rigging & Alignment',
        objective: 'Erect structural frames, hoist heavy machinery onto foundations, and align shafts using dual-axis lasers.',
        deliverables: ['Crane Lift Plans', 'Laser Alignment Logs'],
        milestoneRecord: 'Mechanical Position Signoff',
      },
      {
        phase: 'Phase 03',
        title: 'Hydrostatic Pressure & Torque Testing',
        objective: 'Torque all structural bolts to specification and hydro-test piping to 1.5x design pressure.',
        deliverables: ['Bolt Torque Audit Sheet', 'Hydrostatic Test Certificate'],
        milestoneRecord: 'Pressure Test Certificate',
      },
      {
        phase: 'Phase 04',
        title: 'Pre-Commissioning & Cold Run',
        objective: 'Lubricate bearings, check motor rotational directions, and conduct dry test runs.',
        deliverables: ['Cold Commissioning Dossier', 'As-Built Mechanical Archive'],
        milestoneRecord: 'Mechanical Completion Certificate',
      },
    ],
    technicalSpecs: [
      { parameter: 'Structural Steel Grade', standardValue: 'S275JR / S355JR (EN 10025)', engineeringNotes: 'High yield strength certified structural steel' },
      { parameter: 'Shaft Laser Alignment Tolerance', standardValue: '< 0.05 mm radial / axial runout', engineeringNotes: 'Ensures zero vibration on heavy rotary equipment' },
      { parameter: 'Welding NDT Acceptance', standardValue: 'ASME B31.3 Severe Cyclic Conditions criteria', engineeringNotes: 'Zero crack or lack-of-fusion defects allowed' },
    ],
    faqs: [
      {
        question: 'Does Green Ngoria maintain certified mobile crane operators and riggers?',
        answer: 'Yes. All lifting operations are planned by certified rigging engineers with written lift plans and calibrated rigging tackle.',
      },
    ],
    cta: { label: 'Discuss Mechanical Scope', href: '/contact' },
    secondaryCta: { label: 'View Equipment Catalogue', href: '/equipment' },
  },

  {
    slug: 'electrical-services',
    name: 'Electrical Engineering & Instrumentation',
    eyebrow: 'Engineering',
    headline: 'High-voltage switchyards, motor control centers (MCC), automation, and preventive maintenance',
    summary:
      'Turnkey electrical engineering: high-voltage substations, plant control panels, PLC automation, industrial cabling, and ongoing maintenance support.',
    intro: [
      'The electrical engineering division covers the entire lifecycle of industrial and commercial power systems: design and construct, testing and commissioning, automation, and ongoing planned maintenance.',
      'Scope includes high-voltage switchyards, transformers, motor control centers (MCC), variable speed drives (VFD), PLC automated sensor loops, building electrical services, and energy-saving power factor correction.',
      'We partner with leading global electrical manufacturers (ABB, Schneider Electric, WEG, Siemens) to ensure top-tier reliability across industrial and mining installations.',
    ],
    icon: 'Zap',
    primaryImage: {
      src: '/images/electrical/high-voltage-switchyard.webp',
      alt: 'High-voltage switchyard and substation infrastructure engineered by Green Ngoria',
      caption: 'High-voltage switchyard and power transformer substation infrastructure for industrial facilities.',
      badge: 'High-Voltage Engineering',
    },
    keyMetrics: [
      { label: 'Voltage Coverage', value: 'LV, MV & High-Voltage', detail: 'Switchyards & Power Distribution' },
      { label: 'Compliance Code', value: 'IEC 60364 / IEEE', detail: 'EPRA Class A Registered' },
      { label: 'Automation & Drives', value: 'PLC, SCADA & VFDs', detail: 'Automated Motor Control Centers' },
      { label: 'Testing Equipment', value: 'Calibrated Meggers', detail: 'Insulation & Earth Loop Testing' },
    ],
    gallery: [
      {
        src: '/images/electrical/high-voltage-switchyard.webp',
        title: 'High-Voltage Switchyard',
        caption: 'High-voltage switchyard and substation transformer infrastructure.',
        tag: 'High Voltage',
      },
      {
        src: '/images/electrical/distribution-board-installation.webp',
        title: 'Distribution Board Cabling',
        caption: 'Industrial distribution board installation and precision cabling.',
        tag: 'Switchboards',
      },
      {
        src: '/images/electrical/plant-control-panels.webp',
        title: 'Plant Control Panels',
        caption: 'Plant control panels and automated instrumentation loops.',
        tag: 'Automation',
      },
      {
        src: '/images/electrical/testing-commissioning-multimeter.webp',
        title: 'Testing & Commissioning',
        caption: 'Testing, commissioning, and preventive maintenance diagnostics.',
        tag: 'Testing',
      },
    ],
    scope: [
      'Electrical design, load calculations, and Single Line Diagram (SLD) modeling',
      'High-voltage substation and step-down transformer installation',
      'Motor Control Centers (MCC) and Variable Frequency Drive (VFD) starter cabinets',
      'PLC automation, instrumentation, flowmeter loops, and emergency interlocks',
      'Heavy industrial cable tray routing, armored cable pulling, and glanding',
      'Lightning protection grids and low-resistance earth grounding systems (< 1.0 Ω)',
      'Comprehensive testing: insulation resistance (Megger), loop impedance, and thermal imaging',
    ],
    deliverableCategories: [
      {
        category: 'Electrical Systems Scope',
        items: [
          {
            name: 'Motor Control Centers (MCC) & Automation',
            standard: 'IEC 61439 / IEC 61131',
            description: 'Form 4 segregated switchboards with integrated motor protection and PLC logic.',
          },
          {
            name: 'Substation & Power Factor Correction',
            standard: 'IEEE 519 / IEC 60076',
            description: 'Oil/dry type transformers and automatic capacitor banks maintaining PF > 0.95.',
          },
          {
            name: 'Grounding & Lightning Protection',
            standard: 'BS 7430 / IEC 62305',
            description: 'Copper mesh grounding networks with chemical earth rods ensuring safe fault dissipation.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Load Calculation & Schematics Design',
        objective: 'Calculate maximum demand, design Single Line Diagrams (SLD), and size transformers and cables.',
        deliverables: ['Single Line Diagrams', 'Cable Sizing Schedule'],
        milestoneRecord: 'Electrical Design Approval',
      },
      {
        phase: 'Phase 02',
        title: 'Containment, Cabling & Panel Mounting',
        objective: 'Install cable trays, pull armored power cables, mount MCC cabinets, and wire field instruments.',
        deliverables: ['Cable Pulling Logs', 'Panel Termination Sheets'],
        milestoneRecord: 'Mechanical Hookup Signoff',
      },
      {
        phase: 'Phase 03',
        title: 'Testing, Meggering & Cold Loop Check',
        objective: 'Perform high-voltage insulation tests, verify earth resistance, and simulate PLC control logic.',
        deliverables: ['Insulation Megger Test Sheets', 'Loop Check Dossier'],
        milestoneRecord: 'Ready for Energization Gate',
      },
      {
        phase: 'Phase 04',
        title: 'Energization & Hot Commissioning',
        objective: 'Energize substation under utility supervision, verify phase rotation, and conduct load run.',
        deliverables: ['Electrical Commissioning Certificate', 'As-Built Schematics'],
        milestoneRecord: 'Final Electrical Handover',
      },
    ],
    technicalSpecs: [
      { parameter: 'Earth Grounding Resistance', standardValue: '< 1.0 Ohm across main earth grid', engineeringNotes: 'Protects sensitive electronic PLC equipment' },
      { parameter: 'Insulation Resistance (Megger Test)', standardValue: '> 100 Megaohms at 1000V DC test voltage', engineeringNotes: 'Mandatory before any cable energization' },
      { parameter: 'Power Factor Target', standardValue: 'Cos φ ≥ 0.95 maintained automatically', engineeringNotes: 'Eliminates utility reactive power penalty surcharges' },
    ],
    reach: {
      title: 'Sectors Served',
      items: [
        'Mining & Mineral Processing Plants',
        'Manufacturing & Heavy Industrial Plants',
        'Financial Services & Corporate Banking Hubs',
        'Petroleum Terminals & Power Substations',
        'Commercial Real Estate & Institutional Facilities',
      ],
    },
    faqs: [
      {
        question: 'Does Green Ngoria provide Class A EPRA certified electrical installations?',
        answer: 'Yes. Our electrical engineers and installation technicians hold full statutory licensing with EPRA and local utility authorizations.',
      },
    ],
    cta: { label: 'Discuss an Electrical Package', href: '/contact' },
  },

  {
    slug: 'oil-and-petroleum',
    name: 'Energy, Petroleum & Depot Infrastructure',
    eyebrow: 'Importation & Supply',
    headline: 'Six service lines across the petroleum value chain: wholesale fuels, lubricants, and depot EPC',
    summary:
      'Wholesale petroleum bulk reseller, high-grade industrial lubricants, fuel logistics, and turnkey retail forecourt and depot construction across all 47 counties of Kenya.',
    intro: [
      'Green Ngoria’s energy and petroleum business operates as an independent reseller of fuel with direct supply capability across the East African region, working under supply agreements with major oil companies.',
      'Organized into six specialized service lines: Wholesale Petroleum, Industrial Lubricants, Specialty Petrochemicals, Road Tanker Logistics, Bulk Depot Infrastructure, and Retail Forecourt Construction.',
      'With headquarters in Nairobi, we deliver tailored fuel optimization solutions and bulk deliveries to commercial mining, transport, and industrial clients in all forty-seven counties of Kenya.',
    ],
    icon: 'Fuel',
    primaryImage: {
      src: '/images/energy/petroleum-depot-infrastructure.webp',
      alt: 'Bulk petroleum depot storage tank infrastructure engineered by Green Ngoria',
      caption: 'Turnkey petroleum depot and bulk fuel storage terminal infrastructure with automated dispensing gantries.',
      badge: 'Petroleum & Depot Infrastructure',
    },
    keyMetrics: [
      { label: 'County Reach', value: 'All 47 Counties', detail: 'Nationwide Fuel Optimization' },
      { label: 'Service Lines', value: '6 Value Streams', detail: 'Fuel, Lubes, Chemicals, Logistics & EPC' },
      { label: 'Compliance Code', value: 'EPRA / NEMA Compliant', detail: 'Fully Licensed Fuel Reseller' },
      { label: 'Logistics Fleet', value: 'Calibrated Tankers', detail: 'Tamper-Evident GPS Monitored' },
    ],
    gallery: [
      {
        src: '/images/energy/petroleum-depot-infrastructure.webp',
        title: 'Petroleum Depot Infrastructure',
        caption: 'On-site petroleum depot and bulk storage terminal infrastructure.',
        tag: 'Bulk Depot',
      },
      {
        src: '/images/energy/retail-forecourt-dispensing.webp',
        title: 'Retail Forecourt Systems',
        caption: 'Retail forecourt fuel dispensing and service station canopy systems.',
        tag: 'Retail Forecourt',
      },
      {
        src: '/images/energy/bulk-fuel-road-transport.webp',
        title: 'Fuel Road Transportation',
        caption: 'Modern fuel road transportation and logistics tanker fleet.',
        tag: 'Tanker Fleet',
      },
      {
        src: '/images/energy/petroleum-lubricants-fluid.webp',
        title: 'High-Performance Lubricants',
        caption: 'High-technology engine oils, hydraulic fluids, and specialty lubricants.',
        tag: 'Lubricants',
      },
    ],
    scope: [
      'Wholesale bulk supply: Low Sulfur Diesel (AGO), Premium Motor Spirit (PMS), and Kerosene',
      'Heavy Fuel Oil (HFO), Bitumen 60/70, Liquefied Petroleum Gas (LPG), and Aviation Jet A-1',
      'High-technology automotive, heavy mining equipment, and marine industrial lubricants',
      'GPS-tracked road tanker transportation delivering to mine sites and commercial depots',
      'Design, engineering, EPRA permitting, and construction of commercial fuel depots',
      'Contemporary retail service station construction, canopies, pumps, and underground tanks',
    ],
    deliverableCategories: [
      {
        category: 'Petroleum Service Streams',
        items: [
          {
            name: 'Wholesale Fuel Sourcing & Delivery',
            standard: 'KEBS KS 1309 / KS 2115',
            description: 'Direct pipeline allocation from KPC terminals with certificate of quality verification.',
          },
          {
            name: 'Heavy Duty Mining & Fleet Lubricants',
            standard: 'API / SAE / ISO VG',
            description: 'Hydraulic oils (ISO 46/68), heavy gear lubes (85W-140), and 15W-40 CI-4 diesel engine oils.',
          },
          {
            name: 'Depot & Retail Forecourt Construction',
            standard: 'EPRA Petroleum Specs',
            description: 'Double-wall underground tanks (UST), spill containment sumps, and digital fuel management.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Fuel Demand Audit & Logistics Sizing',
        objective: 'Analyze client fuel consumption rates, on-site storage capacity, and delivery schedules.',
        deliverables: ['Fuel Supply Agreement', 'Logistics Protocol'],
        milestoneRecord: 'Supply Agreement Execution',
      },
      {
        phase: 'Phase 02',
        title: 'Terminal Loading & Quality Assay',
        objective: 'Load calibrated road tankers at Kenya Pipeline Company (KPC) with density and flashpoint verification.',
        deliverables: ['KPC Loading Bill', 'Quality Assay Certificate'],
        milestoneRecord: 'Terminal Dispatch Gate',
      },
      {
        phase: 'Phase 03',
        title: 'GPS-Tracked Transit & Site Discharge',
        objective: 'Transport fuel under GPS tracking and discharge into client storage tanks with dip-stick verification.',
        deliverables: ['Waybill', 'Dip Tank Discharge Log'],
        milestoneRecord: 'Delivery Receipt Signoff',
      },
    ],
    technicalSpecs: [
      { parameter: 'Diesel (AGO) Sulfur Content', standardValue: '< 50 ppm (Ultra-Low Sulfur Standard)', engineeringNotes: 'Protects modern common-rail electronic diesel engines' },
      { parameter: 'Underground Tank Pressure Rating', standardValue: 'UL 58 / EN 12285-1 Double-Wall', engineeringNotes: 'Withstands hydrostatic ground pressure with interstitial leak monitoring' },
      { parameter: 'Dispensing Accuracy', standardValue: '± 0.25% calibrated with Weights & Measures stamp', engineeringNotes: 'Official statutory calibration' },
    ],
    groups: [
      {
        title: 'Core Petroleum Products',
        items: [
          'Automotive Gasoil (Diesel - 50ppm)',
          'Premium Motor Spirit (Super Petrol)',
          'Heavy Fuel Oil (HFO 180 / 380)',
          'Bitumen (60/70 & 80/100 penetration grade)',
          'Liquefied Petroleum Gas (LPG)',
          'Industrial Lubricants & Hydraulic Oils',
        ],
      },
    ],
    reach: {
      title: 'Geographic Supply Reach',
      items: [
        'Commercial deliveries across all 47 counties of Kenya',
        'Cross-border transit supply to Uganda, Rwanda, and Eastern DRC',
      ],
    },
    faqs: [
      {
        question: 'What is the minimum order quantity for bulk fuel supply?',
        answer: 'We supply full road tanker loads (10,000 to 35,000 litres) directly to mining sites, agricultural estates, and commercial depots.',
      },
    ],
    cta: { label: 'Request a Fuel Supply Quote', href: '/request-rfq' },
    secondaryCta: { label: 'Contact Petroleum Team', href: '/contact' },
  },

  {
    slug: 'timber-importation',
    name: 'Timber Importation & Heavy Wood Products',
    eyebrow: 'Importation & Supply',
    headline: 'Certified hardwood, heavy construction crane mats, and bespoke structural timber',
    summary:
      'Direct importer of certified tropical hardwood, D70/D60 graded timbers, pressure-treated utility poles, heavy crane mats, and marine piling across East Africa.',
    intro: [
      'As a premier timber importer, Green Ngoria is committed to supplying certified wood products at competitive prices, backed by sustainable forest certification and specification to engineering grade.',
      'Our timber products serve demanding sectors: heavy construction, fabrication yards, shipyards and dry docks, civil temporary works, mining shoring, and oilfield pad development.',
      'We supply certified D70 and D60 tropical hardwoods, pressure-treated softwoods, crane mats, skid pads, railway sleepers, marine piling, and custom-milled structural timber.',
    ],
    icon: 'TreePine',
    primaryImage: {
      src: '/images/timber/sawn-hardwood-timber-stock.webp',
      alt: 'Certified sawn hardwood timber stock at Green Ngoria logistics yard',
      caption: 'Certified sawn hardwood timber stock graded to D70 / D60 standards for heavy construction and marine piling.',
      badge: 'Certified Timber Supply',
    },
    keyMetrics: [
      { label: 'Timber Grades', value: 'D70 & D60 Hardwood', detail: 'Tropical & Coniferous Species' },
      { label: 'Preservative Treatment', value: 'Vacuum Pressure CCA', detail: 'BS 5589 / KEBS Compliant' },
      { label: 'Heavy Civil Products', value: 'Crane Mats & Piling', detail: 'Railroad Ties & Teak Decking' },
      { label: 'Yard Stock', value: 'Ex-Stock Dispatch', detail: 'Nairobi & Regional Yard Inventory' },
    ],
    gallery: [
      {
        src: '/images/timber/sawn-hardwood-timber-stock.webp',
        title: 'Certified Hardwood Stock',
        caption: 'Certified sawn hardwood stock at distribution yard.',
        tag: 'Hardwood Stock',
      },
      {
        src: '/images/timber/graded-timber-stacks.webp',
        title: 'Graded Timber Stacks',
        caption: 'Graded timber (D70 & D60 standard and custom sizes).',
        tag: 'D70/D60 Graded',
      },
      {
        src: '/images/timber/container-discharge-timber.webp',
        title: 'Container Yard Logistics',
        caption: 'Container discharge and yard logistics for corporate supply.',
        tag: 'Logistics',
      },
      {
        src: '/images/timber/construction-hardwood-planks.webp',
        title: 'Heavy Construction Planks',
        caption: 'Heavy-duty timber planks for construction, decking, and marine piling.',
        tag: 'Crane Mats & Planks',
      },
    ],
    scope: [
      'Certified deciduous hardwood and softwood sawn timber',
      'Heavy-duty crane mats, skid mats, and marine dock fenders',
      'Custom-milled structural sizes for bridges, mining, and oilfield pads',
      'Teak decking, dunnage, and trench shoring timbers',
      'Hardwood railway ties, marine piling, and bridge deck planks',
      'Pressure-treated utility transmission poles and wooden fencing bollards',
    ],
    deliverableCategories: [
      {
        category: 'Timber Product Categories',
        items: [
          {
            name: 'Heavy Crane Mats & Skid Pads',
            standard: 'Grade D70 Hardwood',
            description: 'Bolted heavy timber mats distributing 100-tonne mobile crane ground pressures.',
          },
          {
            name: 'Pressure-Treated Utility Poles',
            standard: 'KEBS KS 516 / BS 1990',
            description: 'Creosote or CCA pressure-treated transmission poles with guaranteed 25+ year lifespan.',
          },
          {
            name: 'Marine Piling & Shoring Timbers',
            standard: 'ASTM D25 / BS 5268',
            description: 'Dense, decay-resistant tropical hardwood piles for port quays and bridge abutments.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Stage 01',
        title: 'Specification Review & Sourcing',
        objective: 'Determine structural load, species density, dimensions, and moisture content requirements.',
        deliverables: ['Timber Specification Match', 'FSC / Chain-of-Custody Cert'],
        milestoneRecord: 'Sourcing Confirmation',
      },
      {
        phase: 'Stage 02',
        title: 'Milling, Seasoning & Pressure Treatment',
        objective: 'Precision saw logs to dimensions, kiln dry, and apply vacuum pressure preservative treatment.',
        deliverables: ['Treatment Chemical Penetration Cert', 'Moisture Test Log'],
        milestoneRecord: 'Quality Release Gate',
      },
      {
        phase: 'Stage 03',
        title: 'Yard Logistics & Site Dispatch',
        objective: 'Bundle, strap, and transport timber lots directly to the client construction site or fabrication yard.',
        deliverables: ['Delivery Note', 'Grading Certificate'],
        milestoneRecord: 'Site Delivery Record',
      },
    ],
    technicalSpecs: [
      { parameter: 'D70 Hardwood Density', standardValue: '950 – 1,150 kg/m³ air-dry', engineeringNotes: 'Extremely dense, naturally resistant to termites and rot' },
      { parameter: 'Moisture Content (Kiln Dried)', standardValue: '< 15% – 18% moisture content', engineeringNotes: 'Prevents warping and dimensional shrinkage' },
      { parameter: 'Chemical Preservative Retention', standardValue: 'CCA Type C (Minimum 12 kg/m³ retention)', engineeringNotes: 'Deep vacuum pressure penetration for ground contact' },
    ],
    reach: {
      title: 'Industry Applications',
      items: [
        'Heavy Civil Construction & Bridge Building',
        'Mining Shaft Shoring & Conveyor Supports',
        'Shipyards, Dry Docks & Port Marine Piling',
        'Power Transmission & Telecom Utility Networks',
        'High-End Architectural Teak Decking',
      ],
    },
    faqs: [
      {
        question: 'Can Green Ngoria supply custom-milled large dimension timbers?',
        answer: 'Yes. We can custom mill heavy timbers up to 400mm x 400mm section and lengths up to 8 metres according to engineering specifications.',
      },
    ],
    cta: { label: 'Request a Timber Quote', href: '/request-rfq' },
  },

  {
    slug: 'general-supplies',
    name: 'General Supplies & Corporate Procurement',
    eyebrow: 'Importation & Supply',
    headline: 'Consolidated procurement, corporate merchandise, office consumables, and humanitarian relief supplies',
    summary:
      'Reliable general merchandise importation, corporate office consumables, and humanitarian relief supplies for consumer companies, financial institutions, NGOs, and government.',
    intro: [
      'Since inception, Green Ngoria has established itself as a reputable, reliable partner in general merchandise importation, consolidated procurement, and corporate supply management.',
      'We are widely known and respected in the regional market — delivering to financial institutions, corporate enterprises, the NGO humanitarian sector, and public government ministries.',
      'With established supply chains across East Africa and dedicated warehousing in Nairobi, we ensure rapid order fulfillment and complete transparency.',
    ],
    icon: 'Package',
    primaryImage: {
      src: '/images/timber/container-discharge-timber.webp',
      alt: 'Container discharge and import distribution logistics warehouse',
      caption: 'Import container discharge and consolidated logistics distribution for corporate and institutional procurement.',
      badge: 'Procurement & Supplies',
    },
    keyMetrics: [
      { label: 'Client Sectors', value: 'Corporate & NGOs', detail: 'Banks, Humanitarian Agencies & Government' },
      { label: 'Supply Speed', value: 'Rapid Dispatch', detail: 'Ex-Warehouse Stock & Fleet Delivery' },
      { label: 'Quality Verification', value: '100% Inspected', detail: 'Specification Verification & Guarantees' },
      { label: 'Logistics Footprint', value: 'East Africa Wide', detail: 'Kenya, Uganda, Tanzania, Rwanda' },
    ],
    gallery: [
      {
        src: '/images/timber/container-discharge-timber.webp',
        title: 'Import Distribution Logistics',
        caption: 'Container discharge and import distribution logistics for corporate clients.',
        tag: 'Import Logistics',
      },
      {
        src: '/images/timber/sawn-hardwood-timber-stock.webp',
        title: 'Corporate Stock Staging',
        caption: 'Consolidated corporate, NGO, and relief supplies staging yard.',
        tag: 'Warehouse Staging',
      },
    ],
    scope: [
      'General merchandise importation, customs clearing, and delivery',
      'Corporate office supplies, IT consumables, and business equipment',
      'Humanitarian relief supplies for NGO and agency emergency programmes',
      'Consolidated freight logistics and warehousing across East Africa',
    ],
    deliverableCategories: [
      {
        category: 'Supplies Overview',
        items: [
          {
            name: 'Corporate Procurement Solutions',
            description: 'Bulk sourcing of office furniture, IT hardware, consumables, and corporate branded goods.',
          },
          {
            name: 'Humanitarian & Relief Supplies',
            description: 'Emergency tents, tarpaulins, water purification units, hygiene kits, and emergency provisions.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Step 01',
        title: 'Requisition & RFQ Evaluation',
        objective: 'Review bill of quantities, identify verified suppliers, and issue line-item quotation.',
        deliverables: ['Priced Quotation', 'Delivery Timeline'],
        milestoneRecord: 'PO Issuance',
      },
      {
        phase: 'Step 02',
        title: 'Quality Inspection & Dispatch',
        objective: 'Verify goods against sample specifications and dispatch via dedicated transport fleet.',
        deliverables: ['Quality Inspection Signoff', 'Dispatch Waybill'],
        milestoneRecord: 'Goods Delivery Signoff',
      },
    ],
    technicalSpecs: [
      { parameter: 'Procurement Turnaround', standardValue: '24 to 72 Hours for In-Stock Items', engineeringNotes: 'Nationwide delivery capability' },
      { parameter: 'Quality Assurance', standardValue: '100% Pre-Shipment Inspection', engineeringNotes: 'Backed by manufacturer warranty' },
    ],
    reach: {
      title: 'Client Sectors',
      items: [
        'Consumer & FMCG Companies',
        'Commercial Banks & Financial Institutions',
        'Humanitarian & NGO Agencies',
        'Government Ministries & County Departments',
      ],
    },
    faqs: [
      {
        question: 'How do corporate clients establish supply framework agreements?',
        answer: 'We establish structured service level agreements (SLAs) with fixed pricing schedules and guaranteed delivery lead times for annual procurement contracts.',
      },
    ],
    cta: { label: 'Request a Supply Quote', href: '/request-rfq' },
  },
];

export const serviceDivisionsBySlug: Record<string, ServiceDivision> =
  Object.fromEntries(serviceDivisions.map((d) => [d.slug, d]));

export function getServiceDivision(slug: string): ServiceDivision | undefined {
  return serviceDivisionsBySlug[slug];
}
