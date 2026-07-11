import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  CarFront,
  FileText,
  LayoutDashboard,
  Settings,
  UsersRound,
  WalletCards,
  type LucideIcon
} from "lucide-react";
import type { ModuleId } from "./navigation.types";

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
};

export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  { id: "dashboard", label: "Ana", icon: LayoutDashboard },
  { id: "finance", label: "Finance", icon: WalletCards },
  { id: "hr", label: "HR", icon: UsersRound },
  { id: "operations", label: "İşler", icon: BriefcaseBusiness },
  { id: "fleet", label: "Araçlar", icon: CarFront },
  { id: "inventory", label: "Stok", icon: Boxes },
  { id: "documents", label: "Belgeler", icon: FileText },
  { id: "reports", label: "Raporlar", icon: BarChart3 },
  { id: "settings", label: "Ayarlar", icon: Settings }
] as const;

