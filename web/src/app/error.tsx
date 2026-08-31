'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page rendering failed', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-5 font-display text-3xl font-bold">
          We could not load this page
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your data was not submitted again. Retry the request, or return later
          if the service remains unavailable.
        </p>
        <Button className="mt-7" variant="brand" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
