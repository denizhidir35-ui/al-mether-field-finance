import { Building2, DatabaseZap, Workflow } from "lucide-react";
import { FinanceEmptyState } from "./FinanceEmptyState";

export function FinanceOverview() {
  return <section className="grid gap-3 sm:grid-cols-3"><FinanceEmptyState icon={Building2} title="Banka merkezli" description="Hesaplar ve hareketler güvenli banka bağlantılarından beslenecek." /><FinanceEmptyState icon={Workflow} title="Modüller arası" description="Finansal olaylar kaynak modüllerden contract katmanı ile okunacak." /><FinanceEmptyState icon={DatabaseZap} title="Gerçek zamanlı" description="Manuel kayıt yerine senkronize finans akışı kullanılacak." /></section>;
}
