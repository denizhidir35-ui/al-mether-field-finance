import type { ProjectCode, TargetCode, WorkOrderCode, WorkOrderId } from "./identifiers";

export type WorkOrderStatus = "assigned" | "active" | "completed" | "cancelled";
export type WorkOrderPriority = "low" | "normal" | "high" | "critical";

export type WorkOrder = {
  id: WorkOrderId;
  code: WorkOrderCode;
  customerName: string;
  projectCode: ProjectCode;
  operationType: string;
  chiefId: string;
  personnelIds: readonly string[];
  workflowId: string;
  targetCodes: readonly TargetCode[];
  plannedStartAt: string;
  estimatedEndAt: string;
  priority: WorkOrderPriority;
  attachmentIds: readonly string[];
  status: WorkOrderStatus;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
};
