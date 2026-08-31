'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Files, Download, Loader2 } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useDocuments,
  useDocumentDownloadUrl,
} from '@/lib/api/hooks/use-engineering';
import { formatDate } from '@/lib/utils';

interface EngineeringDocument {
  id: string;
  documentNumber: string;
  title: string;
  type: string;
  status: string;
  revision: string;
  createdAt: string;
}

function formatLabel(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function DocumentDownloadButton({
  orgId,
  documentId,
}: {
  orgId: string;
  documentId: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const { refetch } = useDocumentDownloadUrl(orgId, documentId);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await refetch();
      const url = result.data?.url;
      if (url && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={downloading}
      onClick={() => void handleDownload()}
      leftIcon={
        downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )
      }
    >
      Download
    </Button>
  );
}

export function PortalDocumentsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useDocuments(orgId);
  const documents = (data?.data ?? []) as EngineeringDocument[];

  const columns: ColumnDef<EngineeringDocument>[] = [
    {
      accessorKey: 'documentNumber',
      header: 'Document #',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.documentNumber}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => formatLabel(row.original.type),
    },
    {
      accessorKey: 'revision',
      header: 'Revision',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.revision}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Uploaded',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DocumentDownloadButton orgId={orgId} documentId={row.original.id} />
      ),
    },
  ];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Project Documents"
        description="Controlled project documents released to your organization — drawings, specifications, reports and datasheets."
      />
      {documents.length === 0 ? (
        <EmptyState
          icon={<Files className="h-6 w-6" />}
          title="No documents yet"
          description="Controlled documents will appear here once released to your organization."
        />
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          searchColumn="title"
          searchPlaceholder="Search documents…"
        />
      )}
    </div>
  );
}
