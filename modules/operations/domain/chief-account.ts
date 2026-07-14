import type { PersonnelCode, ProjectCode } from "./identifiers";

export type ChiefAccount = {
  id: string;
  personnelCode: PersonnelCode;
  displayName: string;
  role: "Chief";
  status: "active" | "passive";
  assignedProjectCodes: readonly ProjectCode[];
  isDemo: boolean;
};
