"use client";

import type { ReactNode } from "react";
import type { AppUser } from "@/types/auth";
import type { ModuleId } from "@/core/navigation/navigation.types";
import { TopBar } from "./TopBar";
import { BottomDock } from "./BottomDock";

type AppShellProps = {
  user: AppUser;
  activeModule: ModuleId;
  onChange: (module: ModuleId) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({
  user,
  activeModule,
  onChange,
  onLogout,
  children
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <TopBar user={user} onLogout={onLogout} />

      <main className="px-2.5 pb-32 pt-2.5 sm:px-4 sm:pb-28 sm:pt-3">
        <div className="mx-auto w-full max-w-[1540px]">{children}</div>
      </main>

      <BottomDock activeModule={activeModule} onChange={onChange} />
    </div>
  );
}
