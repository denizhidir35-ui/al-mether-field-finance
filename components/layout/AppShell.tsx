"use client";

import type { ReactNode } from "react";
import type { AppUser } from "@/types/auth";
import type { ModuleId } from "@/core/navigation/navigation.types";
import { TopBar } from "./TopBar";
import { BottomDock } from "./BottomDock";
import { MobileNavigation } from "./MobileNavigation";

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
    <div className="min-h-screen" data-focus-layer-root>
      <div data-app-shell-chrome><TopBar user={user} onLogout={onLogout} /></div>

      <main data-app-shell-main className={`relative px-2.5 pb-32 pt-2.5 sm:px-4 sm:pb-28 sm:pt-3 ${activeModule === "dashboard" ? "dashboard-viewport" : activeModule === "finance" ? "finance-viewport" : activeModule === "operations" ? "operations-viewport" : ""}`}>
        <div className={`mx-auto w-full max-w-[1540px] ${activeModule === "finance" || activeModule === "operations" ? "module-viewport-content" : ""}`}>{children}</div>
      </main>

      <div data-app-shell-chrome><BottomDock activeModule={activeModule} onChange={onChange} /></div>
      <div data-app-shell-chrome><MobileNavigation activeModule={activeModule} onChange={onChange} /></div>
    </div>
  );
}
