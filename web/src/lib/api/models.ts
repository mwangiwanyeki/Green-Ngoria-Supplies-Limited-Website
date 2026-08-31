export interface ProjectSummary {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  type: string;
  contractValue: number | null;
  currency: string;
  startDate: string | null;
  targetEndDate: string | null;
  client?: { companyName: string };
  manager?: { firstName: string; lastName: string };
}

export interface QuotationSummary {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  totalAmount: number;
  currency: string;
  validUntil: string | null;
  createdAt: string;
  revision: number;
  client?: { companyName: string };
}

export interface LeadSummary {
  id: string;
  reference: string;
  companyName: string;
  contactName: string;
  status: string;
  estimatedValue: number | null;
  currency: string;
  source: string;
  createdAt: string;
  owner?: { firstName: string; lastName: string };
}
