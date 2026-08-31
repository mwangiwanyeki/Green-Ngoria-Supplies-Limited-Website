import { cn } from '@/lib/utils';

/**
 * PlantSchematic — an abstract elevation of a processing plant drawn in
 * engineering linework: feed hopper, crushing, mill, agitated tank train and
 * the flow between them. Decorative but domain-true; no figures are labelled.
 *
 * The flowing dash is the hero's single authored motion moment. It is halted
 * by the global `prefers-reduced-motion` rule.
 */
export function PlantSchematic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 560"
      fill="none"
      aria-hidden="true"
      className={cn('h-full w-full', className)}
    >
      <defs>
        <linearGradient id="gn-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="72%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
        <mask id="gn-mask">
          <rect width="520" height="560" fill="url(#gn-fade)" />
        </mask>
      </defs>

      <g mask="url(#gn-mask)">
        {/* Datum and level lines */}
        <g stroke="currentColor" strokeOpacity="0.16" strokeWidth="1">
          <line x1="0" y1="498" x2="520" y2="498" />
          <line x1="0" y1="362" x2="520" y2="362" strokeDasharray="2 8" />
          <line x1="0" y1="226" x2="520" y2="226" strokeDasharray="2 8" />
          <line x1="0" y1="96" x2="520" y2="96" strokeDasharray="2 8" />
        </g>

        <g
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* Feed hopper on a steel frame */}
          <path d="M40 60h120l-34 62H74L40 60Z" />
          <path d="M92 122v26h16v-26" />
          <path d="M56 78h88" strokeOpacity="0.3" />
          <path d="M46 96v122M154 96v122M46 218h108" />
          <path
            d="M46 160h108M46 96l108 122M154 96 46 218"
            strokeOpacity="0.2"
          />

          {/* Conveyor to the crusher */}
          <path d="M100 174 236 226" />
          <path d="M100 186 236 238" strokeOpacity="0.3" />
          <path d="M168 200v40M204 214v26" strokeOpacity="0.25" />

          {/* Crushing house */}
          <path d="M220 226h96v66h-96z" />
          <path d="M236 244v30l24 18 24-18v-30" />
          <path d="M252 252h16" strokeOpacity="0.35" />
          <path d="M268 292v18" />

          {/* Mill drum on piers */}
          <circle cx="150" cy="392" r="58" />
          <circle cx="150" cy="392" r="44" strokeOpacity="0.28" />
          <path d="M106 424a58 58 0 0 0 88 0" strokeOpacity="0.4" />
          <circle cx="150" cy="392" r="4" />
          <path d="M112 442 100 498M188 442l12 56" />
          <path d="M150 334v-24M150 310h-28" strokeOpacity="0.35" />

          {/* Cyclone cluster */}
          <path d="M300 316h56l-19 40h-18l-19-40Z" />
          <path d="M334 356v26M340 356v26" strokeOpacity="0.5" />
          <path d="M328 306h28" strokeOpacity="0.3" />

          {/* Agitated tank train */}
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${316 + i * 66} 396)`}>
              <path d="M0 12h54v90H0z" />
              <path d="M27 0v56M14 56h26" />
              <path d="M6 40h42" strokeOpacity="0.28" />
              <path d="M18 0h18" />
              <path d="M0 102h54" />
            </g>
          ))}
          <path d="M370 434h12M436 434h12" strokeOpacity="0.4" />

          {/* Ground steel */}
          <path d="M300 498v-24M474 498v-24" strokeOpacity="0.3" />
        </g>

        {/* Live process flow — the one animated element */}
        <g
          className="text-brand-400"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        >
          <path
            className="animate-flow-dash [animation-duration:2.4s]"
            strokeDasharray="4 20"
            d="M100 148v26l136 52v66h-2l-84 100h150l14 40h58"
          />
        </g>

        {/* Node markers */}
        <g className="text-brand-400" fill="currentColor" fillOpacity="0.9">
          <circle cx="100" cy="148" r="3" />
          <circle cx="268" cy="292" r="3" />
          <circle cx="150" cy="392" r="3" />
          <circle cx="334" cy="382" r="3" />
          <circle cx="462" cy="432" r="3" />
        </g>
      </g>
    </svg>
  );
}
