'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Cpu,
  Layers,
  Activity,
  FileCheck2,
  MapPin,
  Flame,
  ShieldCheck,
  Download,
  PhoneCall,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { post } from '@/lib/api/api-client';

const schema = z.object({
  // Contact & Project
  clientName: z.string().min(2, 'Company or individual name is required'),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('Valid contact email is required'),
  contactPhone: z.string().min(6, 'Valid contact phone number is required'),
  projectName: z.string().optional(),
  miningLocation: z.string().min(2, 'Mining location or concession area is required'),

  // Ore & Mineral context
  mineralType: z.enum(['GOLD', 'SILVER', 'GEMSTONE', 'COPPER', 'IRON_ORE', 'BASE_METALS', 'OTHER']).default('GOLD'),
  estimatedTph: z.coerce.number().min(0.1, 'Estimated throughput required'),
  oreGrade: z.coerce.number().optional(),
  oreMineralogy: z.string().optional(),
  oreHardness: z.string().optional(),
  oreDescription: z.string().optional(),

  // Existing Plant & Circuit
  hasExistingPlant: z.boolean().default(false),
  existingPlantDesc: z.string().optional(),
  existingCapacity: z.coerce.number().optional(),
  crushingType: z.string().optional(),
  grindingType: z.string().optional(),
  leachingType: z.string().optional(),
  gravityType: z.string().optional(),

  // Targets & Objectives
  currentRecovery: z.coerce.number().optional(),
  targetRecovery: z.coerce.number().optional(),
  operationalProblems: z.string().optional(),
  environmentalConstraints: z.string().optional(),
  hseConstraints: z.string().optional(),
  clientObjectives: z.string().optional(),
  additionalNotes: z.string().optional(),

  // Honeypot
  company_website: z.string().max(0).optional(),
});

type FormData = z.infer<typeof schema>;

const LOCATION_PRESETS = [
  'Bondo, Siaya County (Kenya)',
  'Oyugis, Homa Bay County (Kenya)',
  'Lolgorian, Narok County (Kenya)',
  'Taita Taveta (Kenya)',
  'Tanzanian Mineral Concession',
  'Kakamega / Western Gold Corridor',
  'Migori / Macalder Belt',
];

export function PlantAssessmentForm() {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [submissionResult, setSubmissionResult] = React.useState<{
    reference: string;
    id: string;
    submittedAt: string;
    data: FormData;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mineralType: 'GOLD',
      estimatedTph: 20,
      hasExistingPlant: false,
      targetRecovery: 90,
      miningLocation: 'Bondo, Siaya County (Kenya)',
      projectName: 'Gold Processing Plant Optimization & Expansion',
    },
  });

  const formValues = watch();

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formValues.clientName || !formValues.contactEmail || !formValues.contactPhone || !formValues.miningLocation) {
        toast.error('Please complete all required contact & location fields');
        return;
      }
    }
    if (step < 4) setStep((s) => (s + 1) as any);
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step > 1) setStep((s) => (s - 1) as any);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        clientName: data.clientName,
        contactPerson: data.contactPerson || data.clientName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        projectName: data.projectName,
        miningLocation: data.miningLocation,
        mineralType: data.mineralType,
        estimatedTph: Number(data.estimatedTph),
        oreGrade: data.oreGrade ? Number(data.oreGrade) : undefined,
        oreMineralogy: data.oreMineralogy,
        oreHardness: data.oreHardness,
        oreDescription: data.oreDescription,
        hasExistingPlant: data.hasExistingPlant,
        existingPlantDesc: data.existingPlantDesc,
        existingCapacity: data.existingCapacity ? Number(data.existingCapacity) : undefined,
        crushingData: data.crushingType ? { type: data.crushingType } : undefined,
        grindingData: data.grindingType ? { type: data.grindingType } : undefined,
        leachingData: data.leachingType ? { type: data.leachingType } : undefined,
        currentRecovery: data.currentRecovery ? Number(data.currentRecovery) : undefined,
        targetRecovery: data.targetRecovery ? Number(data.targetRecovery) : undefined,
        operationalProblems: data.operationalProblems,
        environmentalConstraints: data.environmentalConstraints,
        hseConstraints: data.hseConstraints,
        clientObjectives: data.clientObjectives,
        additionalNotes: data.additionalNotes,
        company_website: data.company_website,
      };

      const res = await post<{ reference: string; id: string; submittedAt: string }>(
        '/public/plant-assessment',
        payload,
      );

      const ref = res?.data?.reference || `TPA-${new Date().getFullYear()}-0001`;
      const id = res?.data?.id || '';
      const submittedAt = res?.data?.submittedAt || new Date().toISOString();

      setSubmissionResult({
        reference: ref,
        id,
        submittedAt,
        data,
      });

      toast.success('Technical Plant Assessment Submitted', {
        description: `Assessment reference ${ref} generated. Engineering review initiated.`,
      });
    } catch (err: any) {
      toast.error('Submission encountered an error', {
        description: err?.message || 'Please verify your details and try again or contact engineering directly.',
      });
    }
  };

  /* ── Success Receipt View ────────────────────────────────────────────── */
  if (submissionResult) {
    return (
      <div className="overflow-hidden rounded-2xl border border-brand-500/40 bg-card p-6 shadow-panel sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                System 4 Assessment Confirmed
              </span>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Assessment Request Registered
              </h2>
            </div>
          </div>

          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-right">
            <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
              Official Reference
            </span>
            <span className="font-mono text-lg font-bold text-brand-700 dark:text-brand-400">
              {submissionResult.reference}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
            <span className="text-xs text-muted-foreground">Client / Concession</span>
            <p className="mt-1 font-semibold text-foreground">{submissionResult.data.clientName}</p>
            <p className="text-xs text-muted-foreground">{submissionResult.data.miningLocation}</p>
          </div>
          <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
            <span className="text-xs text-muted-foreground">Target Commodity & Rate</span>
            <p className="mt-1 font-semibold text-foreground">
              {submissionResult.data.mineralType} · {submissionResult.data.estimatedTph} TPH
            </p>
            <p className="text-xs text-muted-foreground">
              Grade: {submissionResult.data.oreGrade ? `${submissionResult.data.oreGrade} g/t` : 'TBD'}
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
            <span className="text-xs text-muted-foreground">Recovery Objective</span>
            <p className="mt-1 font-semibold text-foreground">
              Target: {submissionResult.data.targetRecovery || 90}%
            </p>
            <p className="text-xs text-muted-foreground">
              Current: {submissionResult.data.currentRecovery ? `${submissionResult.data.currentRecovery}%` : 'N/A'}
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
            <span className="text-xs text-muted-foreground">Review Turnaround</span>
            <p className="mt-1 font-semibold text-brand-700 dark:text-brand-400">24 – 48 Hours</p>
            <p className="text-xs text-muted-foreground">Engineering Desk Review</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-hairline bg-surface-sunken p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Next Steps in Engineering Review Protocol
          </h3>
          <ol className="mt-4 space-y-3 text-xs leading-6 text-muted-foreground sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-700 dark:text-brand-400">
                1
              </span>
              <span>
                <strong>Desk Metallurgical Assessment</strong>: Our senior mineral processing engineers evaluate your ore grade, mineralogy, and target throughput to determine optimal flowsheet configuration.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-700 dark:text-brand-400">
                2
              </span>
              <span>
                <strong>Direct Engineering Contact</strong>: A project engineer will contact <strong>{submissionResult.data.contactEmail}</strong> ({submissionResult.data.contactPhone}) to discuss site visit logistics and sample assays.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-700 dark:text-brand-400">
                3
              </span>
              <span>
                <strong>Formal Engineering Proposal</strong>: Issuance of preliminary equipment sizing, mass balance calculations, and turnkey Capex/Opex budget.
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
          <p className="text-xs text-muted-foreground">
            Need urgent engineering assistance? Call Managing Director Office at <strong>+254 722 724 676</strong>.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmissionResult(null);
                setStep(1);
              }}
            >
              Submit Another Assessment
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Print / Save Receipt
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Interactive Multi-Step Form View ───────────────────────────────── */
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-panel">
      {/* Stepper Navigation Bar */}
      <div className="border-b border-hairline bg-surface-sunken p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
          {[
            { num: 1, label: 'Client & Site Profile', icon: Building2 },
            { num: 2, label: 'Ore & Metallurgy', icon: Layers },
            { num: 3, label: 'Plant & Circuits', icon: Cpu },
            { num: 4, label: 'Targets & Submit', icon: Activity },
          ].map((s) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isPassed = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num as any)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                  isCurrent
                    ? 'border-brand-500/80 bg-card shadow-sm'
                    : isPassed
                      ? 'border-brand-500/30 bg-brand-500/5 text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-card/60'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isCurrent
                      ? 'bg-brand-500 text-black font-extrabold'
                      : isPassed
                        ? 'bg-brand-500/20 text-brand-700 dark:text-brand-400'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPassed ? '✓' : s.num}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">
                    {s.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-10">
        {/* Anti-bot Honeypot */}
        <input
          type="text"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          {...register('company_website')}
        />

        {/* ── STEP 1: Client & Site Profile ────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Step 1: Client, Project &amp; Concession Profile
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter your commercial organization and mining concession coordinates for engineering intake.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="clientName" required>Company / Operator Name</Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Acacia Mining Resources Ltd"
                  error={errors.clientName?.message}
                  {...register('clientName')}
                />
              </div>

              <div>
                <Label htmlFor="contactPerson">Principal Contact Person</Label>
                <Input
                  id="contactPerson"
                  placeholder="e.g. Eng. David Ochieng (Managing Director)"
                  {...register('contactPerson')}
                />
              </div>

              <div>
                <Label htmlFor="contactEmail" required>Official Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="e.g. d.ochieng@acaciamining.com"
                  error={errors.contactEmail?.message}
                  {...register('contactEmail')}
                />
              </div>

              <div>
                <Label htmlFor="contactPhone" required>Direct Phone Number / WhatsApp</Label>
                <Input
                  id="contactPhone"
                  placeholder="e.g. +254 711 000 000"
                  error={errors.contactPhone?.message}
                  {...register('contactPhone')}
                />
              </div>

              <div>
                <Label htmlFor="projectName">Project / Plant Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Bondo CIL 30 TPH Expansion"
                  {...register('projectName')}
                />
              </div>

              <div>
                <Label htmlFor="miningLocation" required>Mining Location / Concession</Label>
                <Input
                  id="miningLocation"
                  placeholder="e.g. Bondo, Siaya County, Kenya"
                  error={errors.miningLocation?.message}
                  {...register('miningLocation')}
                />
              </div>
            </div>

            {/* Quick preset selector buttons */}
            <div>
              <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Select Operating Region
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {LOCATION_PRESETS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setValue('miningLocation', loc)}
                    className="rounded-lg border border-hairline bg-surface-sunken px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-500/50 hover:bg-card hover:text-foreground"
                  >
                    + {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Ore & Metallurgy ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Step 2: Mineral Type &amp; Ore Metallurgy
              </h3>
              <p className="text-xs text-muted-foreground">
                Define the deposit characteristics to establish the crushing, grinding, and leaching kinetics.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="mineralType" required>Target Commodity</Label>
                <select
                  id="mineralType"
                  className="flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('mineralType')}
                >
                  <option value="GOLD">Gold (Au) — Primary Focus</option>
                  <option value="GEMSTONE">Gemstones (Tanzanite, Tsavorite, Ruby)</option>
                  <option value="COPPER">Copper (Cu)</option>
                  <option value="SILVER">Silver (Ag)</option>
                  <option value="BASE_METALS">Base Metals</option>
                  <option value="IRON_ORE">Iron Ore</option>
                  <option value="OTHER">Other Mineral Deposit</option>
                </select>
              </div>

              <div>
                <Label htmlFor="estimatedTph" required>Target Plant Throughput (TPH)</Label>
                <Input
                  id="estimatedTph"
                  type="number"
                  step="any"
                  placeholder="e.g. 25 (Tonnes Per Hour)"
                  error={errors.estimatedTph?.message}
                  {...register('estimatedTph')}
                />
              </div>

              <div>
                <Label htmlFor="oreGrade">Estimated Head Grade (g/t Au or %)</Label>
                <Input
                  id="oreGrade"
                  type="number"
                  step="any"
                  placeholder="e.g. 4.5 (g/t Au)"
                  {...register('oreGrade')}
                />
              </div>

              <div>
                <Label htmlFor="oreHardness">Ore Hardness / Bond Work Index (kWh/t)</Label>
                <Input
                  id="oreHardness"
                  placeholder="e.g. Medium-Hard Quartz (14.2 kWh/t)"
                  {...register('oreHardness')}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="oreMineralogy">Ore Mineralogy &amp; Host Rock</Label>
                <Input
                  id="oreMineralogy"
                  placeholder="e.g. Quartz vein with free gold, minor pyrite and arsenopyrite, low clay content"
                  {...register('oreMineralogy')}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="oreDescription">Geological Description &amp; Deposit Background</Label>
                <Textarea
                  id="oreDescription"
                  rows={3}
                  placeholder="Provide geological details, drill core findings, vein thickness, depth of deposit, or previous assay results..."
                  {...register('oreDescription')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Existing Plant & Circuits ────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Step 3: Processing Plant Infrastructure &amp; Circuit Scope
              </h3>
              <p className="text-xs text-muted-foreground">
                State whether this is a greenfields project or an optimization/expansion of an existing facility.
              </p>
            </div>

            <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  {...register('hasExistingPlant')}
                />
                <div>
                  <span className="font-semibold text-sm text-foreground">
                    This project involves an existing processing plant
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Check if you currently have operating crushers, mills, or leach circuits on site.
                  </p>
                </div>
              </label>
            </div>

            {formValues.hasExistingPlant && (
              <div className="grid gap-5 sm:grid-cols-2 animate-fadeIn">
                <div>
                  <Label htmlFor="existingCapacity">Current Operating Capacity (TPH)</Label>
                  <Input
                    id="existingCapacity"
                    type="number"
                    placeholder="e.g. 10"
                    {...register('existingCapacity')}
                  />
                </div>
                <div>
                  <Label htmlFor="existingPlantDesc">Existing Equipment Summary</Label>
                  <Input
                    id="existingPlantDesc"
                    placeholder="e.g. Jaw crusher, 1.2m ball mill, simple sluice boxes"
                    {...register('existingPlantDesc')}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="crushingType">Crushing Circuit Requirement</Label>
                <select
                  id="crushingType"
                  className="flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('crushingType')}
                >
                  <option value="Single-Stage Primary Jaw">Single-Stage Primary Jaw Crusher</option>
                  <option value="Two-Stage Jaw + Secondary Cone">Two-Stage (Jaw + Secondary Cone)</option>
                  <option value="Three-Stage Closed Circuit">Three-Stage Closed Crushing Circuit</option>
                  <option value="Mobile Crushing Train">Mobile Diesel Crushing Train</option>
                  <option value="Client Supplied">Client Already Has Crushing</option>
                </select>
              </div>

              <div>
                <Label htmlFor="grindingType">Milling &amp; Grinding Circuit</Label>
                <select
                  id="grindingType"
                  className="flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('grindingType')}
                >
                  <option value="Continuous Overflow Ball Mill">Continuous Overflow Ball Mill</option>
                  <option value="Grate Discharge Ball Mill">Grate Discharge Ball Mill</option>
                  <option value="Closed Circuit with Hydrocyclones">Closed Circuit with Hydrocyclone Pack</option>
                  <option value="Rod Mill Primary + Ball Mill Secondary">Two-Stage Rod &amp; Ball Milling</option>
                  <option value="To Be Determined by Audit">To Be Determined by Metallurgical Audit</option>
                </select>
              </div>

              <div>
                <Label htmlFor="leachingType">Gold Recovery &amp; Leaching Method</Label>
                <select
                  id="leachingType"
                  className="flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('leachingType')}
                >
                  <option value="Carbon-in-Leach (CIL) Agitation Tanks">Carbon-in-Leach (CIL) Agitation Tank Farm</option>
                  <option value="Carbon-in-Pulp (CIP) Plant">Carbon-in-Pulp (CIP) Counter-Current Plant</option>
                  <option value="Knelson Centrifugal Gravity Only">Knelson Centrifugal Gravity Only (Non-Cyanide)</option>
                  <option value="Heap Leaching Pad">Heap Leaching Pad</option>
                  <option value="Vat Leaching System">Vat Leaching Agitation System</option>
                  <option value="Flotation Circuit">Flotation Circuit for Sulfide Concentrates</option>
                </select>
              </div>

              <div>
                <Label htmlFor="gravityType">Gravity Pre-Concentration</Label>
                <select
                  id="gravityType"
                  className="flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('gravityType')}
                >
                  <option value="Knelson Centrifugal Concentrator">Knelson Centrifugal Concentrator</option>
                  <option value="Gemeni Shaking Table">Gemeni Shaking Table</option>
                  <option value="Spiral Concentrators">Heavy Mineral Spiral Concentrators</option>
                  <option value="High-Recovery Sluice System">High-Recovery Continuous Sluices</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Targets & Submit ─────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Step 4: Recovery Targets &amp; Operational Objectives
              </h3>
              <p className="text-xs text-muted-foreground">
                Set recovery benchmarks and operational constraints for our engineering scoping review.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="currentRecovery">Current Estimated Recovery Rate (%)</Label>
                <Input
                  id="currentRecovery"
                  type="number"
                  step="any"
                  placeholder="e.g. 55"
                  {...register('currentRecovery')}
                />
              </div>

              <div>
                <Label htmlFor="targetRecovery">Target Engineering Recovery Rate (%)</Label>
                <Input
                  id="targetRecovery"
                  type="number"
                  step="any"
                  placeholder="e.g. 90"
                  {...register('targetRecovery')}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="operationalProblems">Current Operational Bottlenecks or Problems</Label>
                <Textarea
                  id="operationalProblems"
                  rows={2}
                  placeholder="e.g. High gold losses in tailings, frequent mill liner wear, poor cyanide mixing, carbon attrition..."
                  {...register('operationalProblems')}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="clientObjectives">Primary Objectives &amp; Project Timeline</Label>
                <Textarea
                  id="clientObjectives"
                  rows={3}
                  placeholder="e.g. Build a complete 25 TPH CIL gold processing facility with tailings containment within 6 months, or optimize existing Bondo circuit..."
                  {...register('clientObjectives')}
                />
              </div>
            </div>

            {/* Summary Review Panel */}
            <div className="rounded-xl border border-brand-500/30 bg-surface-sunken p-4 text-xs leading-6 text-muted-foreground">
              <span className="font-bold text-foreground">Ready for Submission:</span>
              <p className="mt-1">
                Submitting this assessment registers an official technical opportunity in System 4 and alerts our engineering team. An engineer will conduct an initial desk review within 24 to 48 hours.
              </p>
            </div>
          </div>
        )}

        {/* Navigation & Submission Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevStep}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Previous Step
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={handleNextStep}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="submit"
              variant="brand"
              size="lg"
              loading={isSubmitting}
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Submit Technical Assessment Request
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
