import type { ProjectCode } from "./identifiers";

export type WorkOrder = {
  id: string;
  projectCode: ProjectCode;
  chiefId: string;
  workflowId: string;
  status: "assigned" | "active" | "completed";
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
};
