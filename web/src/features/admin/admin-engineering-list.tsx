'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileStack,
  Upload,
  MoreHorizontal,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useDocuments,
  useUploadDocument,
  useTransitionDocumentById,
} from '@/lib/api/hooks/use-engineering';
import { formatRelativeDate } from '@/lib/utils';
import {
  FormDialog,
  Field,
  TextField,
  TextAreaField,
  SelectField,
  apiErrorMessage,
  enumOptions,
  confirmAction,
  rowMenuContentClass,
  rowMenuItemClass,
} from './_form-kit';

interface EngineeringDocument {
  id: string;
  documentNumber: string;
  title: string;
  type: string;
  revision: string;
  status: string;
  createdAt: string;
  author?: { id: string; firstName: string; lastName: string } | null;
  project?: { id: string; projectNumber: string; name: string } | null;
}

/** Mirrors the DocumentType enum in prisma/schema.prisma. */
const DOCUMENT_TYPES = [
  'PFD',
  'PID',
  'DRAWING',
  'LAYOUT',
  'SPECIFICATION',
  'DATASHEET',
  'CALCULATION',
  'REPORT',
  'MANUAL',
  'INSPECTION_REPORT',
  'COMMISSIONING_DOC',
  'CONTRACT',
  'CERTIFICATE',
  'INVOICE',
  'QUOTATION',
  'PURCHASE_ORDER',
  'OTHER',
] as const;

/**
 * The controlled-document workflow. Controlled documents are never deleted —
 * they are superseded or archived, so those are the only "removal" actions.
 */
const NEXT_STATUSES: Record<string, string[]> = {
  DRAFT: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['REVIEWED', 'DRAFT'],
  REVIEWED: ['APPROVED', 'UNDER_REVIEW'],
  APPROVED: ['SUPERSEDED', 'ARCHIVED'],
  SUPERSEDED: ['ARCHIVED'],
  ARCHIVED: [],
};

// ─── Upload dialog ─────────────────────────────────────────────────────────

interface DocumentForm {
  documentNumber: string;
  title: string;
  type: string;
  revision: string;
  description: string;
}

const EMPTY_FORM: DocumentForm = {
  documentNumber: '',
  title: '',
  type: 'DRAWING',
  revision: 'REV_00',
  description: '',
};

function UploadDocumentDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const [form, setForm] = useState<DocumentForm>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DocumentForm | 'file', string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const uploadDocument = useUploadDocument(orgId);

  const set = <K extends keyof DocumentForm>(
    key: K,
    value: DocumentForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_FORM);
      setFile(null);
      setErrors({});
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    // Mirrors CreateDocumentDto's @IsNotEmpty fields; the controller also
    // rejects the request outright when no file part is present.
    const found: Partial<Record<keyof DocumentForm | 'file', string>> = {};
    if (!form.documentNumber.trim())
      found.documentNumber = 'Document number is required.';
    if (!form.title.trim()) found.title = 'Title is required.';
    if (!form.type) found.type = 'Type is required.';
    if (!file) found.file = 'A file is required.';
    setErrors(found);
    if (Object.keys(found).length > 0 || !file) return;
    setSubmitError(null);

    // Multipart fields are all strings; only send the optional ones when set.
    const meta: Record<string, string> = {
      documentNumber: form.documentNumber.trim(),
      title: form.title.trim(),
      type: form.type,
    };
    if (form.revision.trim()) meta.revision = form.revision.trim();
    if (form.description.trim()) meta.description = form.description.trim();

    uploadDocument.mutate(
      { file, meta },
      {
        onSuccess: () => {
          toast.success('Document uploaded as DRAFT');
          close(false);
        },
        onError: (err) => setSubmitError(apiErrorMessage(err)),
      },
    );
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Upload a controlled document"
      description="Documents enter as DRAFT and must pass through review and approval. Revisions never overwrite the original."
      submitLabel="Upload document"
      onSubmit={handleSubmit}
      pending={uploadDocument.isPending}
      error={submitError}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Document number"
          required
          value={form.documentNumber}
          error={errors.documentNumber}
          placeholder="GNG-CIP-PFD-001"
          onChange={(v) => set('documentNumber', v)}
        />
        <SelectField
          label="Type"
          required
          value={form.type}
          error={errors.type}
          options={enumOptions(DOCUMENT_TYPES)}
          onChange={(v) => set('type', v)}
        />
      </div>
      <TextField
        label="Title"
        required
        value={form.title}
        error={errors.title}
        placeholder="CIP Plant Process Flow Diagram"
        onChange={(v) => set('title', v)}
      />
      <TextField
        label="Revision"
        value={form.revision}
        hint="Defaults to REV_00 when left blank."
        onChange={(v) => set('revision', v)}
      />
      <TextAreaField
        label="Description"
        value={form.description}
        rows={3}
        onChange={(v) => set('description', v)}
      />
      <Field label="File" required error={errors.file}>
        <input
          type="file"
          aria-label="Document file"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setErrors((prev) => ({ ...prev, file: undefined }));
          }}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium"
        />
      </Field>
    </FormDialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AdminEngineeringList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } =
    useDocuments<EngineeringDocument>(orgId);
  const documents = data?.data ?? [];

  const [uploadOpen, setUploadOpen] = useState(false);
  const transitionDocument = useTransitionDocumentById(orgId);

  const handleTransition = (doc: EngineeringDocument, status: string) => {
    const destructive = status === 'ARCHIVED' || status === 'SUPERSEDED';
    if (
      destructive &&
      !confirmAction(
        `Move "${doc.documentNumber}" to ${status}? It will no longer be the current controlled revision.`,
      )
    )
      return;

    transitionDocument.mutate(
      { id: doc.id, status },
      {
        onSuccess: () => toast.success(`Document moved to ${status}`),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const columns: ColumnDef<EngineeringDocument>[] = [
    {
      accessorKey: 'documentNumber',
      header: 'Doc #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.documentNumber}
        </span>
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
      cell: ({ row }) => (
        <Badge variant="mineral" className="capitalize">
          {row.original.type.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ),
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
      id: 'author',
      header: 'Author',
      cell: ({ row }) =>
        row.original.author
          ? `${row.original.author.firstName} ${row.original.author.lastName}`
          : '—',
    },
    {
      accessorKey: 'createdAt',
      header: 'Uploaded',
      cell: ({ row }) => formatRelativeDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const doc = row.original;
        const next = NEXT_STATUSES[doc.status] ?? [];
        const pending =
          transitionDocument.isPending &&
          transitionDocument.variables?.id === doc.id;

        return (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                aria-label={`Actions for ${doc.documentNumber}`}
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className={rowMenuContentClass}
              >
                {next.length === 0 ? (
                  <DropdownMenu.Item className={rowMenuItemClass} disabled>
                    No further transitions
                  </DropdownMenu.Item>
                ) : (
                  next.map((status) => (
                    <DropdownMenu.Item
                      key={status}
                      className={rowMenuItemClass}
                      onSelect={() => handleTransition(doc, status)}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Move to {status.replace(/_/g, ' ').toLowerCase()}
                    </DropdownMenu.Item>
                  ))
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        );
      },
    },
  ];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Engineering Document Control"
        description="Controlled drawings, specifications, datasheets, revisions, transmittals and approvals."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setUploadOpen(true)}
          >
            Upload Document
          </Button>
        }
      />
      {documents.length === 0 ? (
        <EmptyState
          icon={<FileStack className="h-6 w-6" />}
          title="No documents yet"
          description="Controlled engineering documents appear here once uploaded."
          action={
            <Button
              variant="brand"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Document
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          searchColumn="title"
          searchPlaceholder="Search documents…"
        />
      )}

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        orgId={orgId}
      />
    </div>
  );
}
