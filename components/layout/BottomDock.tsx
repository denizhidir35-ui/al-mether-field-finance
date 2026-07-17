"use client";

import { MODULE_REGISTRY } from "@/core/navigation/module-registry";
import type { ModuleId } from "@/core/navigation/navigation.types";
import type { AppUser } from "@/types/auth";
import { modulesForUser } from "@/core/navigation/access-control";

type BottomDockProps = {
  user: AppUser;
  activeModule: ModuleId;
  onChange: (module: ModuleId) => void;
};

export function BottomDock({
  user,
  activeModule,
  onChange
}: BottomDockProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 hidden px-2 pb-[max(7px,env(safe-area-inset-bottom))] lg:block">
      <nav className="mether-dock mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-[22px] border border-white/[0.09] bg-[#09101e]/94 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.5)] backdrop-blur-2xl">
        {MODULE_REGISTRY.filter(item => modulesForUser(user).includes(item.id)).map(item => {
          const Icon = item.icon;
          const active = activeModule === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              title={item.label}
              className={`flex h-[48px] min-w-[54px] shrink-0 flex-col items-center justify-center gap-1 rounded-[15px] px-2 transition ${
                active
                  ? "bg-blue-500/16 text-blue-300 shadow-[inset_0_0_0_1px_rgba(96,165,250,.15)]"
                  : "text-slate-600 hover:bg-white/[0.035] hover:text-slate-300"
              }`}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span className="text-[8px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
