'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  LifeBuoy,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  MessageSquare,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, Badge } from '@/components/ui/badge';
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
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useTickets,
  useCreateTicket,
  useAssignTicket,
  useResolveTicketById,
  useAddTicketMessageById,
} from '@/lib/api/hooks/use-support';
import { useClients } from '@/lib/api/hooks/use-clients';
import { useUserDirectory } from '@/lib/api/hooks/use-users';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact } from '@/lib/api/payload';
import { formatRelativeDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string | null;
  status: string;
  priority: string;
  clientId: string | null;
  assignedToId: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  clientUser?: { id: string; firstName: string; lastName: string } | null;
}

interface ClientOption {
  id: string;
  companyName: string;
}

interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Matches `SupportTicketPriority` in prisma/schema.prisma. */
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

/** Matches the documented `category` values on `CreateTicketDto`. */
const CATEGORIES = [
  'TECHNICAL',
  'SPARE_PARTS',
  'WARRANTY',
  'GENERAL',
  'EMERGENCY',
] as const;

const CLOSED_STATUSES = ['RESOLVED', 'CLOSED'];

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateTicketDto` — `subject` and `description` are `@IsNotEmpty()`;
 * `clientId` is an optional `@IsUUID()`, `category` an optional string and
 * `priority` an optional `@IsEnum(SupportTicketPriority)`.
 */
const ticketSchema = z.object({
  subject: z.string().trim().min(3, 'Give the ticket a subject'),
  description: z.string().trim().min(5, 'Describe the reported issue'),
  clientId: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

const EMPTY_TICKET: TicketFormValues = {
  subject: '',
  description: '',
  clientId: '',
  category: 'TECHNICAL',
  priority: 'MEDIUM',
};

interface RowHandlers {
  onAssign: (ticket: Ticket) => void;
  onReply: (ticket: Ticket) => void;
  onResolve: (ticket: Ticket) => void;
}

function RowActions({
  item,
  handlers,
}: {
  item: Ticket;
  handlers: RowHandlers;
}) {
  const isClosed = CLOSED_STATUSES.includes(item.status);
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
          <DropdownMenu.Item asChild>
            <Link
              href={`/admin/support/${item.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> View conversation
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onAssign(item)}
          >
            <UserPlus className="h-3.5 w-3.5" /> Assign engineer
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onReply(item)}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Add message
          </DropdownMenu.Item>
          {!isClosed && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-600 outline-none cursor-pointer hover:bg-emerald-500/10"
                onSelect={() => handlers.onResolve(item)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Resolve ticket
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<Ticket>[] {
  return [
    {
      accessorKey: 'ticketNumber',
      header: 'Ticket #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.ticketNumber}
        </span>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.subject}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[240px]">
            {row.original.description}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {(row.original.category ?? 'GENERAL').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.priority === 'CRITICAL'
              ? 'destructive'
              : row.original.priority === 'HIGH'
                ? 'warning'
                : 'outline'
          }
        >
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'assignedTo',
      header: 'Engineer Assigned',
      cell: ({ row }) =>
        row.original.assignedToId ? 'Assigned' : 'Unassigned',
    },
    {
      accessorKey: 'createdAt',
      header: 'Opened',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions item={row.original} handlers={handlers} />,
    },
  ];
}

export function AdminSupportList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const { data, isLoading, isError, refetch } = useTickets(orgId);
  const items = (data?.data ?? []) as unknown as Ticket[];

  const { data: clientsResponse } = useClients<ClientOption>(orgId, {
    limit: 200,
  });
  const clients = clientsResponse?.data ?? [];

  const { data: directoryResponse } = useUserDirectory<DirectoryUser>({
    limit: 200,
  });
  const engineers = directoryResponse?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState<Ticket | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [replying, setReplying] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [resolving, setResolving] = useState<Ticket | null>(null);
  const [resolution, setResolution] = useState('');

  const createTicket = useCreateTicket(orgId);
  const assignTicket = useAssignTicket(orgId, assigning?.id ?? '');
  const resolveTicket = useResolveTicketById(orgId);
  const addMessage = useAddTicketMessageById(orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: EMPTY_TICKET,
  });

  const openCreate = () => {
    reset(EMPTY_TICKET);
    setDialogOpen(true);
  };

  const onSubmit = async (values: TicketFormValues) => {
    try {
      await createTicket.mutateAsync(
        compact({
          subject: values.subject.trim(),
          description: values.description.trim(),
          clientId: values.clientId,
          category: values.category,
          priority: values.priority,
        }),
      );
      toast.success('Ticket created', { description: values.subject });
      setDialogOpen(false);
      reset(EMPTY_TICKET);
    } catch (error) {
      toast.error('Could not create ticket', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmAssign = async () => {
    if (!assigning || !assigneeId) return;
    try {
      await assignTicket.mutateAsync(assigneeId);
      toast.success('Ticket assigned', {
        description: assigning.ticketNumber,
      });
      setAssigning(null);
      setAssigneeId('');
    } catch (error) {
      toast.error('Could not assign ticket', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmReply = async () => {
    if (!replying || !replyText.trim()) return;
    try {
      await addMessage.mutateAsync({
        id: replying.id,
        message: replyText.trim(),
        isInternal: replyInternal,
      });
      toast.success('Message added', { description: replying.ticketNumber });
      setReplying(null);
      setReplyText('');
      setReplyInternal(false);
    } catch (error) {
      toast.error('Could not add message', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmResolve = async () => {
    if (!resolving || !resolution.trim()) return;
    try {
      await resolveTicket.mutateAsync({
        id: resolving.id,
        resolution: resolution.trim(),
      });
      toast.success('Ticket resolved', { description: resolving.ticketNumber });
      setResolving(null);
      setResolution('');
    } catch (error) {
      toast.error('Could not resolve ticket', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () =>
      buildColumns({
        onAssign: (ticket) => {
          setAssigning(ticket);
          setAssigneeId(ticket.assignedToId ?? '');
        },
        onReply: (ticket) => {
          setReplying(ticket);
          setReplyText('');
          setReplyInternal(false);
        },
        onResolve: (ticket) => {
          setResolving(ticket);
          setResolution('');
        },
      }),
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="After-Sales Technical Support"
        description="Prioritized client tickets, plant operational inquiries, and engineering response dispatch."
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
              Open Ticket
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
          { label: 'Total Tickets', value: items.length },
          {
            label: 'Open / Pending',
            value: items.filter((t) => !CLOSED_STATUSES.includes(t.status))
              .length,
          },
          {
            label: 'Critical Plant Issues',
            value: items.filter((t) => t.priority === 'CRITICAL').length,
          },
          {
            label: 'Unassigned',
            value: items.filter((t) => !t.assignedToId).length,
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
          icon={<LifeBuoy className="h-6 w-6" />}
          title="No support tickets"
          description="Client technical tickets and plant troubleshooting requests appear here."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Open Ticket
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="subject"
          searchPlaceholder="Search support tickets…"
        />
      )}

      {/* Open Ticket Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (createTicket.isPending) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open After-Sales Technical Ticket</DialogTitle>
            <DialogDescription>
              Dispatch an engineering support ticket for a commissioned plant
              issue.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="ticket-subject">Subject *</Label>
                <Input
                  id="ticket-subject"
                  placeholder="Elution column pressure drop out of range"
                  {...register('subject')}
                  error={errors.subject?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket-client">Client</Label>
                <select
                  id="ticket-client"
                  className={selectClass}
                  {...register('clientId')}
                >
                  <option value="">No client linked</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-category">Category</Label>
                  <select
                    id="ticket-category"
                    className={selectClass}
                    {...register('category')}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-priority">Priority</Label>
                  <select
                    id="ticket-priority"
                    className={selectClass}
                    {...register('priority')}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket-description">Description *</Label>
                <Textarea
                  id="ticket-description"
                  rows={4}
                  className="min-h-[100px]"
                  placeholder="Symptoms, cyanide concentration, pressure readings, when it started…"
                  {...register('description')}
                  error={errors.description?.message}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createTicket.isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                loading={createTicket.isPending}
              >
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog
        open={!!assigning}
        onOpenChange={(open) => {
          if (assignTicket.isPending) return;
          if (!open) {
            setAssigning(null);
            setAssigneeId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign engineer</DialogTitle>
            <DialogDescription>
              Route {assigning?.ticketNumber} to a support engineer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-assignee">Engineer</Label>
              <select
                id="ticket-assignee"
                className={selectClass}
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
              >
                <option value="">Select an engineer…</option>
                {engineers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} — {user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={assignTicket.isPending}
              onClick={() => {
                setAssigning(null);
                setAssigneeId('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={!assigneeId}
              loading={assignTicket.isPending}
              onClick={() => void confirmAssign()}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add message dialog */}
      <Dialog
        open={!!replying}
        onOpenChange={(open) => {
          if (addMessage.isPending) return;
          if (!open) {
            setReplying(null);
            setReplyText('');
            setReplyInternal(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a message</DialogTitle>
            <DialogDescription>
              Post an update on {replying?.ticketNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-message">Message</Label>
              <Textarea
                id="ticket-message"
                rows={4}
                className="min-h-[100px]"
                placeholder="Diagnosis, next site visit, parts ordered…"
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded"
                checked={replyInternal}
                onChange={(event) => setReplyInternal(event.target.checked)}
              />
              Internal note — not visible to the client
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={addMessage.isPending}
              onClick={() => {
                setReplying(null);
                setReplyText('');
                setReplyInternal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={!replyText.trim()}
              loading={addMessage.isPending}
              onClick={() => void confirmReply()}
            >
              Post message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog
        open={!!resolving}
        onOpenChange={(open) => {
          if (resolveTicket.isPending) return;
          if (!open) {
            setResolving(null);
            setResolution('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve ticket</DialogTitle>
            <DialogDescription>
              Record how {resolving?.ticketNumber} was resolved. This closes the
              ticket for the client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-resolution">Resolution</Label>
              <Textarea
                id="ticket-resolution"
                rows={4}
                className="min-h-[100px]"
                placeholder="Root cause, corrective action taken, preventive advice…"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={resolveTicket.isPending}
              onClick={() => {
                setResolving(null);
                setResolution('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={!resolution.trim()}
              loading={resolveTicket.isPending}
              onClick={() => void confirmResolve()}
            >
              Mark resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
