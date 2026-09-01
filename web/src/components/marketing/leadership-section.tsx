'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Building2,
  Cpu,
  Hammer,
  Award,
  Sparkles,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Compass,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { company } from '@/config/company';
import { cn } from '@/lib/utils';

export interface LeaderProfile {
  name: string;
  role: string;
  category: 'executive' | 'governance' | 'operations' | 'technical';
  image?: string;
  email?: string;
  phone?: string;
  shares?: string;
  location?: string;
  responsibilities: string;
  dossier: {
    mandate: string;
    biography: string;
    focusAreas: string[];
    governanceRoles: string[];
    activeProjects: string[];
  };
}

export const EXTENDED_LEADERSHIP: LeaderProfile[] = [
  {
    name: 'Kenneth Madete Namboga',
    role: 'Chairperson · Director',
    category: 'governance',
    image: '/images/leadership/kenneth-madete-namboga.webp',
    email: 'kenmadete@gmail.com',
    phone: '+256 772 419 871',
    shares: '250 ordinary shares (25%)',
    location: 'East Africa / Uganda & Kenya',
    responsibilities:
      'Responsible for strategy and for overseeing the group\'s business, setting governance standards and fostering the effectiveness of the board and of individual directors. His message to clients — "Making your vision become a reality" — frames how Green Ngoria approaches every engagement.',
    dossier: {
      mandate:
        'Board Leadership, Regional Strategic Growth, Investor Partnerships & Corporate Governance Standards.',
      biography:
        'Kenneth Madete Namboga has steered Green Ngoria Supplies Limited as Chairperson since its foundational growth across Kenya and Uganda. He brings decades of executive leadership in resource allocation, international joint ventures, and strategic corporate governance across East and Central Africa.',
      focusAreas: [
        'Corporate Governance & Board Integrity',
        'Cross-Border Strategic Expansion (Kenya, Uganda, Tanzania)',
        'Investor Relations & Major Plant Financing',
        'ESG Compliance & Sustainable Mining Frameworks',
      ],
      governanceRoles: [
        'Chairman of the Board of Directors',
        'Strategic Investment Committee Lead',
        'Senior Delegate for East African Mineral Partnerships',
      ],
      activeProjects: [
        'Regional Mining Concession Expansions',
        'Institutional EPC Joint Ventures',
        'Cross-Border Mining Supply Chain Harmonisation',
      ],
    },
  },
  {
    name: 'Davis Mragha Ngoo',
    role: 'Managing Director',
    category: 'executive',
    image: '/images/leadership/davis-mragha-ngoo.webp',
    email: 'davingoo83@gmail.com',
    phone: '+254 722 115 133',
    shares: '500 ordinary shares (50%)',
    location: 'Head Office, Nairobi, Kenya',
    responsibilities:
      'Accountable for company operations and for giving strategic guidance and direction to the board, ensuring the company achieves its mission and objectives across mining, construction and supplies.',
    dossier: {
      mandate:
        'Operational Leadership, Plant EPC Execution, Commercial Operations & Enterprise Project Delivery.',
      biography:
        'Davis Mragha Ngoo is the Managing Director and majority principal of Green Ngoria Supplies Limited. With deep hands-on expertise in mining plant engineering, earthworks, and specialized civil construction, he directs daily operations, procurement networks, and plant commissioning throughout the region.',
      focusAreas: [
        'Gold CIP/CIL Processing Plant Delivery',
        'Heavy Civil, Structural & Mechanical Plant Erection',
        'Commercial Strategy, RFQ Pricing & Contract Awards',
        'Operational Continuity & Technical Workforce Leadership',
      ],
      governanceRoles: [
        'Managing Director & Executive Board Member',
        'Chairperson of the Technical Operations Executive Committee',
        'Chief Procurement & Commercial Sign-off Authority',
      ],
      activeProjects: [
        'Bondo Concession 30–45 TPH CIP Gold Plant',
        'Siaya Mineral Processing Facility Delivery',
        'Taita Taveta Mining Concession Infrastructure',
      ],
    },
  },
  {
    name: 'Raymond Nyange Ngoo',
    role: 'Legal Officer · Director',
    category: 'governance',
    image: '/images/leadership/raymond-nyange-ngoo.webp',
    email: 'lawyerrayngoo11@gmail.com',
    phone: '+254 710 401 406',
    shares: '250 ordinary shares (25%)',
    location: 'Nairobi, Kenya',
    responsibilities:
      "Provides legal expertise across the organisation's structures and activities, advising management on the legal and regulatory framework and monitoring corporate governance compliance.",
    dossier: {
      mandate:
        'Legal Counsel, Mining Regulatory Compliance, Contractual Structuring & Corporate Governance.',
      biography:
        'Raymond Nyange Ngoo serves as Legal Officer and Director, overseeing corporate jurisprudence, mining licenses, land easements, statutory filings, and compliance with Kenyan and regional mining frameworks, NEMA environmental standards, and commercial contractual agreements.',
      focusAreas: [
        'Mining Act Compliance & Statutory Licensing',
        'FIDIC & Bespoke Construction Contract Drafting',
        'NEMA Environmental Authorisations & Community Accords',
        'Corporate Risk Mitigation & Intellectual Property Control',
      ],
      governanceRoles: [
        'General Legal Counsel & Corporate Secretary',
        'Ethics, Anti-Corruption & Compliance Committee Lead',
        'Board Director (25% Equity Principal)',
      ],
      activeProjects: [
        'Mining License Formalisations & Concession Prequalifications',
        'EPC Commercial Framework Agreements',
        'Community Social Responsibility & Land Agreement Frameworks',
      ],
    },
  },
  {
    name: 'Chrispine Ryan Ngoo',
    role: 'Production Manager',
    category: 'operations',
    image: '/images/leadership/chrispine-ryan-ngoo.webp',
    email: 'info@greenngoriasupplies.com',
    phone: '+254 794 065 144',
    shares: 'Executive Management',
    location: 'Field Operations & Mining Sites',
    responsibilities:
      'Oversees the production and processing operation, including plant throughput, recovery performance, site scheduling and adherence to operating and safety procedures.',
    dossier: {
      mandate:
        'Plant Metallurgy Throughput, Recovery Kinetics, Site Shift Management & Process Optimisation.',
      biography:
        'Chrispine Ryan Ngoo leads field production and metallurgical plant operations for Green Ngoria. Specialised in CIP/CIL leaching kinetics, carbon regeneration, vat leach dosing, and plant crushing circuits, he ensures daily target tonnage, high gold recovery rates, and zero-incident workplace safety.',
      focusAreas: [
        'CIP/CIL Leaching & Elution Recovery Optimisation',
        'Crushing, Milling & Classification Circuit Balancing',
        'Shift Production Scheduling & Workforce Deployment',
        'Continuous Tailings Management & Reagent Handling',
      ],
      governanceRoles: [
        'Head of Site Production & Processing Operations',
        'Operational Safety & Incident Prevention Lead',
        'Field Commissioning Sign-off Manager',
      ],
      activeProjects: [
        '24-Hour Continuous Plant Leaching Operations',
        'Gold Elution & Electrowinning Cell Commissioning',
        'Carbon Adsorption Kinetics Optimisation',
      ],
    },
  },
];

export const TECHNICAL_CADRE = [
  {
    role: 'Head of Process Metallurgy & Plant Design',
    focus: 'Crushing circuits, ball mills, agitation leaching, elution and carbon regeneration.',
    credential: 'Registered Professional Metallurgical Engineer (BSc. / MSc.)',
    icon: FlaskConical,
  },
  {
    role: 'Lead Civil & Structural Project Engineer',
    focus: 'Reinforced concrete plant foundations, structural steelwork, road access and stormwater control.',
    credential: 'Registered Civil/Structural Engineer (EBK / IEK Accredited)',
    icon: Building2,
  },
  {
    role: 'Senior Mechanical & Erection Engineer',
    focus: 'Plant machinery alignment, slurry pump pipework, cyclones, conveyor networks and hydro-testing.',
    credential: 'Certified Mechanical Engineer (Heavy Plant & Mining Systems)',
    icon: Hammer,
  },
  {
    role: 'Electrical, Automation & Instrumentation Lead',
    focus: 'Substations, motor control centers (MCC), SCADA automation, PLC instrumentation and backup power.',
    credential: 'Class A Electrical Engineering Lead (Energy & Automation)',
    icon: Cpu,
  },
  {
    role: 'HSE & Environmental Compliance Officer',
    focus: 'ISO 14001, OHSAS 18001, NEMA EIA audits, cyanide management code and zero-harm culture.',
    credential: 'Certified Lead Environmental & Occupational Safety Auditor',
    icon: ShieldCheck,
  },
];

import { FlaskConical } from 'lucide-react';

function monogram(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

export function LeadershipSection() {
  const [selectedLeader, setSelectedLeader] = useState<LeaderProfile | null>(null);

  return (
    <div className="space-y-16">
      {/* ── Executive Directors Grid ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {EXTENDED_LEADERSHIP.map((leader, index) => (
          <motion.div
            key={leader.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-card/90 p-6 shadow-card hover:border-brand-500/50 hover:shadow-xl transition-all duration-300"
          >
            {/* Top row: Avatar + Role badge */}
            <div>
              <div className="flex items-start gap-5">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-brand-500/20 bg-muted shadow-md group-hover:border-brand-500/60 transition-colors">
                  {leader.image ? (
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      unoptimized
                      priority={index < 2}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 96px, 112px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-brand-600 dark:text-brand-400">
                      {monogram(leader.name)}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 border border-brand-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                    {leader.role}
                  </span>

                  <h3 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                    {leader.name}
                  </h3>

                  {leader.shares && (
                    <div className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span className="truncate">{leader.shares}</span>
                    </div>
                  )}

                  {leader.location && (
                    <div className="text-xs text-muted-foreground/80 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{leader.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Responsibilities summary */}
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {leader.responsibilities}
              </p>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {leader.email && (
                  <a
                    href={`mailto:${leader.email}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-elevated text-muted-foreground hover:bg-brand-500/10 hover:text-brand-600 hover:border-brand-500/30 transition-all"
                    title={`Email ${leader.name}`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
                {leader.phone && (
                  <a
                    href={`tel:${leader.phone.replace(/\s/g, '')}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-elevated text-muted-foreground hover:bg-brand-500/10 hover:text-brand-600 hover:border-brand-500/30 transition-all"
                    title={`Call ${leader.name}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLeader(leader)}
                className="group/btn text-xs font-semibold rounded-lg hover:border-brand-500/40 hover:bg-brand-500/10"
              >
                <span>Executive Dossier</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Technical Leadership & Engineering Cadre ── */}
      <div className="rounded-3xl border border-hairline bg-surface-elevated/60 p-8 sm:p-10 backdrop-blur-md shadow-card">
        <div className="max-w-2xl">
          <span className="tech-label">TECHNICAL EXECUTION ARCHITECTURE</span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Qualified Engineering Leadership
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Every technical discipline is directed by certified professional engineers with specialized mining, metallurgy, civil, and electrical erection backgrounds across East Africa.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TECHNICAL_CADRE.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-hairline bg-card p-5 shadow-sm hover:border-brand-500/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-foreground">
                      {item.role}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.focus}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-hairline/60">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-brand-700 dark:text-brand-400">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {item.credential}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pop-Up Modal for Selected Leader ── */}
      <Dialog.Root
        open={Boolean(selectedLeader)}
        onOpenChange={(open) => {
          if (!open) setSelectedLeader(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[94vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-hairline bg-card p-0 shadow-2xl overflow-hidden focus:outline-none animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {selectedLeader && (
              <>
                {/* Modal Header Cover with Portrait */}
                <div className="relative bg-gradient-to-br from-teal-950/80 via-surface-elevated to-card p-6 sm:p-8 border-b border-hairline">
                  <Dialog.Close className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated/80 border border-hairline text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Dialog.Close>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-teal-500/40 bg-muted shadow-xl">
                      {selectedLeader.image ? (
                        <Image
                          src={selectedLeader.image}
                          alt={selectedLeader.name}
                          fill
                          unoptimized
                          className="object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-brand-600 dark:text-brand-400">
                          {monogram(selectedLeader.name)}
                        </span>
                      )}
                    </div>

                    <div className="text-center sm:text-left space-y-1.5 flex-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 border border-teal-500/30">
                        {selectedLeader.role}
                      </span>
                      <Dialog.Title className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                        {selectedLeader.name}
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-muted-foreground font-mono">
                        {selectedLeader.shares} • {selectedLeader.location}
                      </Dialog.Description>

                      <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        {selectedLeader.email && (
                          <a
                            href={`mailto:${selectedLeader.email}`}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors bg-surface-elevated px-2.5 py-1 rounded-md border border-hairline"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {selectedLeader.email}
                          </a>
                        )}
                        {selectedLeader.phone && (
                          <a
                            href={`tel:${selectedLeader.phone.replace(/\s/g, '')}`}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors bg-surface-elevated px-2.5 py-1 rounded-md border border-hairline font-mono"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {selectedLeader.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin">
                  {/* Executive Mandate & Bio */}
                  <div>
                    <h4 className="tech-label">EXECUTIVE MANDATE &amp; RESPONSIBILITIES</h4>
                    <p className="mt-2 text-sm leading-relaxed text-foreground font-medium">
                      {selectedLeader.dossier.mandate}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {selectedLeader.dossier.biography}
                    </p>
                  </div>

                  {/* Core Focus Areas */}
                  <div className="rounded-2xl border border-hairline bg-surface-elevated/70 p-5">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Compass className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      Strategic Focus Portfolios
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {selectedLeader.dossier.focusAreas.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Active Projects & Governance Mandates */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-hairline bg-card p-4">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                        <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                        Governance Roles
                      </div>
                      <ul className="space-y-1.5">
                        {selectedLeader.dossier.governanceRoles.map((g, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground list-disc list-inside">
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-hairline bg-card p-4">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                        <Layers className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                        Key Project Oversight
                      </div>
                      <ul className="space-y-1.5">
                        {selectedLeader.dossier.activeProjects.map((p, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground list-disc list-inside">
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 sm:px-8 border-t border-hairline bg-surface-elevated/80 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    Official Green Ngoria Executive Record
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedLeader(null)}>
                      Close
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/contact">
                        Contact Executive Office
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
