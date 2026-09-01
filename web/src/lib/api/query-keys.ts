/**
 * Centralised TanStack Query key factory.
 * Import these rather than using raw string arrays to prevent typos and enable precise invalidation.
 */
export const QK = {
  // Auth
  me: () => ['auth', 'me'] as const,
  sessions: () => ['auth', 'sessions'] as const,

  // Organizations
  orgs: {
    all: () => ['organizations'] as const,
    detail: (id: string) => ['organizations', id] as const,
    members: (id: string) => ['organizations', id, 'members'] as const,
  },

  // Users
  users: {
    all: (params?: object) => ['users', params] as const,
    detail: (id: string) => ['users', id] as const,
  },

  // Clients
  clients: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'clients', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'clients', id] as const,
  },

  // Leads
  leads: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'leads', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'leads', id] as const,
    pipeline: (orgId: string) => ['orgs', orgId, 'leads', 'pipeline'] as const,
  },

  // Consultations (sub-resource of leads — no aggregate list endpoint exists,
  // so the admin view derives them from lead details)
  consultations: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'consultations', params] as const,
    forLead: (orgId: string, leadId: string) =>
      ['orgs', orgId, 'leads', leadId, 'consultations'] as const,
  },

  // Mining sites
  miningSites: {
    all: (params?: object) => ['mining-sites', params] as const,
    detail: (id: string) => ['mining-sites', id] as const,
  },

  // Plant assessments
  assessments: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'assessments', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'assessments', id] as const,
  },

  // Equipment
  equipment: {
    all: (params?: object) => ['equipment', params] as const,
    detail: (id: string) => ['equipment', id] as const,
    categories: () => ['equipment', 'categories'] as const,
  },

  // Spares
  spares: {
    all: (params?: object) => ['equipment', 'spares', params] as const,
    detail: (id: string) => ['equipment', 'spares', id] as const,
  },

  // RFQs
  rfqs: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'rfqs', params] as const,
    detail: (orgId: string, id: string) => ['orgs', orgId, 'rfqs', id] as const,
  },

  // Quotations
  quotations: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'quotations', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'quotations', id] as const,
  },

  // Projects
  projects: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'projects', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'projects', id] as const,
    dashboard: (orgId: string) =>
      ['orgs', orgId, 'projects', 'dashboard'] as const,
  },

  // Engineering
  documents: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'engineering', 'documents', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'engineering', 'documents', id] as const,
  },

  // Procurement
  requisitions: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'procurement', 'requisitions', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'procurement', 'requisitions', id] as const,
  },
  vendors: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'procurement', 'vendors', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'procurement', 'vendors', id] as const,
  },
  purchaseOrders: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'procurement', 'purchase-orders', params] as const,
  },

  // Finance
  finance: {
    summary: (orgId: string) =>
      ['orgs', orgId, 'finance', 'summary'] as const,
  },
  invoices: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'invoices', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'invoices', id] as const,
  },
  payments: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'payments', params] as const,
  },

  // HSE
  hseIncidents: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'hse', 'incidents', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'hse', 'incidents', id] as const,
  },

  // Commissioning
  commissioning: {
    all: (orgId: string, projectId: string) =>
      ['orgs', orgId, 'projects', projectId, 'commissioning'] as const,
  },

  // Assets
  assets: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'assets', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'assets', id] as const,
  },

  // Warranties (sub-resource of assets)
  warranties: {
    expiring: (orgId: string) =>
      ['orgs', orgId, 'assets', 'warranties', 'expiring'] as const,
  },

  // Site operations — daily site reports
  siteReports: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'site-operations', 'reports', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'site-operations', 'reports', id] as const,
  },

  // Maintenance
  workOrders: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'maintenance', 'work-orders', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'maintenance', 'work-orders', id] as const,
  },

  // Support
  tickets: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'support', 'tickets', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'support', 'tickets', id] as const,
  },

  // Notifications
  notifications: (params?: object) => ['notifications', params] as const,

  // Analytics
  analytics: {
    dashboard: (orgId: string) =>
      ['orgs', orgId, 'analytics', 'dashboard'] as const,
  },

  // Roles & permissions
  roles: {
    all: (orgId: string) => ['orgs', orgId, 'roles'] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'roles', id] as const,
  },
  permissions: {
    all: (orgId: string) => ['orgs', orgId, 'permissions'] as const,
  },

  // Media library
  media: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'media', params] as const,
    detail: (orgId: string, id: string) =>
      ['orgs', orgId, 'media', id] as const,
  },

  // Audit logs
  auditLogs: {
    all: (orgId: string, params?: object) =>
      ['orgs', orgId, 'audit-logs', params] as const,
    facets: (orgId: string) => ['orgs', orgId, 'audit-logs', 'facets'] as const,
  },

  // CMS
  cms: {
    all: (orgId: string, type: string, params?: object) =>
      ['orgs', orgId, 'cms', type, params] as const,
    detail: (orgId: string, type: string, id: string) =>
      ['orgs', orgId, 'cms', type, id] as const,
  },

  // ERP Sales
  sales: {
    all: (orgId: string, branchId: string, params?: object) =>
      ['erp', orgId, branchId, 'erp/sales', params] as const,
    detail: (orgId: string, branchId: string, id: string) =>
      ['erp', orgId, branchId, 'erp/sales', id] as const,
    todaySummary: (orgId: string, branchId: string) =>
      ['erp', orgId, branchId, 'erp/sales/today-summary', 'one', {}] as const,
    revenueSummary: (orgId: string, branchId: string, params?: object) =>
      ['erp', orgId, branchId, 'erp/sales/revenue-summary', params] as const,
    monthlyRevenue: (orgId: string, branchId: string, params?: object) =>
      ['erp', orgId, branchId, 'erp/sales/monthly-revenue', params] as const,
  },
} as const;
