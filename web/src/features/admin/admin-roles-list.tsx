'use client';

import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Shield,
  ShieldCheck,
  Users,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  groupPermissionsByResource,
  type RoleView,
} from '@/lib/api/hooks/use-roles';
import { cn } from '@/lib/utils';
import {
  FormDialog,
  TextField,
  TextAreaField,
  CheckboxField,
  Field,
  apiErrorMessage,
  rowMenuContentClass,
  rowMenuItemClass,
  rowMenuDestructiveItemClass,
} from './_form-kit';

// ─── Permission picker ─────────────────────────────────────────────────────

function PermissionPicker({
  orgId,
  selected,
  onToggle,
  onToggleResource,
  disabled,
  error,
}: {
  orgId: string;
  selected: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onToggleResource: (ids: string[], checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}) {
  const { data: permissions, isLoading, isError } = usePermissions(orgId);
  const groups = useMemo(
    () => groupPermissionsByResource(permissions),
    [permissions],
  );

  if (isLoading) {
    return (
      <Field label="Permissions">
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      </Field>
    );
  }

  if (isError) {
    return (
      <Field
        label="Permissions"
        error="Could not load the permission catalogue."
      >
        <span />
      </Field>
    );
  }

  if (groups.length === 0) {
    return (
      <Field
        label="Permissions"
        hint="No permissions have been seeded for this deployment yet."
      >
        <span />
      </Field>
    );
  }

  return (
    <Field
      label={`Permissions (${selected.size} selected)`}
      error={error}
      hint="Grouped by the resource each permission acts on."
    >
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-input p-3">
        {groups.map((group) => {
          const ids = group.permissions.map((p) => p.id);
          const allChecked = ids.every((id) => selected.has(id));
          return (
            <div key={group.resource} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.resource.replace(/[-_]/g, ' ')}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleResource(ids, !allChecked)}
                  className="text-[11px] font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
                >
                  {allChecked ? 'Clear all' : 'Select all'}
                </button>
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                {group.permissions.map((permission) => (
                  <CheckboxField
                    key={permission.id}
                    label={permission.action}
                    checked={selected.has(permission.id)}
                    disabled={disabled}
                    onChange={(checked) => onToggle(permission.id, checked)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Field>
  );
}

// ─── Create / edit dialog ──────────────────────────────────────────────────

interface RoleForm {
  name: string;
  displayName: string;
  description: string;
  permissionIds: Set<string>;
}

const EMPTY_ROLE: RoleForm = {
  name: '',
  displayName: '',
  description: '',
  permissionIds: new Set<string>(),
};

function formFromRole(role: RoleView): RoleForm {
  return {
    name: role.name,
    displayName: role.displayName,
    description: role.description ?? '',
    permissionIds: new Set(role.permissions.map((p) => p.id)),
  };
}

/** Client-side mirror of CreateRoleDto's @IsNotEmpty / @Matches rules. */
function validateRole(
  form: RoleForm,
  isEdit: boolean,
): Partial<Record<keyof RoleForm, string>> {
  const errors: Partial<Record<keyof RoleForm, string>> = {};
  if (!isEdit) {
    if (!form.name.trim()) errors.name = 'Machine name is required.';
    else if (!/^[A-Z][A-Z0-9_]*$/.test(form.name.trim()))
      errors.name = 'Use UPPER_SNAKE_CASE (e.g. PLANT_AUDITOR).';
    else if (form.name.trim().length > 64)
      errors.name = 'Machine name must be 64 characters or fewer.';
  }
  if (!form.displayName.trim())
    errors.displayName = 'Display name is required.';
  else if (form.displayName.trim().length > 120)
    errors.displayName = 'Display name must be 120 characters or fewer.';
  if (form.description.trim().length > 500)
    errors.description = 'Description must be 500 characters or fewer.';
  return errors;
}

function RoleDialog({
  open,
  onOpenChange,
  orgId,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  /** Present when editing an existing custom role. */
  role: RoleView | null;
}) {
  const isEdit = !!role;
  const [form, setForm] = useState<RoleForm>(
    role ? formFromRole(role) : EMPTY_ROLE,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof RoleForm, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createRole = useCreateRole(orgId);
  const updateRole = useUpdateRole(orgId);
  const pending = createRole.isPending || updateRole.isPending;

  const set = <K extends keyof RoleForm>(key: K, value: RoleForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const togglePermission = (id: string, checked: boolean) => {
    setForm((f) => {
      const next = new Set(f.permissionIds);
      if (checked) next.add(id);
      else next.delete(id);
      return { ...f, permissionIds: next };
    });
  };

  const toggleResource = (ids: string[], checked: boolean) => {
    setForm((f) => {
      const next = new Set(f.permissionIds);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return { ...f, permissionIds: next };
    });
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(role ? formFromRole(role) : EMPTY_ROLE);
      setErrors({});
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    const found = validateRole(form, isEdit);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    const description = form.description.trim();
    const permissionIds = [...form.permissionIds];

    if (isEdit && role) {
      updateRole.mutate(
        {
          id: role.id,
          data: {
            displayName: form.displayName.trim(),
            ...(description ? { description } : {}),
            permissionIds,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Role "${form.displayName.trim()}" updated`);
            close(false);
          },
          onError: (err) => setSubmitError(apiErrorMessage(err)),
        },
      );
      return;
    }

    createRole.mutate(
      {
        name: form.name.trim(),
        displayName: form.displayName.trim(),
        ...(description ? { description } : {}),
        ...(permissionIds.length > 0 ? { permissionIds } : {}),
      },
      {
        onSuccess: () => {
          toast.success(`Role "${form.displayName.trim()}" created`);
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
      title={isEdit ? `Edit ${role?.displayName}` : 'Create a custom role'}
      description={
        isEdit
          ? "A role's machine name is immutable — permissions, guards and audit records reference it."
          : 'Custom roles sit alongside the built-in system roles, which cannot be modified.'
      }
      submitLabel={isEdit ? 'Save changes' : 'Create role'}
      onSubmit={handleSubmit}
      pending={pending}
      error={submitError}
      className="sm:max-w-2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Machine name"
          required={!isEdit}
          value={form.name}
          error={errors.name}
          disabled={isEdit || pending}
          placeholder="PLANT_AUDITOR"
          hint={isEdit ? 'Immutable once created.' : 'UPPER_SNAKE_CASE.'}
          onChange={(v) =>
            set('name', v.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))
          }
        />
        <TextField
          label="Display name"
          required
          value={form.displayName}
          error={errors.displayName}
          disabled={pending}
          placeholder="Plant Auditor"
          onChange={(v) => set('displayName', v)}
        />
      </div>
      <TextAreaField
        label="Description"
        value={form.description}
        error={errors.description}
        disabled={pending}
        placeholder="Read-only access to plant assessments and commissioning evidence."
        onChange={(v) => set('description', v)}
      />
      <PermissionPicker
        orgId={orgId}
        selected={form.permissionIds}
        disabled={pending}
        onToggle={togglePermission}
        onToggleResource={toggleResource}
      />
    </FormDialog>
  );
}

// ─── Row actions ───────────────────────────────────────────────────────────

function RowActions({
  role,
  isSuperAdmin,
  onEdit,
  onDelete,
}: {
  role: RoleView;
  isSuperAdmin: boolean;
  onEdit: (role: RoleView) => void;
  onDelete: (role: RoleView) => void;
}) {
  // System roles are immutable server-side — offer no controls at all.
  if (role.isSystem) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
        title="Built-in system roles cannot be modified"
      >
        <Lock className="h-3 w-3" /> Locked
      </span>
    );
  }

  // Non-super-admin users have read-only access to custom roles
  if (!isSuperAdmin) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
        title="Only Super Administrators can edit or delete roles"
      >
        <Lock className="h-3 w-3" /> Read-only
      </span>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Role actions"
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
            onSelect={() => onEdit(role)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit role
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={rowMenuDestructiveItemClass}
            onSelect={() => onDelete(role)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete role
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export function AdminRolesList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';
  const isSuperAdmin = me?.roles?.includes('SUPER_ADMIN') ?? false;

  const { data: roles, isLoading, isError, refetch } = useRoles(orgId);
  const deleteRole = useDeleteRole(orgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RoleView | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RoleView | null>(null);

  const items = roles ?? [];
  const systemCount = items.filter((r) => r.isSystem).length;

  const openCreate = () => {
    if (!isSuperAdmin) return;
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (role: RoleView) => {
    if (!isSuperAdmin) return;
    setEditing(role);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!isSuperAdmin || !pendingDelete) return;
    deleteRole.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`Role "${pendingDelete.displayName}" deleted`);
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err, 'Could not delete this role.'));
        setPendingDelete(null);
      },
    });
  };

  const columns = useMemo<ColumnDef<RoleView>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'Role',
        cell: ({ row }) => (
          <div className="flex items-start gap-2.5">
            <div
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                row.original.isSystem
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                  : 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
              )}
            >
              {row.original.isSystem ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <Shield className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{row.original.displayName}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {row.original.name}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            {row.original.description ?? '—'}
          </p>
        ),
      },
      {
        accessorKey: 'permissionCount',
        header: 'Permissions',
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[10px]">
            {row.original.permissionCount}
          </Badge>
        ),
      },
      {
        accessorKey: 'userCount',
        header: 'Users',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {row.original.userCount}
          </span>
        ),
      },
      {
        id: 'kind',
        header: 'Type',
        cell: ({ row }) =>
          row.original.isSystem ? (
            <Badge variant="mineral" className="text-[10px]">
              System
            </Badge>
          ) : (
            <Badge variant="brand" className="text-[10px]">
              Custom
            </Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            role={row.original}
            isSuperAdmin={isSuperAdmin}
            onEdit={openEdit}
            onDelete={setPendingDelete}
          />
        ),
      },
    ],
    [isSuperAdmin],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Least-privilege access policies for commercial, engineering, finance, HSE and client users."
        badge={
          <Badge variant="mineral" className="text-[10px]">
            {systemCount} system · {items.length - systemCount} custom
          </Badge>
        }
        actions={
          isSuperAdmin ? (
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              New role
            </Button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="No roles defined"
          description="Built-in system roles are seeded with the database. Create a custom role to grant a tailored permission set."
          action={
            isSuperAdmin ? (
              <Button
                variant="brand"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openCreate}
              >
                New role
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="displayName"
          searchPlaceholder="Search roles…"
        />
      )}

      {dialogOpen && isSuperAdmin && (
        <RoleDialog
          // Remount on target change so the form state seeds from the right role.
          key={editing?.id ?? 'new'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          orgId={orgId}
          role={editing}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete && isSuperAdmin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete "${pendingDelete?.displayName ?? ''}"?`}
        description="This permanently removes the role and its permission grants. Roles that still have users assigned cannot be deleted."
        confirmLabel="Delete role"
        loading={deleteRole.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
