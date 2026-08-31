/**
 * Indicative unit operations in a carbon-in-pulp / carbon-in-leach gold
 * circuit, used by `ProcessFlowDiagram`.
 *
 * This is generic process context, not a description of any specific Green
 * Ngoria plant design. No throughput, recovery, grade or sizing figure is
 * attributed to a company facility anywhere in this file.
 */

import type { ProcessStage } from '@/components/marketing/process-flow-diagram';

export const goldCircuitStages: ProcessStage[] = [
  {
    id: 'ore',
    label: 'Run-of-mine ore',
    glyph: 'feed',
    purpose: 'Primary material input',
    description:
      'Feed ore from mining operations enters the processing circuit.',
    equipment: ['Feed hopper', 'Apron feeder', 'Belt conveyor'],
    notes:
      'Ore characteristics — hardness, grade and mineralogy — determine circuit design.',
  },
  {
    id: 'crushing',
    label: 'Crushing',
    glyph: 'crush',
    purpose: 'Size reduction',
    description:
      'Primary and secondary crushing reduces ore to a size suitable for grinding.',
    equipment: ['Jaw crusher', 'Cone crusher', 'Vibrating screen'],
    notes:
      'Reduction ratio per stage is set by the crusher selection and the feed size distribution.',
  },
  {
    id: 'grinding',
    label: 'Grinding',
    glyph: 'mill',
    purpose: 'Liberation of gold particles',
    description:
      'Ball or SAG milling reduces the crushed ore to the grind size required for leaching.',
    equipment: ['Ball mill', 'SAG mill', 'Rod mill'],
    notes:
      'Target grind depends on ore mineralogy and gold liberation characteristics, established by test work.',
  },
  {
    id: 'classification',
    label: 'Classification',
    glyph: 'cyclone',
    purpose: 'Size classification',
    description:
      'Cyclones separate fine product from coarse material for recirculation.',
    equipment: ['Hydrocyclones', 'Thickener', 'Pump box'],
    notes: 'Overflow reports to leaching. Underflow recirculates to the mill.',
  },
  {
    id: 'leaching',
    label: 'Leaching',
    glyph: 'leach',
    purpose: 'Gold dissolution',
    description:
      'Cyanide leaching dissolves gold from pulp in a cascade of agitated tanks.',
    equipment: ['Leach tanks', 'Agitators', 'Cyanide dosing', 'Oxygen dosing'],
    notes:
      'Retention time and reagent concentration are critical design parameters, fixed by metallurgical test work.',
  },
  {
    id: 'adsorption',
    label: 'Adsorption — CIP / CIL',
    glyph: 'adsorb',
    purpose: 'Gold recovery onto carbon',
    emphasis: true,
    description:
      'Activated carbon adsorbs dissolved gold from the pregnant leach solution.',
    equipment: ['CIP/CIL tanks', 'Carbon screens', 'Carbon transfer pump'],
    notes:
      'CIL adds carbon to the leach tanks. CIP adds carbon after leaching. The two configurations lead to different tankage and screening arrangements.',
  },
  {
    id: 'elution',
    label: 'Elution & recovery',
    glyph: 'elution',
    purpose: 'Gold doré production',
    description:
      'Loaded carbon is stripped of gold. The gold-rich eluate is electrowon and smelted.',
    equipment: [
      'AARL/Zadra elution column',
      'Electrowinning cells',
      'Smelting furnace',
    ],
    notes: 'This stage produces gold doré bars for refining.',
  },
  {
    id: 'tailings',
    label: 'Tailings management',
    glyph: 'tailings',
    purpose: 'Environmental management',
    description:
      'Detoxified tailings are deposited in a lined facility, and water is recycled back to the circuit.',
    equipment: ['Detox reactor', 'Tailings thickener', 'TSF infrastructure'],
    notes:
      'Tailings and water systems are designed around environmental protection and the approvals that govern the site.',
  },
];

export const goldCircuitDisclaimer =
  'Indicative unit operations only. A circuit configuration, its sizing and its reagent regime cannot be fixed without ore characterisation and metallurgical test work.';
