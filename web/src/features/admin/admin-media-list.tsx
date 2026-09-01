'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Search,
  Pencil,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  File as FileIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useMediaAssets,
  useUploadMedia,
  useUpdateMedia,
  useDeleteMedia,
  readImageDimensions,
  type MediaAssetView,
} from '@/lib/api/hooks/use-media';
import { cn } from '@/lib/utils';
import {
  FormDialog,
  TextField,
  TextAreaField,
  apiErrorMessage,
} from './_form-kit';

const PAGE_SIZE = 24;

/** Mirrors the backend's storage guard — keep the client hint in step with it. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeIcon(mimeType: string) {
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/'))
    return FileText;
  if (mimeType.includes('zip') || mimeType.includes('compressed'))
    return FileArchive;
  return FileIcon;
}

// ─── Upload dialog ─────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [altText, setAltText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const uploadMedia = useUploadMedia(orgId);

  const pickFile = (next: File | null) => {
    setFileError(undefined);
    setSubmitError(null);
    if (next && next.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setFileError(
        `Files must be ${formatBytes(MAX_UPLOAD_BYTES)} or smaller.`,
      );
      return;
    }
    setFile(next);
    if (next && !filename.trim()) setFilename(next.name);
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setFile(null);
      setFilename('');
      setAltText('');
      setFileError(undefined);
      setSubmitError(null);
      setDragging(false);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setFileError('Choose a file to upload.');
      return;
    }
    setSubmitError(null);

    void readImageDimensions(file).then((dimensions) => {
      uploadMedia.mutate(
        {
          file,
          filename: filename.trim() || undefined,
          altText: altText.trim() || undefined,
          width: dimensions?.width,
          height: dimensions?.height,
        },
        {
          onSuccess: () => {
            toast.success(`"${filename.trim() || file.name}" uploaded`);
            close(false);
          },
          onError: (err) => setSubmitError(apiErrorMessage(err)),
        },
      );
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Upload a media asset"
      description="Images, documents and video are stored in the organization library and served through time-limited signed URLs."
      submitLabel="Upload asset"
      onSubmit={handleSubmit}
      pending={uploadMedia.isPending}
      error={submitError}
      disabled={!file}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          dragging
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-input hover:border-brand-500/50',
          fileError && 'border-destructive',
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        {file ? (
          <div className="space-y-0.5">
            <p className="font-mono text-xs font-medium">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatBytes(file.size)} · {file.type || 'unknown type'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Drag a file here, or choose one below.
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          aria-label="Media file"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploadMedia.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {file ? 'Choose a different file' : 'Choose file'}
        </Button>
        {fileError && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {fileError}
          </p>
        )}
      </div>

      <TextField
        label="Display file name"
        value={filename}
        disabled={uploadMedia.isPending}
        hint="Overrides the uploaded file's name in the library listing."
        onChange={setFilename}
      />
      <TextAreaField
        label="Alt text"
        value={altText}
        rows={2}
        disabled={uploadMedia.isPending}
        hint="Accessible description — required for images used on the public site."
        onChange={setAltText}
      />
    </FormDialog>
  );
}

// ─── Edit dialog ───────────────────────────────────────────────────────────

function EditMediaDialog({
  open,
  onOpenChange,
  orgId,
  asset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  asset: MediaAssetView;
}) {
  const [filename, setFilename] = useState(asset.filename);
  const [altText, setAltText] = useState(asset.altText ?? '');
  const [error, setError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateMedia = useUpdateMedia(orgId);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setFilename(asset.filename);
      setAltText(asset.altText ?? '');
      setError(undefined);
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    if (!filename.trim()) {
      setError('File name is required.');
      return;
    }
    setError(undefined);
    setSubmitError(null);

    updateMedia.mutate(
      {
        id: asset.id,
        data: {
          filename: filename.trim(),
          // An empty string is a legitimate "clear the alt text" instruction.
          altText: altText.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Media details updated');
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
      title="Edit media details"
      description="File name and alt text only — re-upload to replace the stored object."
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      pending={updateMedia.isPending}
      error={submitError}
    >
      <TextField
        label="File name"
        required
        value={filename}
        error={error}
        disabled={updateMedia.isPending}
        onChange={setFilename}
      />
      <TextAreaField
        label="Alt text"
        value={altText}
        rows={3}
        disabled={updateMedia.isPending}
        hint="Describe what the image shows, for screen readers and SEO."
        onChange={setAltText}
      />
    </FormDialog>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────

function MediaCard({
  asset,
  copied,
  onCopy,
  onEdit,
  onDelete,
}: {
  asset: MediaAssetView;
  copied: boolean;
  onCopy: (asset: MediaAssetView) => void;
  onEdit: (asset: MediaAssetView) => void;
  onDelete: (asset: MediaAssetView) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const isImage = asset.mimeType.startsWith('image/');
  const showThumb = isImage && !!asset.url && !imageFailed;
  const TypeIcon = isImage ? ImageIcon : fileTypeIcon(asset.mimeType);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 },
      }}
      className="glass-card group flex flex-col overflow-hidden rounded-xl"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/20">
        {showThumb ? (
          <Image
            src={asset.url as string}
            alt={asset.altText ?? asset.filename}
            fill
            unoptimized
            onError={() => setImageFailed(true)}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <TypeIcon className="h-8 w-8" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge
            variant="mineral"
            className="bg-black/60 text-[10px] text-white backdrop-blur-md"
          >
            {asset.mimeType}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p
            className="truncate font-mono text-xs font-medium"
            title={asset.filename}
          >
            {asset.filename}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatBytes(asset.sizeBytes)}
            {asset.width && asset.height
              ? ` • ${asset.width}×${asset.height}`
              : ''}
          </p>
          <p
            className={cn(
              'mt-1 truncate text-[11px]',
              asset.altText ? 'text-muted-foreground' : 'text-amber-600',
            )}
            title={asset.altText ?? undefined}
          >
            {asset.altText ?? 'No alt text set'}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={!asset.url}
            leftIcon={
              copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )
            }
            onClick={() => onCopy(asset)}
          >
            {copied ? 'Copied' : 'Copy URL'}
          </Button>
          <div className="flex items-center gap-1">
            <button
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Edit ${asset.filename}`}
              onClick={() => onEdit(asset)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
              aria-label={`Delete ${asset.filename}`}
              onClick={() => onDelete(asset)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { value: '', label: 'All types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Video' },
  { value: 'application', label: 'Documents' },
] as const;

export function AdminMediaList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const [search, setSearch] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<MediaAssetView | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaAssetView | null>(
    null,
  );

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(mimeType ? { mimeType } : {}),
    }),
    [page, search, mimeType],
  );

  const { data, isLoading, isError, refetch, isFetching } = useMediaAssets(
    orgId,
    params,
  );
  const deleteMedia = useDeleteMedia(orgId);

  const assets = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.pages ?? 1;

  const copyUrl = (asset: MediaAssetView) => {
    if (!asset.url) return;
    void navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    toast.success('Signed asset URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteMedia.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`"${pendingDelete.filename}" deleted`);
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err, 'Could not delete this asset.'));
        setPendingDelete(null);
      },
    });
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Media & Photography Library"
        description="Private and publishable site photography, plant installations, equipment assets, and statutory documents."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setUploadOpen(true)}
          >
            Upload Asset
          </Button>
        }
      />

      {/* Filter and search */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
        <div className="max-w-md flex-1">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Search by file name or alt text…"
            className="h-9 bg-muted/30"
          />
        </div>
        <div className="flex items-center gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => {
                setMimeType(filter.value);
                setPage(1);
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                mimeType === filter.value
                  ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
          {meta?.total ?? assets.length} asset
          {(meta?.total ?? assets.length) === 1 ? '' : 's'}
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-6 w-6" />}
          title={
            search || mimeType ? 'No matching assets' : 'The library is empty'
          }
          description={
            search || mimeType
              ? 'Try a different search term or file type.'
              : 'Upload site photography, plant installation records or statutory documents to get started.'
          }
          action={
            <Button
              variant="brand"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Asset
            </Button>
          }
        />
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {assets.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                copied={copiedId === asset.id}
                onCopy={copyUrl}
                onEdit={setEditing}
                onDelete={setPendingDelete}
              />
            ))}
          </motion.div>

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

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        orgId={orgId}
      />

      {editing && (
        <EditMediaDialog
          key={editing.id}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          orgId={orgId}
          asset={editing}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete "${pendingDelete?.filename ?? ''}"?`}
        description="The stored object is removed from storage and the library row is soft-deleted. Anything still referencing this asset will break."
        confirmLabel="Delete asset"
        loading={deleteMedia.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
