export type FinanceEntry = {
  id: string;
  company_id: string;
  type: "income" | "expense";
  title: string;
  category: string;
  amount: number;
  status: string;
  created_by: string;
  created_at: string;
};