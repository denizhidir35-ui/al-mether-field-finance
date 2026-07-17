import type { AppUser } from "@/types/auth";
import type { ModuleId } from "./navigation.types";

const ROLE_MODULES: Record<AppUser["role"], readonly ModuleId[]> = {
  CEO: ["dashboard", "finance", "hr", "operations", "fleet", "inventory", "documents", "reports", "settings"],
  PARTNER: ["dashboard", "finance", "hr", "operations", "fleet", "inventory", "documents", "reports", "settings"],
  PLATFORM_ADMIN: ["dashboard", "finance", "hr", "operations", "fleet", "inventory", "documents", "reports", "settings"],
  HR: ["dashboard", "hr", "documents", "settings"], MANAGER: ["dashboard", "hr", "operations", "documents", "reports"],
  ASSISTANT: ["dashboard", "documents"], OFFICE: ["dashboard", "operations", "documents"],
  EMPLOYEE: ["dashboard", "hr", "documents"], CHIEF: ["operations"], PERSONNEL: ["dashboard", "hr", "documents"],
};

export function modulesForUser(user: AppUser) {
  const roleModules = ROLE_MODULES[user.role];
  if (!user.licensedModules?.length) return roleModules;
  const licenses = new Set(user.licensedModules);
  return roleModules.filter(moduleId => moduleId === "dashboard" || licenses.has(moduleId));
}
