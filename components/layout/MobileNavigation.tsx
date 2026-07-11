"use client";

import {
  FileText,
  LayoutDashboard,
  Menu,
  WalletCards,
  BriefcaseBusiness
} from "lucide-react";
import type { ModuleId } from "@/core/navigation/navigation.types";

type MobileNavigationProps = {
  activeModule: ModuleId;
  onChange: (module: ModuleId) => void;
};

const ITEMS = [
  { id: "dashboard", label: "Ana", icon: LayoutDashboard },
  { id: "operations", label: "İşler", icon: BriefcaseBusiness },
  { id: "finance", label: "Finance", icon: WalletCards },
  { id: "documents", label: "Belgeler", icon: FileText },
  { id: "settings", label: "Daha Fazla", icon: Menu }
] as const;

export function MobileNavigation({
  activeModule,
  onChange
}: MobileNavigationProps) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-white/10 bg-[#08101e]/92 p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden">
      {ITEMS.map(item => {
        const Icon = item.icon;
        const active = activeModule === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-semibold transition ${
              active
                ? "bg-blue-500/15 text-blue-300"
                : "text-slate-500 hover:text-slate-200"
            }`}
          >
            <Icon size={17} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
