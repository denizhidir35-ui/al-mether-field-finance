"use client";

import { Bell, CalendarDays, LogOut } from "lucide-react";
import type { AppUser } from "@/types/auth";
import { formatLongDate } from "@/core/formatters/date";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type TopBarProps = {
  user: AppUser;
  onLogout: () => void;
};

export function TopBar({ user, onLogout }: TopBarProps) {
  const today = formatLongDate(new Date());

  return (
    <header className="mether-topbar sticky top-0 z-40 border-b backdrop-blur-2xl">
      <div className="mx-auto flex h-[62px] w-full max-w-[1540px] items-center justify-between gap-4 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-blue-400/20 bg-[#080d19] shadow-[0_0_28px_rgba(59,130,246,.16)]">
            <img
              src="/mether-logo.jpeg"
              alt="AL METHER"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-black tracking-[0.18em] text-white">
              AL METHER
            </div>
            <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Company Platform
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden h-9 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] text-slate-500 sm:flex">
            <CalendarDays size={14} />
            {today}
          </div>

          <button
            type="button"
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500 transition hover:text-white"
          >
            <Bell size={15} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-400" />
          </button>

          <div className="hidden min-w-0 text-right md:block">
            <div className="max-w-[180px] truncate text-[11px] font-bold text-slate-200">
              {user.name}
            </div>
            <div className="max-w-[180px] truncate text-[9px] text-slate-600">
              {user.email}
            </div>
          </div>

          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-black text-white">
            {user.name
              .split(" ")
              .slice(0, 2)
              .map(part => part.charAt(0))
              .join("")}
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Çıkış"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-600 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
