/**
 * Content for the engineering and capability sub-pages served by `src/app/(public)/[slug]`.
 *
 * Transcribed and enhanced according to enterprise mining-plant engineering standards,
 * linking process, mechanical, electrical, civil, and metallurgical deliverables.
 */

export interface GalleryItem {
  src: string;
  alt: string;
  title: string;
  description: string;
  tag: string;
}

export interface TechnicalDeliverableCategory {
  category: string;
  icon?: string;
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

export interface PublicPageContent {
  slug: string;
  eyebrow: string;
  title: string;
  headline: string;
  description: string;
  intro: string;
  leadParagraphs: string[];
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
  gallery: GalleryItem[];
  capabilities: string[];
  deliverableCategories: TechnicalDeliverableCategory[];
  lifecyclePhases: LifecyclePhase[];
  technicalSpecs: TechnicalSpecification[];
  lifecycle: string[];
  note: string;
  faqs: {
    question: string;
    answer: string;
  }[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export const capabilityPages: Record<string, PublicPageContent> = {
  'mining-plant-engineering': {
    slug: 'mining-plant-engineering',
    eyebrow: 'Process & Mechanical Engineering',
    title: 'Mining Plant Engineering & Process Design',
    headline: 'Coordinated process, mechanical, electrical and structural design deliverables',
    description:
      'Turnkey engineering and process design for gold mineral processing facilities, Carbon-in-Pulp (CIP), Carbon-in-Leach (CIL), and gravity concentration circuits across East Africa.',
    intro:
      'Green Ngoria provides multidisciplinary engineering design led by qualified process, mechanical, civil, and electrical engineers. Every deliverable is managed as a controlled project record linking process flowsheets, piping and instrumentation diagrams (P&IDs), 3D equipment layouts, structural calculations, and statutory NEMA/EPRA compliance.',
    leadParagraphs: [
      'Our engineering department translates mineralogical ore characteristics into robust, cost-effective flowsheet designs tailored to the specific gold geology of East Africa.',
      'From Run-of-Mine (ROM) primary crushing through fine grinding classification, agitation leaching, carbon adsorption, elution, and electrowinning, our engineers model every stage for maximum gold recovery, energy efficiency, and operational uptime.',
      'All engineering documentation is prepared in accordance with international quality standards (ISO 9001:2015) and environmental containment frameworks (ISO 14001:2015).',
    ],
    primaryImage: {
      src: '/images/engineering/plant-engineering-3d-cad.webp',
      alt: '3D CAD process flow and piping layout of gold mineral processing plant',
      caption:
        '3D Isometric CAD model of turnkey gold mineral processing plant showing ball mill grinding, hydrocyclones, and CIL agitation tank farm.',
      badge: '3D Process & Mechanical CAD',
    },
    keyMetrics: [
      { label: 'Engineering Disciplines', value: '4 Core Fields', detail: 'Process, Mechanical, Civil & Electrical' },
      { label: 'Standard Framework', value: 'ISO 9001 / 14001', detail: 'Certified Quality & Environmental Design' },
      { label: 'Circuit Specialization', value: 'CIP / CIL / Gravity', detail: 'Refractory & Free-Milling Gold Ores' },
      { label: 'Statutory Approval', value: 'NEMA & Mining Act', detail: 'Full Regulatory Prequalification' },
    ],
    gallery: [
      {
        src: '/images/engineering/plant-engineering-3d-cad.webp',
        alt: 'Turnkey 3D engineering CAD layout of CIP/CIL gold processing plant',
        title: '3D Plant Process & Piping Layout',
        description:
          'Comprehensive 3D mechanical CAD model integrating ball mill grinding circuits, slurry pipe racks, interstage carbon screens, and CIL tank farm foundations.',
        tag: 'Process Design',
      },
      {
        src: '/images/projects/bondo-gold-processing-plant.webp',
        alt: 'NEMA-approved gold processing facility engineered at Bondo site',
        title: 'As-Built Operating Plant Structure',
        description:
          'Field implementation of engineered gold processing facility at Bondo, Siaya County (NEMA/PR/SYA/002) featuring primary grinding and CIL tanks.',
        tag: 'Field Execution',
      },
      {
        src: '/images/electrical/plant-control-panels.webp',
        alt: 'Plant control panels, instrumentation, and PLC automation wiring',
        title: 'MCC & Electrical Automation Loop',
        description:
          'Motor Control Center (MCC) panels, frequency drives, and automated sensor loops controlling slurry feed rates and agitator motor loads.',
        tag: 'Electrical Design',
      },
      {
        src: '/images/mechanical/pipework-fabrication.webp',
        alt: 'Industrial process pipework fabrication and slurry manifold assembly',
        title: 'Piping & Slurry Manifolds',
        description:
          'High-density slurry pipework, chemical-resistant lined fittings, and automated valve manifolds for cyanide slurry reticulation.',
        tag: 'Piping & Mechanical',
      },
    ],
    capabilities: [
      'Process Flow Diagrams (PFD) and Mass/Water Balance Modeling',
      'Piping & Instrumentation Diagrams (P&IDs) with ISA-standard symbology',
      '3D Plant Equipment General Arrangement (GA) and Piping Layouts',
      'Mechanical equipment datasheets, sizing calculations & duty specifications',
      'Civil and structural foundation design for heavy dynamic grinding mills',
      'High-voltage electrical switchgear, MCC panels and PLC automation loops',
      'Environmental containment, tailings dam design and cyanide detoxification',
      'Controlled drawing revisions, engineering transmittals and as-built records',
    ],
    deliverableCategories: [
      {
        category: 'Process & Metallurgical Deliverables',
        items: [
          {
            name: 'Process Design Criteria (PDC)',
            standard: 'ISO 9001',
            description: 'Defines ore throughput (tpd), mineral recovery targets, slurry densities, and retention times.',
          },
          {
            name: 'Process Flow Diagrams (PFD)',
            standard: 'ISA-5.1',
            description: 'Comprehensive mass, slurry volume, water balance, and reagent consumption flowsheet.',
          },
          {
            name: 'Piping & Instrumentation Diagrams (P&ID)',
            standard: 'ANSI/ISA',
            description: 'Complete piping line lists, valve schedules, and instrumentation interlock loops.',
          },
        ],
      },
      {
        category: 'Mechanical & Structural Deliverables',
        items: [
          {
            name: 'Equipment General Arrangement (GA)',
            standard: 'BS 8888',
            description: 'Detailed 3D models and orthogonal drawings for crushers, mills, screens, and tank farms.',
          },
          {
            name: 'Dynamic Foundation Engineering',
            standard: 'Eurocode 2 / ACI 318',
            description: 'Structural concrete design absorbing vibrational harmonics from rotary ball mills.',
          },
          {
            name: 'Structural Steelwork & Pipe Racks',
            standard: 'BS 5950 / AISC',
            description: 'Fabrication drawings for access walkways, stair towers, crane gantries, and pipe supports.',
          },
        ],
      },
      {
        category: 'Electrical, Control & HSE Deliverables',
        items: [
          {
            name: 'Single Line Diagrams (SLD) & MCC Layouts',
            standard: 'IEC 60364',
            description: 'Plant power distribution, motor protection, transformer sizing, and grounding grids.',
          },
          {
            name: 'Functional Control Philosophy & PLC Logic',
            standard: 'IEC 61131',
            description: 'Automated interlocks for slurry pump sequencing, emergency e-stops, and cyanide dosing.',
          },
          {
            name: 'Environmental Impact & Containment Dossier',
            standard: 'NEMA / ISO 14001',
            description: 'Spill bunding, cyanide destruction circuit design, and tailings containment specifications.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Design Basis & Metallurgical Review',
        objective: 'Establish definitive ore characteristics, throughput requirements, and site constraints.',
        deliverables: ['Design Basis Memorandum', 'Ore Sizing Curve', 'Process Flowsheet Selection'],
        milestoneRecord: 'Signed Design Basis Agreement',
      },
      {
        phase: 'Phase 02',
        title: 'Front-End Engineering Design (FEED)',
        objective: 'Develop complete PFDs, P&IDs, equipment sizing datasheets, and civil layout blueprints.',
        deliverables: ['Approved P&IDs', '3D Plant GA Model', 'Mechanical Equipment Specifications'],
        milestoneRecord: 'FEED Approval Gate & Transmittal',
      },
      {
        phase: 'Phase 03',
        title: 'Detailed Engineering & Fabrication Packages',
        objective: 'Issue certified fabrication drawings, structural steel bills of quantities, and electrical schematics.',
        deliverables: ['Issued for Construction (IFC) Drawings', 'Structural Steel Fabrication Packs', 'Cable Schedules'],
        milestoneRecord: 'IFC Release Dossier',
      },
      {
        phase: 'Phase 04',
        title: 'Site Support & As-Built Verification',
        objective: 'Provide on-site engineering supervision during erection and capture all as-built modifications.',
        deliverables: ['Technical Query Responses', 'Site Instruction Records', 'Final As-Built Drawing Archive'],
        milestoneRecord: 'Engineering Handover Certificate',
      },
    ],
    technicalSpecs: [
      { parameter: 'Plant Ore Throughput Capacity', standardValue: '50 – 2,500 tpd (customized per project)', engineeringNotes: 'Scalable modular CIL and gravity circuit layouts' },
      { parameter: 'Target Grind Size (P80)', standardValue: '74 µm (80% passing 200 mesh)', engineeringNotes: 'Matched with ball mill power and cyclone classification' },
      { parameter: 'Leach Residence Time', standardValue: '24 – 36 hours continuous agitation', engineeringNotes: 'Calculated from laboratory cyanide leaching kinetics' },
      { parameter: 'Structural Steel Wind & Seismic Rating', standardValue: 'Zone 4 / 160 km/h wind load', engineeringNotes: 'Engineered for Rift Valley and East African terrain' },
    ],
    lifecycle: [
      'Design Basis',
      'Process Flowsheets (PFD)',
      'Piping & Instrumentation (P&ID)',
      '3D Mechanical Modeling',
      'Structural & Civil Design',
      'Issued-for-Construction (IFC)',
    ],
    note: 'All engineering deliverables are produced under the supervision of registered professional engineers and comply with statutory NEMA, EPRA, and Mining Act requirements.',
    faqs: [
      {
        question: 'What information is needed to begin engineering a new gold processing plant?',
        answer:
          'We require ore mineralogy reports, head grade assays, metallurgical leach test results (or bulk samples for testing), target daily throughput (tpd), water and power availability data, and site topographical surveys.',
      },
      {
        question: 'Can Green Ngoria customize designs for refractory vs free-milling gold ores?',
        answer:
          'Yes. Free-milling ores utilize high-efficiency gravity concentrators and direct cyanidation, whereas refractory ores incorporate intensive fine grinding, chemical pre-oxidation, and tailored CIL carbon circuits.',
      },
      {
        question: 'Are Green Ngoria engineering drawings accepted by regulatory bodies like NEMA?',
        answer:
          'Yes. Our engineering packages have successfully secured statutory NEMA approvals (including Ref: NEMA/PR/SYA/002) and local county building authorizations.',
      },
    ],
    primaryCta: { label: 'Request Plant Assessment', href: '/technical-assessment' },
    secondaryCta: { label: 'Contact Engineering Team', href: '/contact' },
  },

  'mining-plant-construction': {
    slug: 'mining-plant-construction',
    eyebrow: 'EPC & Site Delivery',
    title: 'Mining Plant Construction & Turnkey Erection',
    headline: 'Safe, on-schedule site construction, heavy mechanical erection, and pre-commissioning',
    description:
      'Turnkey engineering, procurement, and construction (EPC) for mineral processing facilities. We execute heavy foundation casting, ball mill mounting, agitation tank farm erection, and high-voltage electrical commissioning.',
    intro:
      'Green Ngoria brings certified construction management, heavy rigging capability, and disciplined health, safety, and environmental (EHS) supervision to mining sites across East Africa. From breaking ground on remote greenfield concessions to erecting high-tonnage processing equipment, we deliver operating plants on time and within budget.',
    leadParagraphs: [
      'Mining plant construction demands rigorous civil precision and specialized mechanical expertise. A slight misalignment in a 40-tonne ball mill or a defect in a 1,000 m³ leach tank foundation can cause catastrophic operational failure.',
      'Our site teams comprise certified civil engineers, qualified coded welders, master riggers, and instrumentation specialists who execute every stage to procedure under ISO 9001 quality controls.',
      'We handle all site logistics, concrete batching, heavy craneage, structural steel erection, slurry pipe fabrication, and pre-commissioning checks.',
    ],
    primaryImage: {
      src: '/images/engineering/plant-construction-crane-site.webp',
      alt: 'Heavy mobile crane erecting cylindrical ball mill onto reinforced concrete foundations',
      caption:
        'Certified mining engineers and heavy rigging crew setting a primary ball mill onto reinforced dynamic foundation plinths.',
      badge: 'Heavy Mechanical Erection',
    },
    keyMetrics: [
      { label: 'EHS Safety Record', value: 'Zero Lost Time', detail: 'Strict ISO 18001 / OHSAS Adherence' },
      { label: 'Heavy Rigging Capacity', value: 'Up to 100 Tonnes', detail: 'Mobile Cranes & Precision Jacks' },
      { label: 'Welding Standards', value: 'ASME IX Certified', detail: '100% NDT on Critical Slurry Lines' },
      { label: 'Turnkey Delivery', value: 'EPC / EPCM', detail: 'Civil, Mechanical & Electrical' },
    ],
    gallery: [
      {
        src: '/images/engineering/plant-construction-crane-site.webp',
        alt: 'Heavy crane erecting ball mill on concrete foundation with engineers inspecting blueprints',
        title: 'Ball Mill Lifting & Placement',
        description:
          'Precision positioning and laser alignment of a heavy cylindrical grinding mill shell onto reinforced concrete dynamic foundation pedestals.',
        tag: 'Heavy Mechanical',
      },
      {
        src: '/images/mining/ball-mill-installation-bondo.webp',
        alt: 'Ball mill mechanical mounting and drive motor assembly on site at Bondo',
        title: 'Drive Motor & Pinion Assembly',
        description:
          'Mechanical engineers aligning the electric drive motor, reduction gearbox, and girth gear pinion on the operating plant plinth.',
        tag: 'Mechanical Mounting',
      },
      {
        src: '/images/mining/leach-cil-tank-construction.webp',
        alt: 'CIL leach agitation tank farm circular wall construction and concrete foundation',
        title: 'CIL Leach Tank Farm Erection',
        description:
          'Civil and structural erection of circular leaching tanks, agitation baffle frames, and environmental containment bunding.',
        tag: 'Civil & Tanks',
      },
      {
        src: '/images/electrical/high-voltage-switchyard.webp',
        alt: 'High-voltage substation and plant switchyard construction',
        title: 'Substation & Power Infrastructure',
        description:
          'High-voltage transformer installation, switchyard grounding grid, and main power distribution to heavy plant motors.',
        tag: 'Electrical Erection',
      },
    ],
    capabilities: [
      'Site clearing, mass earthworks, terrace leveling and drainage formation',
      'Reinforced concrete dynamic foundations for vibrating crushers and ball mills',
      'Heavy structural steel fabrication, crane gantry erection and elevated walkways',
      'Carbon-in-Leach (CIL) and Carbon-in-Pulp (CIP) steel tank assembly and welding',
      'Mechanical alignment and laser leveling of rotary mills, gearboxes, and motors',
      'High-pressure slurry pipework, HDPE line fusion and chemical manifold fabrication',
      'Electrical substation installation, cable tray routing, MCC hookup and PLC wiring',
      'Non-destructive testing (NDT), hydro-testing, pre-commissioning and punch list closeout',
    ],
    deliverableCategories: [
      {
        category: 'Civil & Foundation Works',
        items: [
          {
            name: 'Reinforced Dynamic Machine Plinths',
            standard: 'BS 8110 / ACI 318',
            description: 'Mass concrete foundation casting with vibration dampeners for primary ball mills and crushers.',
          },
          {
            name: 'Secondary Containment & Bund Walls',
            standard: 'ISO 14001 / NEMA',
            description: 'Impermeable chemical-resistant containment bunds designed to hold 110% of tank volume.',
          },
          {
            name: 'Plant Civil Buildings & Gold Room',
            standard: 'KPDA Security Specs',
            description: 'Reinforced masonry construction for motor control centers, laboratory, and high-security gold room.',
          },
        ],
      },
      {
        category: 'Mechanical Assembly & Rigging',
        items: [
          {
            name: 'Heavy Equipment Rigging & Erection',
            standard: 'OSHA / BS 7121',
            description: 'Certified lift planning and dual-crane maneuvers for oversized mill shells and thickener tanks.',
          },
          {
            name: 'Shaft Laser Alignment & Balancing',
            standard: 'ISO 10816',
            description: 'Sub-millimeter optical and laser alignment of motor-gearbox-trunnion drive trains.',
          },
          {
            name: 'Process Piping & Hydro-Testing',
            standard: 'ASME B31.3',
            description: 'Full radiographic / ultrasonic NDT testing on pressurized slurry, air, and cyanide circuits.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Phase 01',
        title: 'Mobilization & Site Establishment',
        objective: 'Establish construction camp, security perimeters, batching plants, and temporary power.',
        deliverables: ['Site Execution Plan', 'EHS Induction Records', 'Survey Control Monuments'],
        milestoneRecord: 'Site Mobilization Notice',
      },
      {
        phase: 'Phase 02',
        title: 'Civil & Foundation Construction',
        objective: 'Excavate and cast reinforced concrete foundations for heavy mills, crushers, and CIL tank farm.',
        deliverables: ['Concrete Cube Test Reports', 'Foundation Inspection Signoffs', 'Earthworks Compaction Logs'],
        milestoneRecord: 'Civil Completion Certificate',
      },
      {
        phase: 'Phase 03',
        title: 'Structural Steel & Mechanical Installation',
        objective: 'Erect steel structures, place heavy process machinery, and weld tank shells and piping.',
        deliverables: ['Mechanical Alignment Reports', 'Welding NDT Certificates', 'Torque Audit Logs'],
        milestoneRecord: 'Mechanical Completion Certificate',
      },
      {
        phase: 'Phase 04',
        title: 'Cold Commissioning & Dry Run',
        objective: 'Energize electrical systems, test motor rotation, verify sensor loops, and clear punch list items.',
        deliverables: ['Motor Run Test Sheets', 'Loop Check Dossier', 'Pre-Commissioning Signoff'],
        milestoneRecord: 'Ready for Wet Commissioning Gate',
      },
    ],
    technicalSpecs: [
      { parameter: 'Concrete Compressive Strength (Plinths)', standardValue: 'C35/45 with sulfate-resistant cement', engineeringNotes: 'Engineered for chemical resistance and dynamic loads' },
      { parameter: 'Mill Shaft Alignment Tolerance', standardValue: '< 0.05 mm radial & axial runout', engineeringNotes: 'Verified with dual-axis laser measurement' },
      { parameter: 'Tank Weld Quality Testing', standardValue: '100% Visual + 20% Dye Penetrant & Radiography', engineeringNotes: 'Zero leakage tolerance on cyanide slurry tanks' },
      { parameter: 'Electrical Isolation Rating', standardValue: 'IP65 on all outdoor field motor isolators', engineeringNotes: 'Dust and water jet resistant for mine environments' },
    ],
    lifecycle: [
      'Site Mobilization',
      'Civil & Foundations',
      'Heavy Mechanical Rigging',
      'Tank Farm Assembly',
      'Electrical & Piping',
      'Cold Commissioning',
    ],
    note: 'All construction and mechanical erection activities are performed under strict EHS protocols with full daily site logging and certified quality inspection checkpoints.',
    faqs: [
      {
        question: 'Does Green Ngoria manage its own construction workforce and heavy machinery?',
        answer:
          'Yes. We maintain qualified permanent staff for construction management, certified welding, electrical installation, and rigging, backed by company-owned logistics and partnering crane fleets.',
      },
      {
        question: 'How does Green Ngoria ensure construction safety on remote mining sites?',
        answer:
          'We enforce a zero-harm EHS policy, mandatory daily toolbox talks, certified lift plans for all crane maneuvers, hot-work permits, and continuous environmental monitoring under ISO 14001.',
      },
      {
        question: 'What is the typical timeframe for constructing a modular CIP/CIL gold plant?',
        answer:
          'Depending on throughput capacity (e.g. 100 – 500 tpd), construction and cold commissioning typically take between 4 to 8 months from civil foundation commencement.',
      },
    ],
    primaryCta: { label: 'Plan a Plant Construction Project', href: '/contact' },
    secondaryCta: { label: 'Explore Equipment Catalogue', href: '/equipment' },
  },

  'plant-optimization': {
    slug: 'plant-optimization',
    eyebrow: 'Metallurgical Diagnostics',
    title: 'Plant Optimization & Metallurgical Recovery Audit',
    headline: 'Eliminate process bottlenecks, reduce reagent waste, and maximize gold recovery yield',
    description:
      'Comprehensive on-site and laboratory diagnostic audits for operating gold mineral processing plants. We evaluate grinding efficiency, cyanide leach kinetics, carbon adsorption capacity, and tailings losses.',
    intro:
      'Many operating mineral processing plants lose between 8% and 25% of potential gold recovery due to unrecognized bottlenecks in the circuit: unoptimized grind size, poor hydrocyclone classification, short-circuiting in leach tanks, or fouled activated carbon. Green Ngoria provides evidence-based metallurgical optimization that turns lost gold into recovered revenue.',
    leadParagraphs: [
      'Optimization begins with empirical data: on-site slurry sampling, particle size distribution (PSD) analysis, cyanide consumption curves, carbon loading assays, and tailings diagnostic analysis.',
      'Our metallurgical engineers audit each circuit stage to pinpoint exact recovery leaks — whether in gravity recovery, leaching kinetics, carbon activity, or electrowinning cell current efficiency.',
      'We deliver a prioritized, cost-benefit ranked engineering recommendation report and provide hands-on implementation support to ensure sustained performance gains.',
    ],
    primaryImage: {
      src: '/images/engineering/plant-optimization-kinetics-lab.webp',
      alt: 'Metallurgical laboratory technician testing cyanide leaching kinetics and CIP carbon adsorption',
      caption:
        'Metallurgical engineer conducting gold leaching kinetics, carbon adsorption profiling, and particle size distribution (P80) analysis.',
      badge: 'Metallurgical Diagnostics',
    },
    keyMetrics: [
      { label: 'Typical Recovery Boost', value: '+5% to +18%', detail: 'Verified on Field Audits' },
      { label: 'Reagent Cost Reduction', value: '15% – 30%', detail: 'Cyanide & Lime Consumption' },
      { label: 'Diagnostic Timeframe', value: '5 – 10 Days', detail: 'On-Site Sampling & Assay' },
      { label: 'Deliverable', value: 'Actionable Audit Dossier', detail: 'Ranked Engineering Roadmap' },
    ],
    gallery: [
      {
        src: '/images/engineering/plant-optimization-kinetics-lab.webp',
        alt: 'Metallurgical testing laboratory showing digital leach curves and titration apparatus',
        title: 'Leach Kinetics & Carbon Testing',
        description:
          'Diagnostic laboratory testing measuring cyanide dissolution rates, lime consumption, and activated carbon loading capacity over time.',
        tag: 'Lab Kinetics',
      },
      {
        src: '/images/mining/gravity-sluice-table.webp',
        alt: 'Field metallurgical engineer evaluating gravity concentration table performance',
        title: 'Gravity Separation Circuit Audit',
        description:
          'On-site examination of centrifugal concentrators and shaking tables to maximize coarse free-gold recovery ahead of cyanide leaching.',
        tag: 'Gravity Audit',
      },
      {
        src: '/images/mining/production-weighed-digital-scale.webp',
        alt: 'Refined gold bullion bars weighed on certified analytical scale displaying 4.207 kg',
        title: 'Precision Assay & Bullion Weighing',
        description:
          'High-precision weighing (4.207 kg gold bullion batch) and certified assay verification to document recovery yields and custody provenance.',
        tag: 'Assay Verification',
      },
      {
        src: '/images/mining/centrifugal-concentrators.webp',
        alt: 'Knelson centrifugal concentrator optimization and water pressure tuning',
        title: 'Centrifugal Concentrator Tuning',
        description:
          'Fluidization water pressure and cycle-time optimization on centrifugal concentrators to boost single-pass recovery rates.',
        tag: 'Circuit Tuning',
      },
    ],
    capabilities: [
      'Comprehensive plant mass balance and metallurgical circuit sampling',
      'Grinding circuit profiling (P80 particle size distribution and recirculating loads)',
      'Hydrocyclone classification cut-point (D50) and apex/vortex finder optimization',
      'Cyanide leaching kinetics, dissolved oxygen profiling and lime buffer tuning',
      'Activated carbon activity testing, attrition rate audit and regeneration review',
      'Elution column temperature, pressure, and electrowinning cell current efficiency audit',
      'Tailings assaying (solid vs solution gold loss breakdown and diagnostic leach)',
      'Reagent dosing automation and operational Standard Operating Procedure (SOP) updates',
    ],
    deliverableCategories: [
      {
        category: 'Diagnostic Testing Scope',
        items: [
          {
            name: 'Grind Size Distribution (PSD / P80)',
            standard: 'ASTM E11',
            description: 'Determines whether gold is under-liberated (too coarse) or over-ground into slime.',
          },
          {
            name: 'Diagnostic Cyanidation Leach Tests',
            standard: 'Metallurgical Standard',
            description: 'Identifies refractory gold locked in sulfides, carbonaceous matter, or silicate matrix.',
          },
          {
            name: 'Carbon Activity & Fouling Profile',
            standard: 'ASTM D3838',
            description: 'Measures carbon adsorption rate (R-value) and organic/calcium carbonate fouling levels.',
          },
        ],
      },
      {
        category: 'Engineering Recommendations',
        items: [
          {
            name: 'Circuit Bottleneck Identification Report',
            standard: 'Green Ngoria System 4',
            description: 'Pinpoints specific equipment and process stages constraining plant throughput or recovery.',
          },
          {
            name: 'Reagent Optimization Schedule',
            standard: 'Cyanide Code Aligned',
            description: 'Calculated stoichiometric dosing rates for NaCN, hydrated lime, lead nitrate, and flocculants.',
          },
          {
            name: 'Prioritized Capital / Operational Roadmap',
            standard: 'Cost-Benefit Matrix',
            description: 'Clear list of quick-win operational tweaks vs high-ROI equipment upgrades.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Step 01',
        title: 'Baseline Assessment & Data Intake',
        objective: 'Review historical production records, head grades, reagent logs, and plant flowsheets.',
        deliverables: ['Baseline Data Audit Log', 'Sampling Point Map', 'Diagnostic Test Plan'],
        milestoneRecord: 'Audit Scoping Agreement',
      },
      {
        phase: 'Step 02',
        title: 'On-Site Slurry Sampling & Field Measurements',
        objective: 'Conduct synchronized sampling across all circuit stages over full operating shifts.',
        deliverables: ['Shift Slurry Sample Log', 'Slurry Density Measurements', 'DO & pH Profile Sheets'],
        milestoneRecord: 'Sampling Campaign Signoff',
      },
      {
        phase: 'Step 03',
        title: 'Laboratory Assays & Kinetics Modeling',
        objective: 'Perform size fraction assays, diagnostic leaching, and carbon adsorption kinetic tests.',
        deliverables: ['Metallurgical Assay Sheets', 'Leach Kinetic Curves', 'Tailings Loss Breakdown'],
        milestoneRecord: 'Laboratory Results Report',
      },
      {
        phase: 'Step 04',
        title: 'Engineering Report & Implementation Support',
        objective: 'Deliver prioritized recommendations and assist plant operators in tuning circuit parameters.',
        deliverables: ['Plant Optimization Master Report', 'Updated Operator SOPs', 'Verification Assay Log'],
        milestoneRecord: 'Optimization Closeout Review',
      },
    ],
    technicalSpecs: [
      { parameter: 'Dissolved Oxygen (DO) in Leach Tanks', standardValue: '6.0 – 8.5 ppm continuous', engineeringNotes: 'Maintained via spargers or compressed air injection' },
      { parameter: 'Slurry pH Buffer Level', standardValue: '10.2 – 10.8 with Hydrated Lime', engineeringNotes: 'Prevents toxic HCN gas formation and optimizes cyanide efficiency' },
      { parameter: 'Carbon Concentration in CIL Tanks', standardValue: '10 – 20 g/L slurry volume', engineeringNotes: 'Staged counter-current movement to minimize solution losses' },
      { parameter: 'Electrowinning Single-Pass Gold Deposition', standardValue: '> 90% solution gold stripped', engineeringNotes: 'Optimized voltage, flow rate, and cathode surface area' },
    ],
    lifecycle: [
      'Historical Baseline Review',
      'On-Site Slurry Sampling',
      'Laboratory Kinetics Assay',
      'Bottleneck Analysis',
      'Engineering Report',
      'Operator Tuning & Verification',
    ],
    note: 'Plant optimization recommendations are based on verified metallurgical testing and engineering analysis, subject to final client operational approval.',
    faqs: [
      {
        question: 'How quickly can Green Ngoria perform an on-site plant optimization audit?',
        answer:
          'Our metallurgical audit team can mobilize within 3 to 7 business days. On-site sampling typically requires 3 to 5 days, followed by laboratory assays and delivery of the final optimization report within 10 to 14 days.',
      },
      {
        question: 'Can optimization reduce our cyanide and reagent expenditure?',
        answer:
          'Yes. Most processing plants over-dose cyanide and lime due to lack of real-time kinetic control. Optimization typically cuts reagent costs by 15% to 30% while maintaining or increasing recovery.',
      },
      {
        question: 'Does the audit include recommendations for re-processing old tailings?',
        answer:
          'Yes. We conduct diagnostic tailings assays to determine recoverable gold in existing tailings dams and engineer economic regrind or CIL re-treatment flowsheets.',
      },
    ],
    primaryCta: { label: 'Request Plant Optimization Audit', href: '/technical-assessment' },
    secondaryCta: { label: 'Discuss with a Metallurgist', href: '/contact' },
  },

  'technical-assessment': {
    slug: 'technical-assessment',
    eyebrow: 'System 4 Digital Intake',
    title: 'Technical Plant Assessment & Feasibility Intake',
    headline: 'Transform operational plant challenges into a qualified engineering opportunity',
    description:
      'Structured technical assessment process for mining sites, new project feasibility, and processing plant expansion across East and Central Africa.',
    intro:
      'Green Ngoria’s Technical Plant Assessment (System 4) is our signature engineering intake mechanism. Rather than providing generic estimates, we collect structured data covering ore geology, processing capacity, water and power utilities, equipment condition, and client objectives to develop an accurate, actionable engineering proposal.',
    leadParagraphs: [
      'Whether you are developing a new gold deposit in Siaya or upgrading an existing mineral processing plant in Tanzania, the technical assessment establishes the empirical foundation for all downstream work.',
      'Our engineering team analyzes ore grade profiles, mineralogical associations, existing mechanical constraints, and statutory requirements to determine optimal flowsheet design and equipment sizing.',
      'Submissions are reviewed by our senior process engineers, who generate a qualified technical response, reference number, and preliminary scope of work.',
    ],
    primaryImage: {
      src: '/images/engineering/plant-engineering-3d-cad.webp',
      alt: '3D technical process plant assessment and engineering flowsheet review',
      caption:
        'Systematic technical plant assessment evaluating ore throughput, process flowsheets, and mechanical equipment selection.',
      badge: 'Technical Assessment',
    },
    keyMetrics: [
      { label: 'Assessment Stages', value: '10 Data Dimensions', detail: 'From Geology to Power & Utilities' },
      { label: 'Engineering Review', value: 'Within 48 Hours', detail: 'Qualified Engineer Evaluation' },
      { label: 'Output Deliverable', value: 'Scope & Cost Estimate', detail: 'Preliminary Engineering Proposal' },
      { label: 'Follow-Up Route', value: 'Site Visit & RFQ', detail: 'Seamless Digital Workflow' },
    ],
    gallery: [
      {
        src: '/images/engineering/plant-engineering-3d-cad.webp',
        alt: '3D CAD flowsheet assessment of mineral processing equipment',
        title: 'Process Flowsheet Assessment',
        description:
          'Review of crushing stages, grinding power requirements, hydrocyclone classification, and CIL retention times.',
        tag: 'Process Review',
      },
      {
        src: '/images/engineering/plant-optimization-kinetics-lab.webp',
        alt: 'Laboratory assay and ore characterization testing apparatus',
        title: 'Ore Characterization & Assaying',
        description:
          'Assessment of ore hardness (Bond Work Index), mineralogical liberation, and recovery response.',
        tag: 'Ore Analysis',
      },
      {
        src: '/images/projects/bondo-gold-processing-plant.webp',
        alt: 'Operating gold plant assessment at Bondo site',
        title: 'Site Infrastructure & Utilities Review',
        description:
          'Evaluation of raw water supply, power grid connections or diesel generation capacity, and road access.',
        tag: 'Site Utilities',
      },
    ],
    capabilities: [
      'Mining site and concession context (location, topography, and transport access)',
      'Mineral resource and ore deposit characteristics (ore type, grade, hardness, sulfides)',
      'Target production capacity (tpd ore throughput and annual production targets)',
      'Existing plant and process circuit review (crushing, grinding, CIL/CIP, elution)',
      'Equipment condition, mechanical wear status, and operational bottleneck capture',
      'Water supply, reticulation, tailings containment, and power utility constraints',
      'Environmental, safety, and statutory licensing status (NEMA, EPRA, Mining Act)',
      'Controlled file uploads for geological logs, assay certificates, and site photos',
    ],
    deliverableCategories: [
      {
        category: 'Assessment Data Dimensions',
        items: [
          {
            name: 'Site & Concession Profile',
            description: 'Geographical coordinates, concession licensing status, and access road infrastructure.',
          },
          {
            name: 'Ore Metallurgy & Assay History',
            description: 'Head grade (g/t Au), free-gold percentage, sulfide content, and clay/viscosity characteristics.',
          },
          {
            name: 'Process Circuit Requirements',
            description: 'Crushing stage selection, closed-circuit milling, CIL tank sizing, and elution capacity.',
          },
          {
            name: 'Utilities & Power Infrastructure',
            description: 'Power grid availability (kVA), backup generator requirements, and process water supply (m³/hr).',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Stage 01',
        title: 'Digital Intake Submission',
        objective: 'Client completes online technical assessment questionnaire and uploads supporting documentation.',
        deliverables: ['Completed Assessment Record', 'Unique Tracking Reference', 'Uploaded File Archive'],
        milestoneRecord: 'Digital Submission Confirmation',
      },
      {
        phase: 'Stage 02',
        title: 'Engineering Review & Qualification',
        objective: 'Senior metallurgical and mechanical engineers evaluate technical viability and data completeness.',
        deliverables: ['Internal Engineering Review Sheet', 'Data Clarification Requests (if any)'],
        milestoneRecord: 'Technical Qualification Gate',
      },
      {
        phase: 'Stage 03',
        title: 'Preliminary Proposal & Scope of Work',
        objective: 'Develop preliminary plant flowsheet, equipment bill of materials, and budget cost estimates.',
        deliverables: ['Preliminary Scope of Work', 'Equipment Budgetary Estimate', 'Site Visit Protocol'],
        milestoneRecord: 'Engineering Proposal Transmittal',
      },
      {
        phase: 'Stage 04',
        title: 'Site Reconnaissance & Contract Scoping',
        objective: 'Engineers visit the site for topographical inspection, utility confirmation, and contract execution.',
        deliverables: ['Site Inspection Report', 'Final Commercial Proposal', 'EPC Contract Draft'],
        milestoneRecord: 'Project Award Gate',
      },
    ],
    technicalSpecs: [
      { parameter: 'Review Turnaround Time', standardValue: '24 to 48 Hours', engineeringNotes: 'Evaluated by registered engineering staff' },
      { parameter: 'Supported Ore Types', standardValue: 'Free-milling, alluvial, quartz vein, and oxide/sulfide ores', engineeringNotes: 'Gold, silver, and associated mineral deposits' },
      { parameter: 'Geographic Scope', standardValue: 'Kenya, Tanzania, Uganda, Rwanda, Burundi', engineeringNotes: 'East and Central African mining jurisdictions' },
    ],
    lifecycle: [
      'Project & Site Context',
      'Mineral & Ore Intake',
      'Process & Equipment Review',
      'Utilities & Constraints',
      'Engineering Evaluation',
      'Proposal & Scope Issue',
    ],
    note: 'Submitting a technical assessment initiates professional engineering review. It does not constitute certified engineering advice until validated by a formal engagement.',
    faqs: [
      {
        question: 'Is there a fee for submitting a technical plant assessment online?',
        answer:
          'No. The initial digital intake, data evaluation, and preliminary scope review are provided complimentary as part of our client qualification process.',
      },
      {
        question: 'What if we do not have complete metallurgical assay records?',
        answer:
          'You can provide estimated grades and descriptions of the deposit. Our team can arrange independent metallurgical sampling and assay testing to establish certified design parameters.',
      },
      {
        question: 'Is client geological and operational data kept confidential?',
        answer:
          'Absolutely. All assessment submissions, assay data, concession boundaries, and proprietary details are protected under our corporate non-disclosure and security policies.',
      },
    ],
    primaryCta: { label: 'Start Technical Plant Assessment', href: '/technical-assessment' },
    secondaryCta: { label: 'Submit Line-Item RFQ', href: '/request-rfq' },
  },

  equipment: {
    slug: 'equipment',
    eyebrow: 'Plant Machinery Catalogue',
    title: 'Mining Equipment Supply & Sourcing',
    headline: 'Certified mineral processing machinery, heavy grinding mills, crushers, and gravity concentrators',
    description:
      'Heavy-duty gold mining and mineral processing machinery sourced, engineered, and installed across East Africa. From jaw crushers and ball mills to CIL agitators, elution columns, and smelting furnaces.',
    intro:
      'Green Ngoria provides equipment sourcing and turnkey mechanical supply backed by engineering warranty and on-site commissioning. We match equipment duty specifications to the exact abrasive wear characteristics, hardness (Bond Work Index), and throughput targets of your mining deposit.',
    leadParagraphs: [
      'Substandard or under-sized mining equipment leads to catastrophic gear failures, liner burn-out, and continuous operational downtime.',
      'Every item in our catalogue is sourced from ISO-certified heavy machinery manufacturers, equipped with high-efficiency WEG/ABB electric drive motors, SKF/Timken heavy-duty bearings, and manganese/high-chrome wear alloys.',
      'Our mechanical engineers provide complete support: dynamic foundation calculation, civil bolt layouts, on-site crane rigging, laser alignment, lubrication setup, and operator training.',
    ],
    primaryImage: {
      src: '/images/engineering/mining-equipment-machinery-bay.webp',
      alt: 'Heavy mining machinery warehouse with primary jaw crushers, ball mills, and Knelson concentrators',
      caption:
        'Heavy mining equipment staging yard featuring industrial jaw crushers, ball mill grinding units, and centrifugal gravity concentrators.',
      badge: 'Certified Plant Machinery',
    },
    keyMetrics: [
      { label: 'Machinery Categories', value: '6 Core Families', detail: 'Crushing to Doré Bullion Smelting' },
      { label: 'Motors & Drives', value: 'High Efficiency', detail: 'WEG / ABB Premium Motors' },
      { label: 'Bearings & Gearing', value: 'Heavy Duty Spec', detail: 'SKF / Timken & Alloy Girth Gears' },
      { label: 'Warranty & Support', value: '12-Month Guarantee', detail: 'On-Site Commissioning Included' },
    ],
    gallery: [
      {
        src: '/images/engineering/mining-equipment-machinery-bay.webp',
        alt: 'Heavy mining machinery assembly bay showing jaw crushers, ball mill, and Knelson concentrator',
        title: 'Machinery Staging & Assembly Bay',
        description:
          'Staging facility for primary jaw crushers, rotary ball mills, and skid-mounted electrowinning and gravity recovery units.',
        tag: 'Heavy Machinery',
      },
      {
        src: '/images/mining/ball-mill-installation-bondo.webp',
        alt: 'Ball mill installation and mechanical alignment on site at Bondo',
        title: 'Grinding Ball Mill Assembly',
        description:
          'Continuous-duty ball mill featuring high-chromium alloy liner plates, trunnion bearing lubrication, and heavy pinion drive.',
        tag: 'Grinding Equipment',
      },
      {
        src: '/images/mining/centrifugal-concentrators.webp',
        alt: 'Knelson centrifugal concentrator units for free gold recovery',
        title: 'Centrifugal Gravity Concentrators',
        description:
          'High-G centrifugal concentrators engineered for capturing fine free-milling gold particles ahead of cyanidation.',
        tag: 'Gravity Separation',
      },
      {
        src: '/images/electrical/plant-control-panels.webp',
        alt: 'Electrical starter panels and motor control centers for mining equipment',
        title: 'Motor Control Centers (MCC)',
        description:
          'Variable Frequency Drive (VFD) starter cabinets and power management systems for crushing and milling motors.',
        tag: 'Automation & Drives',
      },
    ],
    capabilities: [
      'Primary & secondary jaw crushers, impact crushers, and cone crushers',
      'Rotary ball mills, SAG mills, and rod mills with high-chrome liner assemblies',
      'Vibrating sizing screens (inclined, horizontal, and banana high-capacity decks)',
      'Hydrocyclone classification clusters and polyurethane-lined manifold splitters',
      'Carbon-in-Leach (CIL) and Carbon-in-Pulp (CIP) dual-impeller mechanical agitators',
      'Stainless-steel interstage carbon screens and carbon transfer recessed-impeller pumps',
      'Desorption elution columns, heat exchangers, and electrowinning cells',
      'High-temperature induction gold smelting furnaces and bullion pour tables',
    ],
    deliverableCategories: [
      {
        category: 'Crushing & Sizing Machinery',
        items: [
          {
            name: 'Heavy-Duty Jaw Crushers',
            standard: 'PE / PEX Series',
            description: 'Deep-chamber design with manganese jaw plates for Run-of-Mine ore primary reduction to < 40 mm.',
          },
          {
            name: 'Secondary Cone & Impact Crushers',
            standard: 'Hydraulic / Spring',
            description: 'Precision secondary reduction delivering fine mill-feed (< 12 mm) with maximum cubical shape.',
          },
          {
            name: 'Vibrating Grizzly & Sizing Screens',
            standard: 'Polyurethane / Wire Mesh',
            description: 'Multi-deck classification separating oversize ore for closed-circuit re-crushing.',
          },
        ],
      },
      {
        category: 'Grinding & Classification',
        items: [
          {
            name: 'Continuous Wet Grinding Ball Mills',
            standard: 'Grate / Overflow Discharge',
            description: 'Heavy steel shell with rubber/chrome liners reducing ore to 80% passing 74 µm (200 mesh).',
          },
          {
            name: 'Hydrocyclone Classification Clusters',
            standard: 'Polyurethane Lined',
            description: 'Radial manifold clusters ensuring sharp separation between fine overflow and coarse underflow.',
          },
        ],
      },
      {
        category: 'Extraction, Leaching & Smelting',
        items: [
          {
            name: 'CIL / CIP Agitator Mechanism Units',
            standard: 'Dual Hydrofoil Impellers',
            description: 'High-torque gearboxes maintaining uniform slurry suspension with minimal carbon attrition.',
          },
          {
            name: 'Zadra / Anglo Elution & Electrowinning Packages',
            standard: 'ASME Section VIII',
            description: 'High-pressure, high-temperature desorption units stripping gold from loaded carbon in 8–12 hours.',
          },
          {
            name: 'Electric Induction Gold Smelting Furnaces',
            standard: 'IGBT Inverter Tech',
            description: 'Rapid smelting of gold sludge cathodes into 95%+ pure doré bullion bars at 1,200°C.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Step 01',
        title: 'Duty Requirement & Flowsheet Sizing',
        objective: 'Calculate exact power, throughput, reduction ratio, and slurry residence time required.',
        deliverables: ['Equipment Sizing Worksheet', 'Power Consumption Estimate'],
        milestoneRecord: 'Technical Specification Signoff',
      },
      {
        phase: 'Step 02',
        title: 'Procurement, Sourcing & Factory Inspection',
        objective: 'Manufacture and test equipment under certified ISO quality control with factory witness testing.',
        deliverables: ['Factory Acceptance Test (FAT) Report', 'Material Test Certificates'],
        milestoneRecord: 'Pre-Shipment Inspection Release',
      },
      {
        phase: 'Step 03',
        title: 'Logistics, Port Clearance & Site Delivery',
        objective: 'Coordinate maritime shipping, customs clearance, and heavy overland transport to mine site.',
        deliverables: ['Bill of Lading Archive', 'Site Receipt Inspection Report'],
        milestoneRecord: 'Site Delivery Record',
      },
      {
        phase: 'Step 04',
        title: 'Civil Mounting, Alignment & Cold/Hot Run',
        objective: 'Bolt onto dynamic foundations, perform laser shaft alignment, and conduct 72-hour load testing.',
        deliverables: ['Laser Alignment Log', '72-Hour Load Run Certificate', 'Operator Manuals & Spares List'],
        milestoneRecord: 'Final Equipment Commissioning Certificate',
      },
    ],
    technicalSpecs: [
      { parameter: 'Jaw Crusher Capacity Range', standardValue: '10 – 350 tonnes per hour (tph)', engineeringNotes: 'Feed sizes from 200 mm to 800 mm ROM' },
      { parameter: 'Ball Mill Dimensions & Power', standardValue: 'Ø1.5m x 3.0m up to Ø3.2m x 6.5m (45 kW – 800 kW)', engineeringNotes: 'Girth gear driven with auxiliary inching drive' },
      { parameter: 'Slurry Pump Wetted Parts Alloy', standardValue: 'High-Chrome (27% Cr, 60–65 HRC) or Natural Rubber', engineeringNotes: 'Resists extreme slurry abrasion and chemical corrosion' },
      { parameter: 'Gold Smelting Induction Furnace Power', standardValue: '15 kW – 50 kW (10 kg – 50 kg crucible capacity)', engineeringNotes: 'Smelts cathode sludge to bullion in 20–30 minutes' },
    ],
    lifecycle: [
      'Duty Sizing & Selection',
      'Technical Quotation (RFQ)',
      'Factory Testing (FAT)',
      'Overland Site Logistics',
      'Mechanical Erection & Alignment',
      'Commissioning & Training',
    ],
    note: 'All equipment quotes include technical datasheets, power curves, foundation blueprints, and manufacturer warranty terms.',
    faqs: [
      {
        question: 'Can Green Ngoria supply complete plant packages on structural steel skids?',
        answer:
          'Yes. We build modular, skid-mounted gold processing plants (crushing, milling, and gravity/CIL modules) that allow rapid on-site erection with minimal civil foundation works.',
      },
      {
        question: 'What warranties are provided with heavy mining machinery?',
        answer:
          'All new machinery carries a standard 12-month manufacturer warranty from commissioning date, supported by Green Ngoria spare parts inventory and technical maintenance engineers.',
      },
      {
        question: 'How do I request a formal equipment quotation?',
        answer:
          'Use our digital RFQ builder at /request-rfq, specify your required equipment categories, target daily capacity, and project location, and our engineers will issue a line-item quotation.',
      },
    ],
    primaryCta: { label: 'Request Equipment Quotation (RFQ)', href: '/request-rfq' },
    secondaryCta: { label: 'Browse Spare Parts', href: '/spares' },
  },

  spares: {
    slug: 'spares',
    eyebrow: 'Asset Reliability & Wear Parts',
    title: 'Mining Spare Parts & Wear Consumables',
    headline: 'High-chromium wear parts, manganese liners, slurry pump spares, and certified consumables',
    description:
      'Keep your gold processing plant running at peak availability. We supply genuine, traceable spare parts for crushers, ball mills, slurry pumps, hydrocyclones, and CIL carbon circuits across East Africa.',
    intro:
      'Plant downtime is the single greatest risk to mining profitability. Green Ngoria maintains an active inventory of high-wear consumables and critical mechanical spares matched to equipment operating across Kenyan and East African mine sites.',
    leadParagraphs: [
      'Using low-grade or non-alloyed wear parts results in rapid abrasion, uneven crushing gaps, trunnion bearing vibration, and catastrophic pump casing blowouts.',
      'Our spare parts catalogue features premium wear alloys: 27% high-chromium white irons for extreme abrasive slurry pumping, high-manganese steel (Mn18Cr2 / Mn22Cr2) for impact crushing, and high-purity polyurethane for hydrocyclones.',
      'Every spare part is catalogued against the installed plant asset register (System 9) to ensure 100% mechanical interchangeability and predictable replacement scheduling.',
    ],
    primaryImage: {
      src: '/images/engineering/mining-spares-wear-parts.webp',
      alt: 'Mining plant spare parts warehouse with chrome slurry pump impellers, manganese jaw plates, and grinding balls',
      caption:
        'Warehouse inventory of genuine wear consumables: forged alloy grinding balls, chrome impellers, polyurethane hydrocyclones, and jaw plates.',
      badge: 'Wear Consumables Archive',
    },
    keyMetrics: [
      { label: 'Alloy Hardness Rating', value: 'Up to 65 HRC', detail: 'High-Chromium White Iron' },
      { label: 'Manganese Toughness', value: 'Mn18Cr2 / Mn22Cr2', detail: 'Work-Hardening Crusher Plates' },
      { label: 'Dispatch Lead Time', value: '24 – 48 Hours', detail: 'Ex-Warehouse for In-Stock Spares' },
      { label: 'Asset Traceability', value: 'System 9 Mapped', detail: 'Direct Equipment Linkage' },
    ],
    gallery: [
      {
        src: '/images/engineering/mining-spares-wear-parts.webp',
        alt: 'Shelving display of high-chrome slurry pump impellers, polyurethane hydrocyclones, and grinding balls',
        title: 'Slurry Pump & Crusher Wear Parts',
        description:
          'High-chrome impellers, casing liners, manganese jaw die plates, and forged steel grinding media arranged with technical part tags.',
        tag: 'Wear Parts',
      },
      {
        src: '/images/mining/ball-mill-installation-bondo.webp',
        alt: 'Ball mill trunnion bearing and liner installation on site',
        title: 'Mill Liners & Trunnion Spares',
        description:
          'Segmented rubber and chrome-moly ball mill shell liners, lifter bars, and babbit trunnion bearing inserts.',
        tag: 'Grinding Spares',
      },
      {
        src: '/images/electrical/distribution-board-installation.webp',
        alt: 'Electrical contactors, fuses, and motor starter replacement spares',
        title: 'Electrical & Drive Spares',
        description:
          'Heavy-duty contactors, thermal overload relays, variable speed drive boards, and electric motor bearings.',
        tag: 'Electrical Spares',
      },
    ],
    capabilities: [
      'Manganese jaw crusher fixed and movable die plates, cheek plates, and toggle seats',
      'Cone crusher mantle and concave bowl liners in Mn18Cr2 and Mn22Cr2 alloys',
      'Ball mill and SAG mill chrome-molybdenum and rubber shell liners, lifters, and grates',
      'Forged alloy steel grinding balls (Ø30mm to Ø100mm, 60–65 HRC hardness)',
      'Centrifugal slurry pump impellers, throatbushes, volute liners, and shaft sleeves',
      'Polyurethane hydrocyclone apexes (spigots), vortex finders, and feed chambers',
      'Stainless-steel 304/316 wedge-wire interstage carbon screens (0.6mm – 0.8mm slot)',
      'High-activity coconut shell granular activated carbon (6x12 mesh, CTC 55–60%)',
    ],
    deliverableCategories: [
      {
        category: 'Crusher & Mill Wear Spares',
        items: [
          {
            name: 'Manganese Crusher Liners',
            standard: 'Mn18Cr2 / Mn22Cr2 (ASTM A128)',
            description: 'Work-hardening steel alloy delivering up to 40% longer wear life on hard quartz gold ore.',
          },
          {
            name: 'Forged Alloy Steel Grinding Media',
            standard: '60–65 HRC (ASTM A681)',
            description: 'High-impact, low-breakage forged steel balls engineered for uniform grind and low consumption (g/t).',
          },
          {
            name: 'Composite & Rubber Mill Liners',
            standard: 'Natural Rubber / Alloy Insert',
            description: 'Lighter weight liners that protect the mill shell while cutting replacement downtime by half.',
          },
        ],
      },
      {
        category: 'Slurry & Circuit Consumables',
        items: [
          {
            name: 'High-Chrome Slurry Pump Wet Ends',
            standard: 'A05 High-Chrome (27% Cr)',
            description: 'Extreme abrasion-resistant impellers and casings compatible with Warman-style slurry pumps.',
          },
          {
            name: 'Polyurethane Hydrocyclone Spares',
            standard: 'Shore 85A Polyurethane',
            description: 'Wear-resistant vortex finders and spigots maintaining sharp classification cut points.',
          },
          {
            name: 'Coconut Shell Activated Carbon',
            standard: '6x12 Mesh / CTC 60',
            description: 'Premium gold-adsorbing activated carbon with high hardness and low attrition resistance.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Step 01',
        title: 'Part Identification & Asset Match',
        objective: 'Identify exact manufacturer model, part reference number, and equipment duty conditions.',
        deliverables: ['Spare Part Compatibility Sheet', 'Technical Drawing Reference'],
        milestoneRecord: 'Part Specification Match',
      },
      {
        phase: 'Step 02',
        title: 'Availability & Quotation',
        objective: 'Confirm inventory stock availability or production lead time and issue priced quotation.',
        deliverables: ['Formal Spares Quotation', 'Lead Time Schedule'],
        milestoneRecord: 'Purchase Order Issuance',
      },
      {
        phase: 'Step 03',
        title: 'Quality Verification & Dispatch',
        objective: 'Perform dimensional checks, hardness testing, and package for heavy overland transport.',
        deliverables: ['Inspection & Hardness Cert', 'Waybill & Delivery Note'],
        milestoneRecord: 'Dispatch Confirmation',
      },
      {
        phase: 'Step 04',
        title: 'On-Site Installation & Asset Log Update',
        objective: 'Assist site maintenance team with installation and record wear part serial into System 9 asset register.',
        deliverables: ['Maintenance Installation Record', 'Next Scheduled Changeout Date'],
        milestoneRecord: 'Asset Service Record Update',
      },
    ],
    technicalSpecs: [
      { parameter: 'Grinding Ball Consumption Rate', standardValue: '0.4 – 0.9 kg/tonne of ore processed', engineeringNotes: 'Dependent on ore Bond Work Index and mill speed' },
      { parameter: 'High-Chrome Impeller Lifespan', standardValue: '1,200 – 2,500 continuous operating hours', engineeringNotes: 'Varies with slurry solid percentage and particle size' },
      { parameter: 'Activated Carbon Attrition Loss', standardValue: '< 1.0% per elution stripping cycle', engineeringNotes: 'High-hardness coconut shell formulation' },
      { parameter: 'Wedge-Wire Carbon Screen Slot', standardValue: '0.65 mm / 0.80 mm precision aperture', engineeringNotes: 'Stainless steel 316L prevents carbon loss into tails' },
    ],
    lifecycle: [
      'Asset Identification',
      'Part Verification',
      'Priced Quotation (RFQ)',
      'Quality & Hardness Inspection',
      'Site Delivery & Fitting',
      'Asset History Logging',
    ],
    note: 'All spare parts undergo dimensional check and hardness testing prior to delivery. Critical spares can be held on consignment for contract operations.',
    faqs: [
      {
        question: 'Are Green Ngoria spare parts compatible with major international equipment brands?',
        answer:
          'Yes. We supply direct-fit, precision-manufactured wear parts for Warman, Metso, Sandvik, FLSmidth, and Chinese-manufactured mining equipment.',
      },
      {
        question: 'Do you offer emergency spare parts delivery for plant breakdowns?',
        answer:
          'Yes. For critical in-stock spares (impellers, pump seals, contactors, carbon screens), we arrange direct hot-shot road delivery across Kenya within 24 hours.',
      },
      {
        question: 'Can you supply custom-cast crusher plates for obsolete or custom machinery?',
        answer:
          'Yes. Our engineering department can take 3D laser scans or physical patterns of your existing worn liners and manufacture custom manganese or alloy castings.',
      },
    ],
    primaryCta: { label: 'Request Spare Parts Quote', href: '/request-rfq' },
    secondaryCta: { label: 'Explore Equipment Catalogue', href: '/equipment' },
  },

  mining: {
    slug: 'mining',
    eyebrow: 'Mining Operations & Resources',
    title: 'Active Gold & Gemstone Mining Concessions',
    headline: 'Producing mining assets connected to turnkey engineering and processing plant delivery',
    description:
      'Gold and gemstone mining operations across Kenya (Bondo, Oyugis, Lolgorian, Taita Taveta) and Tanzania, supported by dedicated in-house civil, mechanical, electrical, and mineral processing divisions.',
    intro:
      'Green Ngoria was formed around active mining operations: mining gold in Bondo (Siaya County), Oyugis (Homa Bay County), Lolgorian (Narok County), and Taita Taveta, alongside established concessions in Tanzania where the company began. Our engineering, construction, and supply divisions grew directly out of the practical requirements of running producing mine sites.',
    leadParagraphs: [
      'Our mining operations combine experienced local miners, qualified mining engineers, and responsible community stewardship. We focus on high-grade gold vein extraction, underground reef shafts, alluvial processing, and mineral property development.',
      'A NEMA-approved small-scale gold processing plant (NEMA/PR/SYA/002) at Nyangoma, Bondo Sub-County, serves as a central regional processing hub alongside extraction sites at Oyugis and Lolgorian.',
      'We practice responsible mining that strictly safeguards water tables, manages tailings with zero hazardous discharge, and contributes directly to local employment and infrastructure.',
    ],
    primaryImage: {
      src: '/images/mining/poured-dore-bar-bondo.webp',
      alt: 'Poured gold doré bullion bar from Green Ngoria Bondo gold mine',
      caption:
        'Poured gold doré bar produced on site at Green Ngoria’s Bondo gold mining and processing concession.',
      badge: 'Active Gold Production',
    },
    keyMetrics: [
      { label: 'Mining Sites', value: '5 Operating Areas', detail: 'Bondo, Oyugis, Lolgorian, Taita & Tanzania' },
      { label: 'Processing Plant', value: 'NEMA Approved', detail: 'Permit Ref: NEMA/PR/SYA/002' },
      { label: 'Commodities', value: 'Gold & Gemstones', detail: 'Doré Bullion, Tanzanite, Tsavorite & Ruby' },
      { label: 'Licensing Status', value: 'Stamp Duty Paid', detail: 'Full Statutory Compliance' },
    ],
    gallery: [
      {
        src: '/images/mining/oyugis-gold-mining-site.webp',
        alt: 'Active gold vein mining site with engineers and crushing hopper in Oyugis, Homa Bay',
        title: 'Oyugis Gold Mining Site',
        description:
          'Active gold quartz vein mining, excavator feeding, and gravity concentration sluicing in Oyugis, Homa Bay County.',
        tag: 'Oyugis Gold Site',
      },
      {
        src: '/images/mining/lolgorian-gold-mine-shaft.webp',
        alt: 'Underground quartz reef shaft headframe and ore carts at Lolgorian mine',
        title: 'Lolgorian Shaft Headframe',
        description:
          'Underground quartz reef shaft extraction, steel hoisting tower, and ore haulage in the historic Lolgorian gold belt (Trans-Mara).',
        tag: 'Lolgorian Gold Site',
      },
      {
        src: '/images/projects/bondo-gold-processing-plant.webp',
        alt: 'NEMA-approved gold processing plant at Bondo site',
        title: 'Bondo Processing Plant',
        description:
          'NEMA-approved small-scale gold processing plant (NEMA/PR/SYA/002) at Nyangoma, Bondo featuring ball mills and CIL tanks.',
        tag: 'Bondo Plant Hub',
      },
      {
        src: '/images/mining/poured-dore-bar-bondo.webp',
        alt: 'Refined poured gold doré bar with stamped identification at Bondo site',
        title: 'Poured Gold Doré Bullion',
        description:
          'Refined gold doré bullion bar produced through crushing, milling, gravity separation, and electrowinning at the Bondo site.',
        tag: 'Gold Production',
      },
      {
        src: '/images/gemstones/cut-tanzanite-parcel.webp',
        alt: 'Graded faceted Tanzanite gemstones from company-owned mine',
        title: 'Faceted Tanzanite Parcel',
        description:
          'Cut and polished international-grade Tanzanite gemstones produced from our gemstone concession in Tanzania.',
        tag: 'Gemstone Mining',
      },
      {
        src: '/images/mining/gold-nuggets-raw.webp',
        alt: 'Raw natural gold nuggets extracted from vein mining operations',
        title: 'High-Grade Gold Nuggets',
        description:
          'Natural coarse gold nuggets recovered through gravity sluicing and optical sorting from quartz vein deposits.',
        tag: 'Gold Extraction',
      },
    ],
    capabilities: [
      'Active gold vein extraction and shaft sinking in Bondo, Siaya County',
      'Gold quartz vein extraction and gravity recovery in Oyugis, Homa Bay County',
      'Underground quartz reef shaft extraction in Lolgorian, Narok County (Trans-Mara)',
      'Gold and gemstone mining operations in Taita Taveta, Kenya',
      'Established mining concessions in Tanzania (gold and gemstone assets)',
      'NEMA-approved small-scale gold processing plant (NEMA/PR/SYA/002)',
      'Comprehensive gravity concentration, shaking tables, and CIL leaching circuits',
      'Geological sampling, core drilling supervision, and pit planning',
    ],
    deliverableCategories: [
      {
        category: 'Operating Mining Sites',
        items: [
          {
            name: 'Bondo Processing Plant & Mine (Siaya County)',
            description: 'Central NEMA-approved small-scale CIP/CIL processing facility and vein mining at Nyangoma.',
          },
          {
            name: 'Oyugis Gold Concession (Homa Bay County)',
            description: 'High-grade quartz vein extraction, primary crushing, and gravity concentration sluices.',
          },
          {
            name: 'Lolgorian Mine Site (Narok County)',
            description: 'Underground shaft headframe and ore cart haulage in the high-grade Trans-Mara gold corridor.',
          },
          {
            name: 'Taita Taveta Mineral Concession',
            description: 'Mozambique belt precious gemstone and gold extraction producing rough specimens and doré.',
          },
          {
            name: 'Tanzanian Mineral Assets',
            description: 'Original foundation mining site and company-owned gemstone mine producing Tanzanite and colored stones.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Stage 01',
        title: 'Prospecting & Geological Mapping',
        objective: 'Conduct trenching, geological mapping, and geochemical sampling across concession area.',
        deliverables: ['Geological Map', 'Surface Assay Log'],
        milestoneRecord: 'Target Identification',
      },
      {
        phase: 'Stage 02',
        title: 'Mine Development & Shaft Sinking',
        objective: 'Excavate access declines, sink shafts, and establish timbering shoring and ventilation.',
        deliverables: ['Mine Plan Blueprint', 'Shaft Structural Signoff'],
        milestoneRecord: 'Ore Body Intersect',
      },
      {
        phase: 'Stage 03',
        title: 'Ore Extraction & Processing',
        objective: 'Extract gold ore, transport to processing plant, crush, mill, and recover doré bullion.',
        deliverables: ['Daily Production Log', 'Mill Feed Assay', 'Smelt Bullion Record'],
        milestoneRecord: 'Commercial Production',
      },
    ],
    technicalSpecs: [
      { parameter: 'Target Ore Commodities', standardValue: 'Gold (Au), Tanzanite, Tsavorite, Blue Sapphire, Ruby', engineeringNotes: 'Precious metals and high-value colored gemstones' },
      { parameter: 'Processing Plant Permit', standardValue: 'NEMA/PR/SYA/002 (County Director of Environment, Siaya)', engineeringNotes: 'Full EIA environmental audit approval' },
      { parameter: 'Environmental Policy', standardValue: 'Zero untreated chemical discharge', engineeringNotes: 'Lined tailings storage and cyanide detoxification' },
    ],
    lifecycle: [
      'Opportunity Identification',
      'Licensing & Permitting',
      'Geological Development',
      'Plant Erection',
      'Ore Processing',
      'Community Stewardship',
    ],
    note: 'Geological resources and production metrics are verified through certified laboratory assays. Green Ngoria operates strictly within statutory mining licences.',
    faqs: [
      {
        question: 'Does Green Ngoria partner with international mining investors?',
        answer:
          'Yes. We engage with qualified mining investors and joint-venture partners on concession development, plant expansion, and regional mineral exploration.',
      },
      {
        question: 'Where can buyers verify Green Ngoria’s gemstone and gold provenance?',
        answer:
          'All mineral output is documented with statutory royalties, mining licences, and official assay documentation through the Ministry of Mining.',
      },
    ],
    primaryCta: { label: 'Explore Gold Processing Plant', href: '/gold-processing' },
    secondaryCta: { label: 'Discuss Mining Partnership', href: '/contact' },
  },

  insights: {
    slug: 'insights',
    eyebrow: 'Technical Knowledge Base',
    title: 'Mining Plant Engineering & Metallurgical Insights',
    headline: 'Engineering articles, flowsheet explainers, and operational best practices',
    description:
      'Authoritative technical publications covering gold processing plant design, CIP/CIL systems, equipment selection, EHS management, and plant optimization in East Africa.',
    intro:
      'The Green Ngoria technical insights library publishes peer-reviewed practical knowledge for mine managers, metallurgical engineers, and project developers across the mining sector.',
    leadParagraphs: [
      'From demystifying cyanide leaching kinetics to avoiding slurry pump cavitation, our articles provide practical, field-tested engineering solutions.',
      'Authored by our in-house engineering team and qualified metallurgists with decades of combined experience across East and Central Africa.',
    ],
    primaryImage: {
      src: '/images/engineering/plant-engineering-3d-cad.webp',
      alt: 'Technical engineering publications and process flowsheet diagrams',
      caption:
        'Technical knowledge base covering mineral processing, CIP/CIL systems, and plant maintenance.',
      badge: 'Technical Archive',
    },
    keyMetrics: [
      { label: 'Publication Focus', value: 'Mineral Processing', detail: 'Gold Metallurgy & Plant EPC' },
      { label: 'Review Standard', value: 'Peer-Reviewed', detail: 'Qualified Engineer Authored' },
      { label: 'Coverage', value: 'East Africa', detail: 'Kenya, Tanzania & Regional Mines' },
      { label: 'Access', value: 'Open Engineering Resource', detail: 'Free Technical Library' },
    ],
    gallery: [
      {
        src: '/images/engineering/plant-engineering-3d-cad.webp',
        alt: '3D CAD process flow schematic explainer',
        title: 'CIP vs CIL Circuit Selection',
        description: 'Comparative technical guide on when to select Carbon-in-Pulp vs Carbon-in-Leach for gold recovery.',
        tag: 'Process Flow',
      },
      {
        src: '/images/engineering/plant-optimization-kinetics-lab.webp',
        alt: 'Metallurgical laboratory testing and titration article',
        title: 'Cyanide Leaching Kinetics Guide',
        description: 'Optimizing dissolved oxygen, pH buffer, and residence times to maximize gold dissolution.',
        tag: 'Metallurgy',
      },
    ],
    capabilities: [
      'Comparative guides: Carbon-in-Pulp (CIP) vs Carbon-in-Leach (CIL) vs Flotation',
      'Crushing and grinding circuit optimization (Bond Work Index calculations)',
      'Tailings storage facility (TSF) engineering and environmental containment',
      'Safety and cyanide management under the International Cyanide Management Code',
      'Equipment preventive maintenance schedules and wear-liner replacement audits',
      'Statutory mining licensing, NEMA approvals, and compliance in Kenya & Tanzania',
    ],
    deliverableCategories: [
      {
        category: 'Publication Topics',
        items: [
          {
            name: 'Metallurgical Process Design',
            description: 'Detailed analysis of gold extraction, flotation, and gravity separation.',
          },
          {
            name: 'Equipment Maintenance & Asset Care',
            description: 'Best practices for extending slurry pump, crusher, and mill life.',
          },
          {
            name: 'Environmental, Health & Safety (EHS)',
            description: 'Tailings management, cyanide neutralization, and safety leadership on mine sites.',
          },
        ],
      },
    ],
    lifecyclePhases: [
      {
        phase: 'Step 01',
        title: 'Topic Scoping & Field Data Collection',
        objective: 'Identify critical operational challenges from real plant telemetry and field experience.',
        deliverables: ['Draft Outline', 'Empirical Data Sets'],
        milestoneRecord: 'Editorial Approval',
      },
      {
        phase: 'Step 02',
        title: 'Technical Review & Verification',
        objective: 'Review calculations, flowsheets, and safety guidelines with qualified engineering leads.',
        deliverables: ['Peer-Reviewed Draft', 'Compliance Verification'],
        milestoneRecord: 'Engineering Signoff',
      },
      {
        phase: 'Step 03',
        title: 'Digital Publication & Distribution',
        objective: 'Publish open-access technical paper for industry operators and clients.',
        deliverables: ['Published Article', 'Downloadable Technical Sheet'],
        milestoneRecord: 'Publication Issue',
      },
    ],
    technicalSpecs: [
      { parameter: 'Editorial Standards', standardValue: 'Authored by qualified engineers', engineeringNotes: 'Based on actual operating plant records' },
      { parameter: 'Citation Policy', standardValue: 'Referenced from ISO, ASTM, and ASME engineering codes', engineeringNotes: 'Peer-reviewed technical content' },
    ],
    lifecycle: [
      'Topic Scoping',
      'Field Data Collection',
      'Engineering Review',
      'Compliance Verification',
      'Publication',
      'Revision & Updates',
    ],
    note: 'Technical articles provide general engineering information and do not replace project-specific professional engineering design.',
    faqs: [
      {
        question: 'Can I request a technical consultation on an article topic?',
        answer:
          'Yes. You can contact our engineering department to discuss specific metallurgical and equipment challenges discussed in our insights library.',
      },
    ],
    primaryCta: { label: 'Request Technical Discussion', href: '/contact' },
    secondaryCta: { label: 'Explore Gold Processing Plant', href: '/gold-processing' },
  },
};
