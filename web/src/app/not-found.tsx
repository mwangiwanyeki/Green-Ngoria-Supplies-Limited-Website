import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const destinations = [
  {
    label: 'Service divisions',
    href: '/services',
    description: 'All ten divisions, from gold mining to general supplies',
  },
  {
    label: 'About Green Ngoria',
    href: '/about',
    description: 'Background, vision, mission, values and growth strategy',
  },
  {
    label: 'Gold processing & operations',
    href: '/gold-processing',
    description: 'The Bondo plant and our mining sites',
  },
  {
    label: 'Completed projects',
    href: '/projects',
    description: 'Delivered work in Rwanda and Burundi',
  },
  {
    label: 'Certifications & compliance',
    href: '/certifications',
    description: 'ISO, OHSAS, registration, permits and approvals',
  },
  {
    label: 'Request an RFQ',
    href: '/request-rfq',
    description: 'Send us a scope and we will come back with a quotation',
  },
];

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center bg-background px-4 py-24">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <SearchX className="mx-auto h-12 w-12 text-brand-500" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            404 · Page not found
          </p>
          <h1 className="mt-3 font-display text-display-md font-bold">
            We couldn&rsquo;t find that page
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
            The address may have changed, or the page may never have existed.
            Here is where most people are heading.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {destinations.map((destination) => (
            <li key={destination.href}>
              <Link
                href={destination.href}
                className="group flex h-full items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-brand-500/40"
              >
                <div>
                  <span className="font-display font-semibold">
                    {destination.label}
                  </span>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {destination.description}
                  </p>
                </div>
                <ArrowRight
                  className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button variant="brand">Return home</Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline">Contact us</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
