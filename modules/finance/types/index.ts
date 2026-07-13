export type BankConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
export type TransactionType = "income" | "expense" | "transfer";
export type FinanceSourceModule = "finance" | "hr" | "field" | "operations" | "fleet" | "inventory" | "documents";

export type BankAccount = {
  id: string;
  connectionId: string;
  name: string;
  iban: string;
  currency: "TRY" | "USD" | "EUR" | string;
  balance: number;
  availableBalance?: number;
  lastSyncedAt?: string;
};

export type BankConnection = {
  id: string;
  bankCode: string;
  bankName: string;
  status: BankConnectionStatus;
  accountIds: string[];
  lastSyncedAt?: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  occurredAt: string;
  sourceModule?: FinanceSourceModule;
  sourceReferenceId?: string;
};

export type Payment = {
  id: string;
  title: string;
  beneficiary: string;
  amount: number;
  currency: string;
  dueAt: string;
  status: "planned" | "approved" | "paid" | "overdue";
};

export type Receivable = {
  id: string;
  title: string;
  debtor: string;
  amount: number;
  currency: string;
  dueAt: string;
  status: "expected" | "partial" | "collected" | "overdue";
};

export type CashFlow = {
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  projectedClosingBalance?: number;
};

export type TaxSummary = {
  period: string;
  outputVat: number;
  inputVat: number;
  payableVat: number;
  currency: string;
};

export type FinanceSummary = {
  totalBalance: number;
  expectedReceivables: number;
  plannedPayments: number;
  projectedCash: number;
  currency: string;
};

export type AiFinanceInsight = {
  id: string;
  kind: "cashflow" | "tax" | "payment" | "receivable" | "anomaly";
  title: string;
  description: string;
  confidence: number;
  createdAt: string;
};

export type FinanceDashboard = {
  summary: FinanceSummary;
  accounts: BankAccount[];
  recentTransactions: Transaction[];
  cashFlow: CashFlow[];
  payments: Payment[];
  receivables: Receivable[];
  tax: TaxSummary | null;
  insights: AiFinanceInsight[];
};

export type FinanceEvent = {
  id: string;
  companyId: string;
  sourceModule: FinanceSourceModule;
  sourceReferenceId: string;
  eventType: string;
  amount?: number;
  currency?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};
