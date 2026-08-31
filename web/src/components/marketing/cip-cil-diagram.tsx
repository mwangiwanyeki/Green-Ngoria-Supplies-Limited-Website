import { Section, SectionIntro } from '@/components/marketing/section';
import { ProcessFlowDiagram } from '@/components/marketing/process-flow-diagram';
import {
  goldCircuitStages,
  goldCircuitDisclaimer,
} from '@/config/gold-circuit';

/**
 * The CIP/CIL section used on the gold-processing page and the home page.
 * Content is generic process context — see `@/config/gold-circuit`.
 */
export function CipCilDiagram({
  title = 'How gold moves through a carbon-in-pulp circuit',
  lead = 'Crushing, grinding, classification, leaching, adsorption, elution and tailings — the sequence a gold processing plant is built around. Select a stage to read what it does and the equipment it usually involves.',
  tone = 'default',
}: {
  title?: string;
  lead?: string;
  tone?: 'default' | 'sunken';
}) {
  return (
    <Section tone={tone} labelledBy="gold-circuit-heading" rule>
      <SectionIntro
        id="gold-circuit-heading"
        title={title}
        lead={lead}
        align="stack"
      />
      <ProcessFlowDiagram
        className="mt-14"
        stages={goldCircuitStages}
        initialStageId="adsorption"
        disclaimer={goldCircuitDisclaimer}
      />
    </Section>
  );
}
