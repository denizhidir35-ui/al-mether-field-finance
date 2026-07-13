import type { AiFinanceInsight } from "../types";

export interface AiFinanceEngine {
  analyzeSpending(companyId: string): Promise<AiFinanceInsight[]>;
  forecastCashFlow(companyId: string): Promise<AiFinanceInsight[]>;
  suggestTaxActions(companyId: string): Promise<AiFinanceInsight[]>;
  suggestPayments(companyId: string): Promise<AiFinanceInsight[]>;
  assessReceivableRisks(companyId: string): Promise<AiFinanceInsight[]>;
}
