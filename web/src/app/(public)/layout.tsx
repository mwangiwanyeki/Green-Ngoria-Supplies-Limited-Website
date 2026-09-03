import { Suspense } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { WebAnalyticsTracker } from '@/components/analytics/web-analytics-tracker';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* First-party page-view tracker (uses useSearchParams → needs Suspense). */}
      <Suspense fallback={null}>
        <WebAnalyticsTracker />
      </Suspense>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
