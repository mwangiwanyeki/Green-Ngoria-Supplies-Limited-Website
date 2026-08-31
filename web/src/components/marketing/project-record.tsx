import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProjectRecordData {
  title: string;
  client: string;
  location: string;
  country: string;
  scope: string;
  /** "Sector / discipline" as recorded in the company profile. */
  sector: string;
}

/** Split the profile's `sector` field into client sector and discipline. */
function splitSector(sector: string) {
  const [type, discipline] = sector.split('/').map((part) => part.trim());
  return { type, discipline };
}

/**
 * Project record (DESIGN.md §7): project type, location, stage, scope and the
 * engineering/construction disciplines involved. No metric is invented — every
 * field maps directly onto a field in the company profile.
 */
export function ProjectRecord({
  project,
  className,
}: {
  project: ProjectRecordData;
  className?: string;
}) {
  const { type, discipline } = splitSector(project.sector);

  return (
    <article
      className={cn(
        'group relative flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-6 shadow-low transition-[border-color,box-shadow,transform] duration-ui ease-out-expo hover:-translate-y-1 hover:border-brand-500/35 hover:shadow-high sm:p-8',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4">
        <p className="min-w-0 truncate font-display text-sm font-semibold tracking-tight">
          {project.client}
        </p>
        <p className="flex shrink-0 items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-400">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-brand-600 dark:bg-brand-400"
          />
          Completed
        </p>
      </div>

      <h3 className="mt-5 font-display text-lg font-bold leading-snug tracking-tight">
        {project.title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
        {project.scope}
      </p>

      <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-hairline pt-5 sm:grid-cols-2">
        <div>
          <dt className="tech-label">Project type</dt>
          <dd className="mt-1.5 text-sm font-medium">{type}</dd>
        </div>
        {discipline && (
          <div>
            <dt className="tech-label">Discipline</dt>
            <dd className="mt-1.5 text-sm font-medium capitalize">
              {discipline}
            </dd>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="tech-label">Location</dt>
          <dd className="mt-1.5 flex items-start gap-2 text-sm font-medium">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-subtle"
              aria-hidden="true"
            />
            {project.location}
          </dd>
        </div>
      </dl>
    </article>
  );
}
