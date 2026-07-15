import type { ChiefCode, ProjectCode } from "./identifiers";

export type ChiefAccount = {
  id: string;
  personnelCode: ChiefCode;
  displayName: string;
  role: "Chief";
  status: "active" | "passive";
  assignedProjectCodes: readonly ProjectCode[];
};
