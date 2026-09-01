import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-mineral-charcoal p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />

        <Link
          href="/"
          className="relative z-10 inline-flex"
          aria-label="Green Ngoria Supplies Ltd — home"
        >
          <Logo height={52} onDark />
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-display-lg font-bold text-white leading-tight">
            Mining Plant Engineering & Gold Processing Solutions
          </h2>
          <p className="text-white/60 max-w-sm leading-relaxed">
            CIP/CIL plant engineering, construction and commissioning across
            East and Central Africa since 2011.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              'CIP/CIL Plants',
              'Plant Engineering',
              'Commissioning',
              'Maintenance',
            ].map((cap) => (
              <span
                key={cap}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">
          © {new Date().getFullYear()} Green Ngoria Supplies Limited
        </p>
      </div>

      {/* Right — auth form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-10 flex lg:hidden"
            aria-label="Green Ngoria Supplies Ltd — home"
          >
            <Logo height={48} />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
