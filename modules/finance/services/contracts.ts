import type { AiFinanceInsight, BankAccount, BankConnection, CashFlow, FinanceDashboard, FinanceEvent, FinanceSummary, Payment, Receivable, TaxSummary, Transaction } from "../types";

export interface FinanceService {
  getDashboard(companyId: string): Promise<FinanceDashboard | null>;
  getSummary(companyId: string): Promise<FinanceSummary | null>;
  ingestEvent(event: FinanceEvent): Promise<void>;
}

export interface BankService {
  connect(companyId: string, bankCode: string): Promise<BankConnection | null>;
  disconnect(connectionId: string): Promise<void>;
  sync(connectionId: string): Promise<void>;
  refresh(connectionId: string): Promise<BankConnection | null>;
  getAccounts(connectionId: string): Promise<BankAccount[]>;
  getTransactions(connectionId: string, accountId?: string): Promise<Transaction[]>;
}

export interface TransactionService {
  list(companyId: string): Promise<Transaction[]>;
  classify(transactionId: string): Promise<Transaction | null>;
}

export interface CashFlowService {
  getCashFlow(companyId: string, periodStart: string, periodEnd: string): Promise<CashFlow[]>;
  forecast(companyId: string): Promise<CashFlow[]>;
}

export interface PaymentService {
  list(companyId: string): Promise<Payment[]>;
  approve(paymentId: string): Promise<Payment | null>;
}

export interface ReceivableService {
  list(companyId: string): Promise<Receivable[]>;
  assessRisk(receivableId: string): Promise<AiFinanceInsight | null>;
}

export interface TaxService {
  getSummary(companyId: string, period: string): Promise<TaxSummary | null>;
  getRecommendations(companyId: string, period: string): Promise<AiFinanceInsight[]>;
}

export interface AiFinanceService {
  getInsights(companyId: string): Promise<AiFinanceInsight[]>;
  analyze(companyId: string): Promise<AiFinanceInsight[]>;
}
