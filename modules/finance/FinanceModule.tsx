import type { AppUser } from "@/types/auth";
import { FinanceDashboard } from "./dashboard/FinanceDashboard";

export function FinanceModule({ user }: { user: AppUser }) {
  return <FinanceDashboard user={user} />;
}
