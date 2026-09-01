import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
  Award,
  PhoneCall,
} from 'lucide-react';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { InteractiveEngineeringGallery } from '@/components/marketing/interactive-engineering-gallery';
import { PlantAssessmentForm } from '@/features/public/plant-assessment-form';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';

const title = 'Request Technical Plant Assessment & Feasibility Intake';
const description =
  'Initiate a structured engineering assessment for gold processing plants, CIP/CIL systems, equipment sizing, and metallurgical recovery optimization across East Africa.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/technical-assessment',
  },
};

const assessmentGallery = [
  {
    src: '/images/engineering/plant-engineering-3d-cad.webp',
    title: '3D Process Plant Flowsheet Review',
    description:
      'Digital CAD flowsheet analysis evaluating crushing stages, ball mill power sizing, hydrocyclone classification, and CIL retention times.',
    tag: 'Flowsheet Audit',
    alt: '3D CAD process plant layout and mechanical flow sheet evaluation',
  },
  {
    src: '/images/engineering/plant-optimization-kinetics-lab.webp',
    title: 'Ore Assaying & Leaching Kinetics Lab',
    description:
      'Metallurgical laboratory testwork measuring Bond Work Index, cyanide leach dissolution curves, and carbon loading efficiency.',
    tag: 'Ore Analysis',
    alt: 'Laboratory assaying and gold leaching kinetics testing apparatus',
  },
  {
    src: '/images/projects/bondo-gold-processing-plant.webp',
    title: 'Operating Site Infrastructure & Utilities',
    description:
      'Field assessment of power grid connectivity, backup generation, process water supply, and tailings containment.',
    tag: 'Site Utilities',
    alt: 'Bondo gold processing plant operating site overview',
  },
  {
    src: '/images/mining/production-weighed-digital-scale.webp',
    title: 'Yield Verification & Bullion Assays',
    description:
      'High-precision weighing and atomic absorption assaying to verify recovery gains and mass balance calculations.',
    tag: 'Assay Verification',
    alt: 'Refined gold bullion bars weighed on certified scale',
  },
];

export default function TechnicalAssessmentPage() {
  return (
    <>
      {/* 1 — Page Hero */}
      <PageHero
        title="Request Technical Plant Assessment &amp; Feasibility"
        lead={[
          'Green Ngoria’s Technical Plant Assessment (System 4) is our structured engineering intake mechanism for mining operators, concessions, and investors across East Africa.',
          'Submit your deposit characteristics, target throughput, and existing equipment bottlenecks to receive an empirical flowsheet review, equipment sizing bill, and budgetary proposal.',
        ]}
        primaryAction={{ label: 'Begin digital intake', href: '#assessment-form' }}
        secondaryAction={{
          label: 'Explore gold plant circuit',
          href: '/gold-processing',
        }}
        facts={[
          { term: 'Intake Framework', value: 'System 4 Digital Assessment' },
          { term: 'Engineering Review', value: 'Within 24 – 48 Hours' },
          { term: 'Output Deliverables', value: 'Flowsheet & Capex Estimate' },
          { term: 'Applicable Standards', value: 'ASME · ASTM · ISO 9001/14001' },
        ]}
      />

      {/* 2 — Primary Hero Visual */}
      <section className="relative -mt-10 border-b border-hairline bg-surface-sunken pb-12 pt-0 sm:-mt-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-panel">
            <div className="relative aspect-[21/9] w-full min-h-[300px] bg-muted sm:min-h-[400px]">
              <Image
                src="/images/engineering/plant-engineering-3d-cad.webp"
                alt="3D CAD engineering model for gold mineral processing plant"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 sm:bottom-6 sm:left-8 sm:right-8">
                <div className="max-w-2xl">
                  <span className="rounded-md bg-brand-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-md">
                    System 4 Engineering Intake
                  </span>
                  <h2 className="mt-2 font-display text-lg font-bold text-white sm:text-2xl">
                    Empirical Flowsheet Design &amp; Plant Optimization
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80 sm:text-sm">
                    Evaluates ore throughput, grinding power requirements, hydrocyclone classification, and CIL retention times.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href="#assessment-form" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-brand-400">
                    Fill Assessment Form
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — The Assessment Intake Form */}
      <Section id="assessment-form" labelledBy="intake-form-heading">
        <SectionIntro
          id="intake-form-heading"
          title="Digital Plant Assessment &amp; Feasibility Form"
          lead="Complete the multi-step intake below. Your data is analyzed by qualified metallurgical and mechanical engineers to develop an actionable engineering proposal."
          align="stack"
        />

        <div className="mt-10">
          <PlantAssessmentForm />
        </div>
      </Section>

      {/* 4 — The 4 Assessment Data Dimensions */}
      <Section tone="sunken" rule labelledBy="dimensions-heading">
        <SectionIntro
          id="dimensions-heading"
          title="Four Core Assessment Dimensions"
          lead="Every plant assessment systematically evaluates the complete operational chain."
          align="stack"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: '1. Geology & Ore Matrix',
              desc: 'Head grade (g/t Au), mineralogical associations, host rock hardness (Bond Work Index), and clay viscosity profile.',
              icon: Layers,
            },
            {
              title: '2. Milling & Classification',
              desc: 'Crushing stage reduction ratios, closed-circuit ball mill power (kW), and hydrocyclone P80 grind distribution.',
              icon: Cpu,
            },
            {
              title: '3. Leaching & Recovery',
              desc: 'Cyanide dissolution kinetics, dissolved oxygen levels, carbon adsorption loading (g/t), and electrowinning efficiency.',
              icon: Sparkles,
            },
            {
              title: '4. Utilities & Containment',
              desc: 'Process water reticulation (m³/hr), power grid / generator capacity (kVA), and HDPE-lined tailings containment.',
              icon: ShieldCheck,
            },
          ].map((dim) => {
            const Icon = dim.icon;
            return (
              <div
                key={dim.title}
                className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-foreground">
                  {dim.title}
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {dim.desc}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 5 — Interactive Field Assessment Gallery */}
      <Section rule labelledBy="gallery-heading">
        <InteractiveEngineeringGallery
          items={assessmentGallery}
          headline="Plant Assessment &amp; Metallurgical Audit Records"
          subhead="High-resolution records of engineering CAD simulations, kinetic lab testwork, and operational site audits. Click any image to zoom up to 2.5x with full pixel clarity."
        />
      </Section>

      {/* 6 — Assessment FAQs */}
      <Section tone="sunken" rule labelledBy="faqs-heading">
        <SectionIntro
          id="faqs-heading"
          title="Technical Assessment FAQs"
          lead="Common questions regarding our engineering evaluation process and deliverables."
          align="stack"
        />

        <div className="mx-auto mt-10 max-w-4xl space-y-4">
          {[
            {
              question: 'How quickly will I receive a response after submitting the assessment?',
              answer:
                'Our engineering department completes an initial desk metallurgical evaluation and contacts you within 24 to 48 business hours with preliminary findings and scope clarification.',
            },
            {
              question: 'Does the assessment cover both new greenfield plants and existing plant optimization?',
              answer:
                'Yes. We assess both brand-new processing plants (from mine design to turnkey commissioning) and existing facilities suffering from low recovery rates, high wear, or bottlenecks.',
            },
            {
              question: 'Is the initial digital assessment free of charge?',
              answer:
                'Yes. The initial digital desk review and budgetary engineering scope are provided without charge. If physical ore sampling, core drilling assays, or comprehensive on-site audits are required, a transparent proposal will be issued.',
            },
            {
              question: 'Are recommendations certified engineering advice?',
              answer:
                'All technical recommendations and calculations undergo rigorous internal review by registered professional engineers before being formally transmitted to clients.',
            },
          ].map((faq) => (
            <div
              key={faq.question}
              className="rounded-xl border border-hairline bg-card p-6 shadow-sm"
            >
              <h3 className="flex items-start gap-3 font-display text-base font-bold text-foreground">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                <span>{faq.question}</span>
              </h3>
              <p className="mt-3 pl-8 text-sm leading-7 text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 7 — Action Banner */}
      <CtaBanner
        title="Ready to optimize your gold recovery or build a new plant?"
        body="Submit your technical plant assessment today or contact our managing director's office directly in Nairobi for confidential project discussions."
        primary={{ label: 'Begin Intake Form', href: '#assessment-form' }}
        secondary={{
          label: 'Contact Managing Director',
          href: '/contact',
        }}
      />
    </>
  );
}
