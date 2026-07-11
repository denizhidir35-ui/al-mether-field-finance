export type AppRole = "CEO" | "PARTNER" | "ASSISTANT";

export type AppUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: AppRole;
  title: string;
};
