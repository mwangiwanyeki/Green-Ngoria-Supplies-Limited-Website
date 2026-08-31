import type { Metadata } from 'next';
import { Sora, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/lib/query-provider';
import { AuthInitializer } from '@/components/auth-initializer';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

/**
 * Display voice: Sora — geometric, engineered, tight at large sizes.
 * Body: Plus Jakarta Sans. Data/measurement: IBM Plex Mono.
 */
const display = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Green Ngoria Supplies Limited',
    template: '%s | Green Ngoria Supplies Limited',
  },
  description:
    'Gold and gemstone mining, building works, road construction, water projects, mechanical and electrical services, oil and petroleum, timber importation and general supplies across East and Central Africa.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.greenngoriasupplies.com',
  ),
  openGraph: {
    type: 'website',
    siteName: 'Green Ngoria Supplies Limited',
    locale: 'en_KE',
    images: ['/brand/green-ngoria-logo.png'],
  },
  icons: {
    icon: '/brand/green-ngoria-mark.png',
    shortcut: '/brand/green-ngoria-mark.png',
    apple: '/brand/green-ngoria-mark.png',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-background font-body antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthInitializer />
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast: 'font-body text-sm',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
