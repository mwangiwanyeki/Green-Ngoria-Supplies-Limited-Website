import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6 py-20 text-center">
      <div>
        <ShieldX className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-5 tech-label">Access restricted</p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Your account cannot open this workspace
        </h1>
        <p className="mt-4 text-muted-foreground">
          The page belongs to a different Green Ngoria role or organization.
          Contact an administrator if your responsibilities have changed.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/">
            <Button variant="outline">Public website</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="brand">Sign in again</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
