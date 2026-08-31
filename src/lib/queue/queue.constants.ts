/**
 * BullMQ queue names — all background job queues for the platform.
 * Import these constants rather than using raw strings.
 */
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  PDF: 'pdf',
  REPORTS: 'reports',
  EXPORTS: 'exports',
  DOCUMENT_PROCESSING: 'document-processing',
  MAINTENANCE: 'maintenance',
  WARRANTY: 'warranty',
  ANALYTICS: 'analytics',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ─── Job type identifiers ─────────────────────────────────────────────────────

export const EMAIL_JOBS = {
  SEND_WELCOME: 'send-welcome',
  SEND_VERIFICATION: 'send-verification',
  SEND_PASSWORD_RESET: 'send-password-reset',
  SEND_QUOTATION: 'send-quotation',
  SEND_INVOICE: 'send-invoice',
  SEND_SUPPORT_TICKET: 'send-support-ticket',
  SEND_MAINTENANCE_REMINDER: 'send-maintenance-reminder',
  SEND_WARRANTY_EXPIRY: 'send-warranty-expiry',
  SEND_GENERIC: 'send-generic',
} as const;

export const PDF_JOBS = {
  GENERATE_QUOTATION: 'generate-quotation',
  GENERATE_INVOICE: 'generate-invoice',
  GENERATE_ASSESSMENT_REPORT: 'generate-assessment-report',
  GENERATE_COMMISSIONING_REPORT: 'generate-commissioning-report',
  GENERATE_HSE_REPORT: 'generate-hse-report',
  GENERATE_PROJECT_REPORT: 'generate-project-report',
  GENERATE_PURCHASE_ORDER: 'generate-purchase-order',
} as const;

export const NOTIFICATION_JOBS = {
  SEND_IN_APP: 'send-in-app',
  SEND_BULK: 'send-bulk',
} as const;

export const REPORT_JOBS = {
  GENERATE_CRM: 'generate-crm',
  GENERATE_FINANCE: 'generate-finance',
  GENERATE_PROJECT: 'generate-project',
  GENERATE_HSE: 'generate-hse',
  GENERATE_MAINTENANCE: 'generate-maintenance',
} as const;

export const MAINTENANCE_JOBS = {
  SEND_REMINDER: 'send-reminder',
  CHECK_OVERDUE: 'check-overdue',
} as const;

export const WARRANTY_JOBS = {
  CHECK_EXPIRY: 'check-expiry',
  SEND_ALERT: 'send-alert',
} as const;
