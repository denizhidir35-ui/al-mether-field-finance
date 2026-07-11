import { BarChart3, Boxes, BriefcaseBusiness, CarFront, FileText, Settings, UsersRound } from "lucide-react";
import type { AppUser } from "@/types/auth";
import type { ModuleId } from "@/core/navigation/navigation.types";
import { DashboardModule } from "@/modules/dashboard/DashboardModule";
import { FinanceModule } from "@/modules/finance/FinanceModule";
import { PlaceholderModule } from "@/modules/shared/PlaceholderModule";

type ModuleRendererProps = { activeModule: ModuleId; user: AppUser; onNavigate: (module: ModuleId) => void };

const PLACEHOLDERS = {
  hr: { title: "Human Resources", eyebrow: "HR", description: "Personel, işe giriş, izin, mesai, performans ve çalışan belgeleri.", icon: UsersRound, sections: ["Personel", "İşe Giriş", "İzin ve Mesai", "Performans", "Personel Dosyaları", "HR Belgeleri"] },
  operations: { title: "Operations", eyebrow: "Field Operations", description: "İş emirleri, saha ekipleri, günlük işler, teslimler, QR, GPS ve fotoğraf akışı.", icon: BriefcaseBusiness, sections: ["İş Emirleri", "Saha Ekipleri", "Günlük İşler", "Teslimler", "QR ve GPS", "Fotoğraflar"] },
  fleet: { title: "Fleet", eyebrow: "Vehicle Management", description: "Araç, yakıt, bakım, hasar, HGS, lastik ve teslim süreçleri.", icon: CarFront, sections: ["Araçlar", "Teslim ve İade", "Yakıt", "Bakım", "Hasar", "Araç Belgeleri"] },
  inventory: { title: "Inventory", eyebrow: "Assets & Stock", description: "Demirbaş, stok, depo, zimmet, satın alma ve malzeme hareketleri.", icon: Boxes, sections: ["Demirbaş", "Stok", "Depo", "Zimmet", "Satın Alma", "Malzeme Hareketleri"] },
  documents: { title: "Documents", eyebrow: "Document Center", description: "Kurumsal belge üretimi, Word, PDF, revizyon, QR, doküman kodu ve arşiv.", icon: FileText, sections: ["Belge Merkezi", "Şablonlar", "Personel Belgeleri", "Araç Belgeleri", "PDF ve Word", "Arşiv"] },
  reports: { title: "Reports", eyebrow: "Business Intelligence", description: "Finance, HR, operasyon, araç, demirbaş ve belge raporları.", icon: BarChart3, sections: ["Yönetim Özeti", "Finance Raporları", "HR Raporları", "Operasyon Raporları", "Araç Raporları", "Belge Raporları"] },
  settings: { title: "Settings", eyebrow: "Administration", description: "Şirket, kullanıcı, rol, yetki, entegrasyon, güvenlik ve sistem ayarları.", icon: Settings, sections: ["Şirket", "Kullanıcılar", "Roller ve Yetkiler", "Entegrasyonlar", "Güvenlik", "Yedekleme"] }
} satisfies Record<Exclude<ModuleId, "dashboard" | "finance">, Parameters<typeof PlaceholderModule>[0]>;

export function ModuleRenderer({ activeModule, user, onNavigate }: ModuleRendererProps) {
  if (activeModule === "dashboard") return <DashboardModule user={user} onNavigate={onNavigate} />;
  if (activeModule === "finance") return <FinanceModule user={user} />;
  return <PlaceholderModule {...PLACEHOLDERS[activeModule]} />;
}

