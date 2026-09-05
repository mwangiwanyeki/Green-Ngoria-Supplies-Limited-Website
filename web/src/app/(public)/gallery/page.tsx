import type { Metadata } from 'next';
import { Camera } from 'lucide-react';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { GalleryGrid } from '@/components/marketing/gallery-grid';
import { EmptyState } from '@/components/ui/page-header';
import { galleryImages } from '@/config/gallery';
import { company } from '@/config/company';

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photographs from Green Ngoria Supplies Limited — gold mining, CIP/CIL processing plants, equipment installation and project sites across East and Central Africa.',
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        title="Gallery"
        lead={[
          'Photographs from our mines, gold processing plants, equipment installations and project sites.',
          'A visual record of work delivered across Kenya, Tanzania and the wider East and Central Africa region.',
        ]}
        primaryAction={{ label: 'Request a quotation', href: '/request-rfq' }}
        secondaryAction={{ label: 'Completed projects', href: '/projects' }}
        facts={[
          { term: 'Photographs', value: String(galleryImages.length) },
          { term: 'Operations', value: 'Bondo & Taita Taveta' },
          { term: 'Focus', value: 'Mining · Processing · Installation' },
        ]}
      />

      <Section labelledBy="gallery-heading">
        <SectionIntro
          id="gallery-heading"
          title="On site with Green Ngoria"
          lead="Click any photograph to view it full-size. Use the arrow keys or on-screen controls to move through the collection."
          align="stack"
        />
        <div className="mt-12">
          {galleryImages.length > 0 ? (
            <GalleryGrid images={galleryImages} />
          ) : (
            <EmptyState
              icon={<Camera className="h-6 w-6" />}
              title="Photographs are being prepared"
              description={`Our latest gallery is being optimised for the web. In the meantime, contact ${company.customerCare.email} for project photography.`}
            />
          )}
        </div>
      </Section>
    </>
  );
}
