import type { FieldPersonnelCode, ProjectCode, TargetCode, WorkOrderCode, WorkOrderId } from "./identifiers";

export type WorkOrderStatus = "assigned" | "active" | "completed" | "cancelled";
export type WorkOrderPriority = "low" | "normal" | "high" | "critical";

export type WorkOrder = {
  id: WorkOrderId;
  code: WorkOrderCode;
  customerName: string;
  projectCode: ProjectCode;
  operationType: string;
  chiefId: string;
  personnelIds: readonly FieldPersonnelCode[];
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

export type NewWorkOrder = Pick<WorkOrder, "customerName" | "projectCode" | "chiefId" | "personnelIds" | "plannedStartAt" | "estimatedEndAt" | "priority"> & {
  targetCodes: readonly TargetCode[];
};
