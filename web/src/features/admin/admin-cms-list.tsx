'use client';

import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileCode,
  Plus,
  MoreHorizontal,
  Pencil,
  Globe,
  CheckCircle2,
  Undo2,
  Archive,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useCmsContent,
  useCmsEntry,
  useCreateCmsContent,
  useUpdateCmsContent,
  useSetCmsStatus,
  useDeleteCmsContent,
  slugify,
  SLUG_PATTERN,
  CMS_CONTENT_TYPES,
  CMS_LABEL,
  CONTENT_STATUSES,
  type CmsContentType,
  type CmsContentView,
  type CmsContentInput,
  type ContentStatus,
} from '@/lib/api/hooks/use-cms';
import { formatRelativeDate, cn } from '@/lib/utils';
import {
  FormDialog,
  TextField,
  TextAreaField,
  SelectField,
  enumOptions,
  optionalNumber,
  apiErrorMessage,
  rowMenuContentClass,
  rowMenuItemClass,
  rowMenuDestructiveItemClass,
} from './_form-kit';

const PAGE_SIZE = 20;

// ─── Form model ────────────────────────────────────────────────────────────

interface CmsForm {
  title: string;
  slug: string;
  status: ContentStatus;
  content: string;
  excerpt: string;
  description: string;
  icon: string;
  sortOrder: string;
  client: string;
  location: string;
  mineralType: string;
  challenge: string;
  solution: string;
  outcome: string;
  category: string;
  tags: string;
  imageKey: string;
  featuredImageKey: string;
  seoTitle: string;
  seoDesc: string;
}

const EMPTY_FORM: CmsForm = {
  title: '',
  slug: '',
  status: 'DRAFT',
  content: '',
  excerpt: '',
  description: '',
  icon: '',
  sortOrder: '',
  client: '',
  location: '',
  mineralType: '',
  challenge: '',
  solution: '',
  outcome: '',
  category: '',
  tags: '',
  imageKey: '',
  featuredImageKey: '',
  seoTitle: '',
  seoDesc: '',
};

/** Coerce a value out of the untyped `extra` bag into a form-field string. */
function str(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return value.toString();
  return '';
}

function contentToText(content: unknown): string {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && Object.keys(content).length === 0)
    return '';
  return JSON.stringify(content, null, 2);
}

/**
 * Mirrors the DTO's @IsNotEmpty / @Matches rules plus the per-type required
 * fields that `CmsService.requireFields` enforces server-side.
 */
function validateCms(
  form: CmsForm,
  type: CmsContentType,
): Partial<Record<keyof CmsForm, string>> {
  const errors: Partial<Record<keyof CmsForm, string>> = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  else if (form.title.trim().length > 255)
    errors.title = 'Title must be 255 characters or fewer.';

  if (!form.slug.trim()) errors.slug = 'Slug is required.';
  else if (!SLUG_PATTERN.test(form.slug.trim()))
    errors.slug = 'Use lowercase kebab-case (e.g. my-page-title).';

  if (type === 'services' && !form.description.trim())
    errors.description = 'Services require a short description.';

  if (type === 'case-studies') {
    if (!form.challenge.trim())
      errors.challenge = 'Case studies require the challenge.';
    if (!form.solution.trim())
      errors.solution = 'Case studies require the solution.';
  }

  return errors;
}

/** Only send the columns the target type actually owns. */
function buildCmsPayload(form: CmsForm, type: CmsContentType): CmsContentInput {
  const text = (value: string) => (value.trim() ? value.trim() : undefined);

  const payload: CmsContentInput = {
    title: form.title.trim(),
    slug: form.slug.trim(),
    status: form.status,
    seoTitle: text(form.seoTitle),
    seoDesc: text(form.seoDesc),
  };

  if (form.content.trim()) payload.content = form.content.trim();

  switch (type) {
    case 'pages':
      payload.excerpt = text(form.excerpt);
      payload.featuredImageKey = text(form.featuredImageKey);
      break;
    case 'services':
      payload.description = form.description.trim();
      payload.icon = text(form.icon);
      payload.sortOrder = optionalNumber(form.sortOrder);
      payload.imageKey = text(form.imageKey);
      break;
    case 'case-studies':
      payload.client = text(form.client);
      payload.location = text(form.location);
      payload.mineralType = text(form.mineralType);
      payload.challenge = form.challenge.trim();
      payload.solution = form.solution.trim();
      payload.outcome = text(form.outcome);
      payload.imageKey = text(form.imageKey);
      break;
    case 'articles': {
      payload.excerpt = text(form.excerpt);
      payload.category = text(form.category);
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length > 0) payload.tags = tags;
      payload.imageKey = text(form.imageKey);
      break;
    }
  }

  // The backend runs `forbidNonWhitelisted`, but undefined keys are dropped by
  // JSON.stringify, so leaving them undefined is enough.
  return payload;
}

// ─── Create / edit dialog ──────────────────────────────────────────────────

function CmsDialog({
  open,
  onOpenChange,
  orgId,
  type,
  editingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  type: CmsContentType;
  editingId: string | null;
}) {
  const isEdit = !!editingId;
  const { data: detail, isLoading: loadingDetail } = useCmsEntry(
    orgId,
    type,
    editingId,
  );

  const seeded = useMemo<CmsForm>(() => {
    if (!detail) return EMPTY_FORM;
    const extra = detail.extra ?? {};
    return {
      ...EMPTY_FORM,
      title: detail.title,
      slug: detail.slug,
      status: detail.status,
      content: contentToText(detail.content),
      excerpt: detail.excerpt ?? '',
      description: str(extra.description),
      icon: str(extra.icon),
      sortOrder: str(extra.sortOrder),
      client: str(extra.client),
      location: str(extra.location),
      mineralType: str(extra.mineralType),
      challenge: str(extra.challenge),
      solution: str(extra.solution),
      outcome: str(extra.outcome),
      category: str(extra.category),
      tags: Array.isArray(extra.tags)
        ? (extra.tags as string[]).join(', ')
        : '',
      imageKey: detail.imageKey ?? '',
      featuredImageKey: detail.imageKey ?? '',
      seoTitle: detail.seoTitle ?? '',
      seoDesc: detail.seoDesc ?? '',
    };
  }, [detail]);

  const [dirty, setDirty] = useState<CmsForm | null>(null);
  const form = dirty ?? seeded;

  const [errors, setErrors] = useState<Partial<Record<keyof CmsForm, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const createContent = useCreateCmsContent(orgId, type);
  const updateContent = useUpdateCmsContent(orgId, type);
  const pending = createContent.isPending || updateContent.isPending;

  const set = <K extends keyof CmsForm>(key: K, value: CmsForm[K]) => {
    setDirty({ ...form, [key]: value });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setTitle = (value: string) => {
    // Auto-derive the slug until the author edits it themselves.
    setDirty({
      ...form,
      title: value,
      ...(slugTouched ? {} : { slug: slugify(value) }),
    });
    setErrors((e) => ({ ...e, title: undefined, slug: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setDirty(null);
      setErrors({});
      setSubmitError(null);
      setSlugTouched(isEdit);
    }
  };

  const handleSubmit = () => {
    const found = validateCms(form, type);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    const payload = buildCmsPayload(form, type);

    if (isEdit && editingId) {
      updateContent.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success(`${CMS_LABEL[type]} updated`);
            close(false);
          },
          onError: (err) => setSubmitError(apiErrorMessage(err)),
        },
      );
      return;
    }

    createContent.mutate(payload, {
      onSuccess: () => {
        toast.success(`${CMS_LABEL[type]} created`);
        close(false);
      },
      onError: (err) => setSubmitError(apiErrorMessage(err)),
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={
        isEdit
          ? `Edit ${CMS_LABEL[type].toLowerCase()}`
          : `New ${CMS_LABEL[type].toLowerCase()}`
      }
      description="Publishing stamps the live date; drafts stay hidden from the public site."
      submitLabel={isEdit ? 'Save changes' : 'Create'}
      onSubmit={handleSubmit}
      pending={pending}
      error={submitError}
      disabled={isEdit && loadingDetail}
      className="sm:max-w-2xl"
    >
      {isEdit && loadingDetail ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading content…
        </div>
      ) : (
        <>
          <TextField
            label="Title"
            required
            value={form.title}
            error={errors.title}
            disabled={pending}
            placeholder="Bondo Carbon-In-Leach Optimisation"
            onChange={setTitle}
          />
          <TextField
            label="URL slug"
            required
            value={form.slug}
            error={errors.slug}
            disabled={pending}
            hint="Lowercase kebab-case. Must be unique within this content type."
            placeholder="bondo-carbon-in-leach-optimisation"
            onChange={(v) => {
              setSlugTouched(true);
              set('slug', v);
            }}
          />

          <SelectField
            label="Status"
            value={form.status}
            disabled={pending}
            options={enumOptions(CONTENT_STATUSES)}
            onChange={(v) => set('status', v as ContentStatus)}
          />

          {type === 'services' && (
            <>
              <TextAreaField
                label="Description"
                required
                rows={2}
                value={form.description}
                error={errors.description}
                disabled={pending}
                placeholder="Turnkey CIP/CIL plant design, fabrication and commissioning."
                onChange={(v) => set('description', v)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Icon identifier"
                  value={form.icon}
                  disabled={pending}
                  placeholder="factory"
                  onChange={(v) => set('icon', v)}
                />
                <TextField
                  label="Sort order"
                  type="number"
                  value={form.sortOrder}
                  disabled={pending}
                  onChange={(v) => set('sortOrder', v)}
                />
              </div>
            </>
          )}

          {type === 'case-studies' && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="Client"
                  value={form.client}
                  disabled={pending}
                  onChange={(v) => set('client', v)}
                />
                <TextField
                  label="Location"
                  value={form.location}
                  disabled={pending}
                  placeholder="Bondo, Siaya"
                  onChange={(v) => set('location', v)}
                />
                <TextField
                  label="Mineral type"
                  value={form.mineralType}
                  disabled={pending}
                  placeholder="Gold"
                  onChange={(v) => set('mineralType', v)}
                />
              </div>
              <TextAreaField
                label="Challenge"
                required
                rows={2}
                value={form.challenge}
                error={errors.challenge}
                disabled={pending}
                onChange={(v) => set('challenge', v)}
              />
              <TextAreaField
                label="Solution"
                required
                rows={2}
                value={form.solution}
                error={errors.solution}
                disabled={pending}
                onChange={(v) => set('solution', v)}
              />
              <TextAreaField
                label="Outcome"
                rows={2}
                value={form.outcome}
                disabled={pending}
                onChange={(v) => set('outcome', v)}
              />
            </>
          )}

          {type === 'articles' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Category"
                value={form.category}
                disabled={pending}
                placeholder="Process engineering"
                onChange={(v) => set('category', v)}
              />
              <TextField
                label="Tags"
                value={form.tags}
                disabled={pending}
                hint="Comma-separated."
                placeholder="gold, cil, recovery"
                onChange={(v) => set('tags', v)}
              />
            </div>
          )}

          {(type === 'pages' || type === 'articles') && (
            <TextAreaField
              label="Excerpt"
              rows={2}
              value={form.excerpt}
              disabled={pending}
              hint="Short summary shown in listings."
              onChange={(v) => set('excerpt', v)}
            />
          )}

          <TextAreaField
            label="Body content"
            rows={6}
            value={form.content}
            disabled={pending}
            hint="Stored as JSON — plain text is accepted."
            onChange={(v) => set('content', v)}
          />

          <TextField
            label={
              type === 'pages' ? 'Hero image storage key' : 'Image storage key'
            }
            value={type === 'pages' ? form.featuredImageKey : form.imageKey}
            disabled={pending}
            hint="Storage key of an asset in the media library."
            onChange={(v) =>
              set(type === 'pages' ? 'featuredImageKey' : 'imageKey', v)
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="SEO title"
              value={form.seoTitle}
              disabled={pending}
              onChange={(v) => set('seoTitle', v)}
            />
            <TextField
              label="SEO description"
              value={form.seoDesc}
              disabled={pending}
              onChange={(v) => set('seoDesc', v)}
            />
          </div>
        </>
      )}
    </FormDialog>
  );
}

// ─── Row actions ───────────────────────────────────────────────────────────

function RowActions({
  item,
  onEdit,
  onSetStatus,
  onDelete,
}: {
  item: CmsContentView;
  onEdit: (item: CmsContentView) => void;
  onSetStatus: (item: CmsContentView, status: ContentStatus) => void;
  onDelete: (item: CmsContentView) => void;
}) {
  const isPublished = item.status === 'PUBLISHED';
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className={rowMenuContentClass}
        >
          <DropdownMenu.Item
            className={rowMenuItemClass}
            onSelect={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit content
          </DropdownMenu.Item>
          {isPublished ? (
            <DropdownMenu.Item
              className={rowMenuItemClass}
              onSelect={() => onSetStatus(item, 'DRAFT')}
            >
              <Undo2 className="h-3.5 w-3.5" /> Unpublish
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className={cn(
                rowMenuItemClass,
                'text-emerald-600 hover:bg-emerald-500/10',
              )}
              onSelect={() => onSetStatus(item, 'PUBLISHED')}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
            </DropdownMenu.Item>
          )}
          {item.status !== 'ARCHIVED' && (
            <DropdownMenu.Item
              className={rowMenuItemClass}
              onSelect={() => onSetStatus(item, 'ARCHIVED')}
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            className={rowMenuDestructiveItemClass}
            onSelect={() => onDelete(item)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['', ...CONTENT_STATUSES] as const;

export function AdminCmsList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const [type, setType] = useState<CmsContentType>('articles');
  const [status, setStatus] = useState<'' | ContentStatus>('');
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CmsContentView | null>(
    null,
  );

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(status ? { status } : {}),
    }),
    [page, status],
  );

  const { data, isLoading, isError, refetch, isFetching } = useCmsContent(
    orgId,
    type,
    params,
  );
  const setCmsStatus = useSetCmsStatus(orgId, type);
  const deleteContent = useDeleteCmsContent(orgId, type);

  const items = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.pages ?? 1;

  const switchType = (next: CmsContentType) => {
    setType(next);
    setPage(1);
  };

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CmsContentView) => {
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const changeStatus = (item: CmsContentView, next: ContentStatus) => {
    setCmsStatus.mutate(
      { id: item.id, status: next },
      {
        onSuccess: () => toast.success(`"${item.title}" moved to ${next}`),
        onError: (err) =>
          toast.error(apiErrorMessage(err, 'Could not change the status.')),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteContent.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`"${pendingDelete.title}" deleted`);
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err, 'Could not delete this entry.'));
        setPendingDelete(null);
      },
    });
  };

  const columns = useMemo<ColumnDef<CmsContentView>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="font-mono text-xs text-muted-foreground">
              /{row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'excerpt',
        header: 'Summary',
        cell: ({ row }) => (
          <p className="max-w-sm truncate text-xs text-muted-foreground">
            {row.original.excerpt ?? '—'}
          </p>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'publishedAt',
        header: 'Published',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.publishedAt
              ? formatRelativeDate(row.original.publishedAt)
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            item={row.original}
            onEdit={openEdit}
            onSetStatus={changeStatus}
            onDelete={setPendingDelete}
          />
        ),
      },
    ],
    // `changeStatus` closes over the type-scoped status mutation.
    [type, setCmsStatus],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const publishedCount = items.filter((i) => i.status === 'PUBLISHED').length;
  const draftCount = items.filter((i) => i.status === 'DRAFT').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Content Management System (CMS)"
        description="Public website pages, mining capability showcase, case studies, and technical publications."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Globe className="h-4 w-4" />}
              onClick={() => window.open('/', '_blank', 'noopener')}
            >
              View Live Site
            </Button>
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              New {CMS_LABEL[type].toLowerCase()}
            </Button>
          </div>
        }
      />

      {/* Content type + status filters */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {CMS_CONTENT_TYPES.map((value) => (
            <button
              key={value}
              onClick={() => switchType(value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                type === value
                  ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {CMS_LABEL[value]}s
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <select
            value={status}
            aria-label="Status filter"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            onChange={(e) => {
              setStatus(e.target.value as '' | ContentStatus);
              setPage(1);
            }}
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value || 'all'} value={value}>
                {value || 'All statuses'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI stats — derived from the loaded page of results. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          {
            label: `Total ${CMS_LABEL[type]}s`,
            value: meta?.total ?? items.length,
          },
          { label: 'Published (this page)', value: publishedCount },
          { label: 'Drafts (this page)', value: draftCount },
          { label: 'Pages of results', value: totalPages },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </motion.div>

      {items.length === 0 ? (
        <EmptyState
          icon={<FileCode className="h-6 w-6" />}
          title={`No ${CMS_LABEL[type].toLowerCase()}s yet`}
          description="Manage public portal articles, Bondo case studies, and gold CIP/CIL technical insights."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              New {CMS_LABEL[type].toLowerCase()}
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            searchColumn="title"
            searchPlaceholder={`Search ${CMS_LABEL[type].toLowerCase()}s…`}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {meta?.page ?? page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {dialogOpen && (
        <CmsDialog
          key={`${type}:${editingId ?? 'new'}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          orgId={orgId}
          type={type}
          editingId={editingId}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete "${pendingDelete?.title ?? ''}"?`}
        description="This removes the entry from the CMS. Any public page linking to its slug will 404."
        confirmLabel="Delete"
        loading={deleteContent.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
