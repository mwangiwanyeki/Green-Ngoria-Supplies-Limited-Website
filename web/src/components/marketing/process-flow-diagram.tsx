'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PROCESS_GLYPHS, type ProcessGlyphName } from './process-glyphs';

export interface ProcessStage {
  id: string;
  label: string;
  glyph: ProcessGlyphName;
  /** One-line role in the circuit, shown on the rail. */
  purpose: string;
  description: string;
  equipment: string[];
  notes: string;
  /** Marks the stage Green Ngoria's profile names as its specialisation. */
  emphasis?: boolean;
}

/**
 * ProcessFlowDiagram — an interactive, technically-credible representation of
 * a gold circuit. Stages are indicative unit operations; the component never
 * asserts a specific plant design.
 */
export function ProcessFlowDiagram({
  stages,
  initialStageId,
  className,
  disclaimer,
}: {
  stages: ProcessStage[];
  initialStageId?: string;
  className?: string;
  disclaimer?: string;
}) {
  const [activeId, setActiveId] = React.useState(
    initialStageId ?? stages[0]?.id,
  );
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = Math.max(
    0,
    stages.findIndex((s) => s.id === activeId),
  );
  const active = stages[activeIndex];

  function focusTab(index: number) {
    const next = (index + stages.length) % stages.length;
    setActiveId(stages[next].id);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(stages.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      className={cn(
        'grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16',
        className,
      )}
    >
      {/* ── Process rail ─────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Gold processing circuit stages"
        className="group/rail relative"
      >
        {/* Flow line behind the nodes */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-8 left-[27px] top-8 w-px overflow-visible"
          preserveAspectRatio="none"
        >
          <line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            className="stroke-border"
            strokeWidth="1"
          />
          <line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            className="animate-flow-dash stroke-brand-500/70 [animation-play-state:paused] group-hover/rail:[animation-play-state:running] group-focus-within/rail:[animation-play-state:running] dark:stroke-brand-400/70"
            strokeWidth="1.5"
            strokeDasharray="3 9"
            strokeLinecap="round"
          />
        </svg>

        <ol className="relative space-y-1.5">
          {stages.map((stage, index) => {
            const Glyph = PROCESS_GLYPHS[stage.glyph];
            const selected = stage.id === active?.id;
            return (
              <li key={stage.id}>
                <button
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`stage-tab-${stage.id}`}
                  aria-selected={selected}
                  aria-controls="stage-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(stage.id)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  className={cn(
                    'group flex w-full items-center gap-4 rounded-lg py-2.5 pl-1 pr-3 text-left',
                    'transition-[background-color,color,box-shadow] duration-micro ease-out-expo',
                    selected
                      ? 'bg-accent/70'
                      : 'hover:bg-secondary/70 focus-visible:bg-secondary/70',
                  )}
                >
                  <span
                    className={cn(
                      'relative z-10 flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-lg border bg-card',
                      'transition-[border-color,color,box-shadow,transform] duration-ui ease-out-expo',
                      selected
                        ? 'border-brand-500/60 text-brand-600 shadow-mid dark:text-brand-400'
                        : 'border-border text-muted-foreground shadow-low group-hover:border-brand-500/40 group-hover:text-brand-600 dark:group-hover:text-brand-400',
                    )}
                  >
                    <Glyph className="h-6 w-6" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate font-display text-[0.9375rem] font-semibold',
                        selected ? 'text-foreground' : 'text-foreground/90',
                      )}
                    >
                      {stage.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-subtle">
                      {stage.purpose}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-6 w-px shrink-0 rounded-full transition-colors duration-ui',
                      selected
                        ? 'bg-brand-500 dark:bg-brand-400'
                        : 'bg-transparent',
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Stage detail ─────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        {active && (
          <div
            role="tabpanel"
            id="stage-panel"
            aria-labelledby={`stage-tab-${active.id}`}
            tabIndex={0}
            className="rounded-xl border border-border bg-card p-7 shadow-mid sm:p-9"
          >
            <div className="flex items-start justify-between gap-6">
              <h3 className="font-display text-display-sm font-bold">
                {active.label}
              </h3>
              <span
                className="font-mono text-xs text-subtle"
                aria-label={`Stage ${activeIndex + 1} of ${stages.length}`}
              >
                {String(activeIndex + 1).padStart(2, '0')}
                <span className="text-subtle/70" aria-hidden="true">
                  /
                </span>
                {String(stages.length).padStart(2, '0')}
              </span>
            </div>

            <p className="measure mt-4 leading-7 text-muted-foreground">
              {active.description}
            </p>

            <dl className="mt-8 divide-y divide-hairline border-y border-hairline">
              <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="tech-label pt-1">Function</dt>
                <dd className="text-sm font-medium">{active.purpose}</dd>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="tech-label pt-1">Typical equipment</dt>
                <dd>
                  <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
                    {active.equipment.map((item) => (
                      <li
                        key={item}
                        className="rounded border border-hairline bg-secondary/60 px-2 py-1 font-mono text-xs text-muted-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              {active.notes}
            </p>

            {disclaimer && (
              <p className="mt-6 border-l border-brand-500/50 pl-4 text-xs leading-5 text-subtle">
                {disclaimer}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
