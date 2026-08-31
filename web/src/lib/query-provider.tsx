'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min
            gcTime: 5 * 60_000, // 5 min
            retry: (count, error: unknown) => {
              // Don't retry auth or permission errors
              if (error && typeof error === 'object' && 'statusCode' in error) {
                const status = (error as { statusCode: number }).statusCode;
                if (status === 401 || status === 403 || status === 404)
                  return false;
              }
              return count < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
