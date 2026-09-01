'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Users,
  Plus,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Key,
  UserX,
  Download,
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/input';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useOrgMembers,
  useUserDirectory,
  useAddOrgMember,
  useChangeMemberRole,
  useRemoveOrgMember,
} from '@/lib/api/hooks/use-users';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { formatRelativeDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

/**
 * "Users" in the admin console are organization members. A member row is an
 * `OrganizationMember` with its joined `user` record.
 */
interface Member {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  isOwner: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    lastLoginAt: string | null;
  };
}

interface DirectoryUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  mfaEnabled: boolean;
}

/** Matches `SystemRole` in prisma/schema.prisma. */
const SYSTEM_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'LEGAL_OFFICER',
  'PRODUCTION_MANAGER',
  'PROJECT_MANAGER',
  'MINING_ENGINEER',
  'PROCESS_ENGINEER',
  'MECHANICAL_ENGINEER',
  'ELECTRICAL_ENGINEER',
  'PROCUREMENT_OFFICER',
  'FINANCE_OFFICER',
  'HSE_OFFICER',
  'SITE_SUPERVISOR',
  'SALES_MANAGER',
  'CRM_OFFICER',
  'CUSTOMER_CARE',
  'CLIENT_ADMIN',
  'CLIENT_USER',
  'VENDOR_USER',
] as const;

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `AddMemberDto` — `userId` is `@IsUUID() @IsNotEmpty()` and `role` is
 * an optional `@IsEnum(SystemRole)`. The endpoint attaches an *existing*
 * platform user to the organization; it does not create accounts.
 */
const memberSchema = z.object({
  userId: z.string().uuid('Select a user to add'),
  role: z.string().min(1, 'Select a role'),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface RowHandlers {
  onChangeRole: (member: Member) => void;
  onRemove: (member: Member) => void;
}

function RowActions({
  member,
  handlers,
}: {
  member: Member;
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
          className="z-50 min-w-[180px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onChangeRole(member)}
          >
            <Key className="h-3.5 w-3.5" /> Change role
          </DropdownMenu.Item>
          {!member.isOwner && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
                onSelect={() => handlers.onRemove(member)}
              >
                <UserX className="h-3.5 w-3.5" /> Remove from organization
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<Member>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white text-xs font-semibold">
            {row.original.user.firstName?.[0]}
            {row.original.user.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium text-sm">
              {row.original.user.firstName} {row.original.user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Organization Role',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.role.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'isOwner',
      header: 'Owner',
      cell: ({ row }) =>
        row.original.isOwner ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" /> Owner
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldOff className="h-3.5 w-3.5" /> Member
          </span>
        ),
    },
    {
      id: 'status',
      header: 'Account Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.user.status === 'ACTIVE' ? 'success' : 'mineral'
          }
        >
          {row.original.user.status}
        </Badge>
      ),
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.user.lastLoginAt
            ? formatRelativeDate(row.original.user.lastLoginAt)
            : 'Never'}
        </span>
      ),
    },
    {
      accessorKey: 'joinedAt',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.joinedAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions member={row.original} handlers={handlers} />
      ),
    },
  ];
}

export function AdminUsersList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const { data, isLoading, isError, refetch } = useOrgMembers<Member>(orgId);
  const members = data?.data ?? [];

  const { data: directoryResponse } = useUserDirectory<DirectoryUser>({
    limit: 200,
  });
  const directory = directoryResponse?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<Member | null>(null);
  const [nextRole, setNextRole] = useState('');
  const [removing, setRemoving] = useState<Member | null>(null);

  const addMember = useAddOrgMember(orgId);
  const changeRole = useChangeMemberRole(orgId);
  const removeMember = useRemoveOrgMember(orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { userId: '', role: 'CLIENT_USER' },
  });

  // Only offer users who are not already members of this organization.
  const addableUsers = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.userId));
    return directory.filter((user) => !memberIds.has(user.id));
  }, [directory, members]);

  const openCreate = () => {
    reset({ userId: '', role: 'CLIENT_USER' });
    setDialogOpen(true);
  };

  const onSubmit = async (values: MemberFormValues) => {
    const user = directory.find((u) => u.id === values.userId);
    try {
      await addMember.mutateAsync({ userId: values.userId, role: values.role });
      toast.success('Member added', {
        description: user ? `${user.firstName} ${user.lastName}` : undefined,
      });
      setDialogOpen(false);
      reset({ userId: '', role: 'CLIENT_USER' });
    } catch (error) {
      toast.error('Could not add member', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmRoleChange = async () => {
    if (!roleTarget || !nextRole) return;
    try {
      await changeRole.mutateAsync({
        userId: roleTarget.userId,
        role: nextRole,
      });
      toast.success(`Role changed to ${nextRole.replace(/_/g, ' ')}`, {
        description: `${roleTarget.user.firstName} ${roleTarget.user.lastName}`,
      });
      setRoleTarget(null);
      setNextRole('');
    } catch (error) {
      toast.error('Could not change role', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await removeMember.mutateAsync(removing.userId);
      toast.success('Member removed', {
        description: `${removing.user.firstName} ${removing.user.lastName}`,
      });
      setRemoving(null);
    } catch (error) {
      toast.error('Could not remove member', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () =>
      buildColumns({
        onChangeRole: (member) => {
          setRoleTarget(member);
          setNextRole(member.role);
        },
        onRemove: setRemoving,
      }),
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Users"
        description="Organization membership, roles, account status and privileged access."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Add Member
            </Button>
          </div>
        }
      />

      {/* KPI Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { label: 'Total Members', value: members.length },
          {
            label: 'Active Accounts',
            value: members.filter((m) => m.user.status === 'ACTIVE').length,
          },
          {
            label: 'Owners',
            value: members.filter((m) => m.isOwner).length,
          },
          {
            label: 'Never Logged In',
            value: members.filter((m) => !m.user.lastLoginAt).length,
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

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No members yet"
          description="Add existing platform users to this organization to grant them access."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Add Member
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={members}
          searchColumn="name"
          searchPlaceholder="Search by name or email…"
        />
      )}

      {/* Add Member Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (addMember.isPending) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Attach an existing platform user to this organization. Account
              creation happens during sign-up, not here.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="member-user">User *</Label>
                <select
                  id="member-user"
                  className={selectClass}
                  {...register('userId')}
                >
                  <option value="">Select a user…</option>
                  {addableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} — {user.email}
                    </option>
                  ))}
                </select>
                {errors.userId && (
                  <p
                    className="text-xs font-medium text-destructive"
                    role="alert"
                  >
                    {errors.userId.message}
                  </p>
                )}
                {addableUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Every platform user is already a member of this
                    organization.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="member-role">Role *</Label>
                <select
                  id="member-role"
                  className={selectClass}
                  {...register('role')}
                >
                  {SYSTEM_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p
                    className="text-xs font-medium text-destructive"
                    role="alert"
                  >
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={addMember.isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                loading={addMember.isPending}
              >
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog
        open={!!roleTarget}
        onOpenChange={(open) => {
          if (changeRole.isPending) return;
          if (!open) {
            setRoleTarget(null);
            setNextRole('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change organization role</DialogTitle>
            <DialogDescription>
              {roleTarget
                ? `${roleTarget.user.firstName} ${roleTarget.user.lastName} is currently ${roleTarget.role.replace(/_/g, ' ')}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="member-next-role">New role</Label>
              <select
                id="member-next-role"
                className={selectClass}
                value={nextRole}
                onChange={(event) => setNextRole(event.target.value)}
              >
                {SYSTEM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={changeRole.isPending}
              onClick={() => {
                setRoleTarget(null);
                setNextRole('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={!nextRole || nextRole === roleTarget?.role}
              loading={changeRole.isPending}
              onClick={() => void confirmRoleChange()}
            >
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Remove this member?"
        description={
          removing ? (
            <>
              {removing.user.firstName} {removing.user.lastName} will lose
              access to this organization. Their platform account is not deleted
              and they can be re-added later.
            </>
          ) : null
        }
        confirmLabel="Remove member"
        cancelLabel="Keep member"
        loading={removeMember.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
