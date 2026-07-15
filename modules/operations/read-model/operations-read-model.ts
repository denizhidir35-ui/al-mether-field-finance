import type { MapMarker } from "@/core/map/types";
import type { WorkOrder } from "../domain/work-order";
import type { PersonnelRecord } from "../domain/personnel-record";
import type { OperationProject } from "../domain/operation-project";
import type { WorkOrderId } from "../domain/identifiers";
import type { OperationsKPI } from "../types";
import type { WorkflowState } from "../workflow/workflow.types";

export type ProjectWorkflowProjection = {
  project: OperationProject;
  workflow: WorkflowState;
};

export type OperationsReadModel = {
  workOrders: readonly WorkOrder[];
  personnelRecords: readonly PersonnelRecord[];
  projects: readonly OperationProject[];
  kpis: readonly OperationsKPI[];
  workOrderStates: Readonly<Record<WorkOrderId, WorkflowState>>;
  mapMarkers: readonly MapMarker[];
  personnel: { active: number; assigned: number };
  problems: { open: number; critical: number };
  notifications: WorkflowState["notifications"];
  latestOperation: string;
  supportCount: number;
  photoCount: number;
  latestPhoto?: WorkflowState["evidence"][number];
};
