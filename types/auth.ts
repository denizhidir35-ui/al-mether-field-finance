export type AppRole = "CEO" | "PARTNER" | "ASSISTANT" | "MANAGER" | "CHIEF" | "PERSONNEL" | "HR" | "OFFICE" | "EMPLOYEE" | "PLATFORM_ADMIN";

export type AppUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: AppRole;
  title: string;
  platformUserCode?: string;
  permissions?: string[];
  licensedModules?: string[];
};
