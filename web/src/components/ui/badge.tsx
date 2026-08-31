import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success:
          'border-transparent bg-success/15 text-success dark:bg-success/20',
        warning:
          'border-transparent bg-warning/15 text-warning-foreground dark:bg-warning/20',
        destructive:
          'border-transparent bg-destructive/15 text-destructive dark:bg-destructive/20',
        brand:
          'border-transparent bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400',
        mineral:
          'border-mineral-graphite/30 bg-mineral-graphite/10 text-mineral-graphite dark:bg-white/10 dark:text-white/70',
        gold: 'border-transparent bg-mineral-gold/15 text-mineral-gold',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

// ─── StatusBadge — maps business statuses to badge variants ────────────────

const STATUS_VARIANT_MAP: Record<
  string,
  VariantProps<typeof badgeVariants>['variant']
> = {
  // Generic
  ACTIVE: 'success',
  INACTIVE: 'mineral',
  PENDING: 'warning',
  DRAFT: 'mineral',
  PUBLISHED: 'success',
  ARCHIVED: 'mineral',

  // Projects
  AWARDED: 'brand',
  PLANNING: 'brand',
  ENGINEERING: 'brand',
  PROCUREMENT: 'warning',
  CONSTRUCTION: 'warning',
  INSTALLATION: 'warning',
  COMMISSIONING: 'gold',
  HANDOVER: 'gold',
  SUPPORT: 'success',
  COMPLETED: 'success',
  ON_HOLD: 'warning',
  CANCELLED: 'destructive',

  // Quotations
  INTERNAL_REVIEW: 'warning',
  APPROVED: 'success',
  SENT: 'brand',
  VIEWED: 'brand',
  ACCEPTED: 'success',
  REJECTED: 'destructive',
  EXPIRED: 'mineral',
  CONVERTED: 'success',

  // Leads
  NEW: 'brand',
  QUALIFIED: 'brand',
  CONSULTATION: 'warning',
  ASSESSMENT: 'warning',
  RFQ: 'gold',
  QUOTATION: 'gold',
  NEGOTIATION: 'gold',
  WON: 'success',
  LOST: 'destructive',

  // Documents
  UNDER_REVIEW: 'warning',
  REVIEWED: 'brand',
  SUPERSEDED: 'mineral',

  // Finance
  ISSUED: 'brand',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'destructive',

  // HSE
  NEAR_MISS: 'warning',
  FIRST_AID: 'warning',
  MEDICAL_TREATMENT: 'destructive',
  LOST_TIME: 'destructive',
  FATALITY: 'destructive',

  // Work orders
  OPEN: 'brand',
  ASSIGNED: 'brand',
  IN_PROGRESS: 'warning',
  WAITING_PARTS: 'warning',
  VERIFIED: 'success',
  CLOSED: 'mineral',

  // Tickets
  WAITING_CLIENT: 'warning',
  RESOLVED: 'success',

  // Tests
  PASSED: 'success',
  FAILED: 'destructive',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = STATUS_VARIANT_MAP[status] ?? 'outline';
  const label = status.replace(/_/g, ' ');
  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      <span className="status-dot bg-current opacity-80" />
      {label.toLowerCase()}
    </Badge>
  );
}
