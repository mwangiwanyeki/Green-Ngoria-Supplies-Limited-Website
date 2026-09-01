'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Mountain,
  Plus,
  Download,
  MoreHorizontal,
  Pencil,
  MapPin,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input, Textarea, Label } from '@/components/ui/input';
import {
  useMiningSites,
  useCreateMiningSite,
  useUpdateMiningSite,
} from '@/lib/api/hooks/use-mining-sites';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact } from '@/lib/api/payload';
import { formatRelativeDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface MiningSite {
  id: string;
  name: string;
  country: string;
  county: string | null;
  coordinates: string | null;
  mineralTypes: string[];
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { projects: number; assessments: number };
}

/** Matches `MineralType` in prisma/schema.prisma. */
const MINERAL_TYPES = [
  'GOLD',
  'SILVER',
  'COPPER',
  'LEAD',
  'ZINC',
  'IRON',
  'MANGANESE',
  'CHROMITE',
  'TITANIUM',
  'COBALT',
  'NICKEL',
  'DIAMONDS',
  'GEMSTONES',
  'COAL',
  'OTHER',
] as const;

/**
 * Mirrors `CreateMiningSiteDto` — only `name` is `@IsNotEmpty()`. `mineralTypes`
 * is an `@IsEnum(MineralType, { each: true })` array, so entries must match the
 * enum exactly; the multi-select below can only produce valid values.
 */
const siteSchema = z.object({
  name: z.string().trim().min(2, 'Site name is required'),
  country: z.string().optional(),
  county: z.string().optional(),
  coordinates: z
    .string()
    .trim()
    .regex(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/, 'Use the format lat,lng')
    .optional()
    .or(z.literal('')),
  mineralTypes: z.array(z.string()).optional(),
  description: z.string().optional(),
});

type SiteFormValues = z.infer<typeof siteSchema>;

const EMPTY_SITE: SiteFormValues = {
  name: '',
  country: 'Kenya',
  county: '',
  coordinates: '',
  mineralTypes: [],
  description: '',
};

interface RowHandlers {
  onEdit: (site: MiningSite) => void;
}

function RowActions({
  site,
  handlers,
}: {
  site: MiningSite;
  handlers: RowHandlers;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[170px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onEdit(site)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit site
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<MiningSite>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Site / Location',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[row.original.county, row.original.country]
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'mineralTypes',
      header: 'Minerals',
      cell: ({ row }) =>
        row.original.mineralTypes?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.original.mineralTypes.slice(0, 3).map((mineral) => (
              <Badge key={mineral} variant="brand" className="text-[10px]">
                {mineral}
              </Badge>
            ))}
            {row.original.mineralTypes.length > 3 && (
              <Badge variant="mineral" className="text-[10px]">
                +{row.original.mineralTypes.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'coordinates',
      header: 'Coordinates',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.coordinates ?? '—'}
        </span>
      ),
    },
    {
      id: 'projects',
      header: 'Projects',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">
          {row.original._count?.projects ?? 0}
        </span>
      ),
    },
    {
      id: 'assessments',
      header: 'Assessments',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">
          {row.original._count?.assessments ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'mineral'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions site={row.original} handlers={handlers} />,
    },
  ];
}

export function AdminMiningSitesList() {
  const { data, isLoading, isError, refetch } = useMiningSites<MiningSite>({
    limit: 100,
  });
  const items = data?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MiningSite | null>(null);

  const createSite = useCreateMiningSite();
  const updateSite = useUpdateMiningSite(editing?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: EMPTY_SITE,
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_SITE);
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (!items.length) { toast.error('No data to export'); return; }
    const headers = ['Name', 'Country', 'County', 'Minerals', 'Coordinates', 'Projects', 'Assessments', 'Status'];
    const csv = [headers.join(','), ...items.map((s) => [
      s.name, s.country ?? '', s.county ?? '',
      (s.mineralTypes ?? []).join('; '),
      s.coordinates ?? '',
      s._count?.projects ?? 0,
      s._count?.assessments ?? 0,
      s.isActive ? 'Active' : 'Inactive',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mining-sites-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  };

  const openEdit = (site: MiningSite) => {
    setEditing(site);
    reset({
      name: site.name ?? '',
      country: site.country ?? 'Kenya',
      county: site.county ?? '',
      coordinates: site.coordinates ?? '',
      mineralTypes: site.mineralTypes ?? [],
      description: site.description ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: SiteFormValues) => {
    // `PATCH /mining-sites/:id` binds the full CreateMiningSiteDto, so `name`
    // always travels with the payload.
    const payload = compact({
      name: values.name.trim(),
      country: values.country,
      county: values.county,
      coordinates: values.coordinates,
      mineralTypes: values.mineralTypes?.length
        ? values.mineralTypes
        : undefined,
      description: values.description,
    });
    try {
      if (editing) {
        await updateSite.mutateAsync(payload);
        toast.success('Mining site updated', { description: values.name });
      } else {
        await createSite.mutateAsync(payload);
        toast.success('Mining site registered', { description: values.name });
      }
      setDialogOpen(false);
      setEditing(null);
      reset(EMPTY_SITE);
    } catch (error) {
      toast.error(
        editing ? 'Could not update mining site' : 'Could not register site',
        { description: getApiErrorMessage(error) },
      );
    }
  };

  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit }),
    // openEdit only closes over stable setters and `reset`.
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const saving = createSite.isPending || updateSite.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Mining Sites"
        description="First-class site records for location, mineral context, access, infrastructure and operational constraints."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Register Site
            </Button>
          </div>
        }
      />

      {/* KPI stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { label: 'Registered Sites', value: items.length },
          {
            label: 'Gold Operations',
            value: items.filter((s) => s.mineralTypes?.includes('GOLD')).length,
          },
          {
            label: 'Linked Projects',
            value: items.reduce((s, x) => s + (x._count?.projects ?? 0), 0),
          },
          {
            label: 'Linked Assessments',
            value: items.reduce((s, x) => s + (x._count?.assessments ?? 0), 0),
          },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </motion.div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Mountain className="h-6 w-6" />}
          title="No mining sites logged"
          description="Register active concession locations, ore reserves, and plant site references."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Register Site
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="name"
          searchPlaceholder="Search by site or location name…"
        />
      )}

      {/* Create / Edit Site Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Mining Site' : 'Register New Mining Site'}
            </DialogTitle>
            <DialogDescription>
              Record deposit characteristics, logistics, and site coordinates.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="site-name">Site name *</Label>
                <Input
                  id="site-name"
                  placeholder="Bondo Nyangoma"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="site-county">County / region</Label>
                  <Input
                    id="site-county"
                    placeholder="Siaya"
                    {...register('county')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="site-country">Country</Label>
                  <Input
                    id="site-country"
                    placeholder="Kenya"
                    {...register('country')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="site-coordinates">Coordinates (lat,lng)</Label>
                <Input
                  id="site-coordinates"
                  placeholder="-0.3456,34.1234"
                  {...register('coordinates')}
                  error={errors.coordinates?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="site-minerals">Minerals present</Label>
                <select
                  id="site-minerals"
                  multiple
                  size={6}
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('mineralTypes')}
                >
                  {MINERAL_TYPES.map((mineral) => (
                    <option key={mineral} value={mineral}>
                      {mineral}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Hold Ctrl / Cmd to select more than one.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="site-description">Site notes</Label>
                <Textarea
                  id="site-description"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Deposit class, access road, power and water availability…"
                  {...register('description')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setDialogOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={saving}>
                {editing ? 'Save Changes' : 'Register Site'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
