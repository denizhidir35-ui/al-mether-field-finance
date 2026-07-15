export type AppRole = "CEO" | "PARTNER" | "ASSISTANT" | "MANAGER" | "CHIEF" | "PERSONNEL";

export type AppUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: AppRole;
  title: string;
  platformUserCode?: string;
};
