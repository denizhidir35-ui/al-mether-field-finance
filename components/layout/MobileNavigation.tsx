"use client";

import {
  FileText,
  LayoutDashboard,
  Menu,
  WalletCards,
  BriefcaseBusiness,
  UsersRound
} from "lucide-react";
import type { ModuleId } from "@/core/navigation/navigation.types";
import type { AppUser } from "@/types/auth";
import { modulesForUser } from "@/core/navigation/access-control";

type MobileNavigationProps = {
  user: AppUser;
  activeModule: ModuleId;
  onChange: (module: ModuleId) => void;
};

const ITEMS = [
  { id: "dashboard", label: "Ana", icon: LayoutDashboard },
  { id: "hr", label: "HR", icon: UsersRound },
  { id: "operations", label: "İşler", icon: BriefcaseBusiness },
  { id: "finance", label: "Finance", icon: WalletCards },
  { id: "documents", label: "Belgeler", icon: FileText },
  { id: "settings", label: "Daha Fazla", icon: Menu }
] as const;

export function MobileNavigation({
  user,
  activeModule,
  onChange
}: MobileNavigationProps) {
  return (
    <nav className="mether-mobile-nav fixed inset-x-3 bottom-3 z-50 flex justify-center rounded-2xl border p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden">
      {ITEMS.filter(item => modulesForUser(user).includes(item.id)).map(item => {
        const Icon = item.icon;
        const active = activeModule === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-semibold transition ${
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
