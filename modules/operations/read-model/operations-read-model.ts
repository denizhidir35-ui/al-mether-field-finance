import type { OperationProject } from "../domain/operation-project";
import type { OperationsKPI } from "../types";
import type { WorkflowState } from "../workflow/workflow.types";

export type ProjectWorkflowProjection = {
  project: OperationProject;
  workflow: WorkflowState;
};

export type OperationsReadModel = {
  projects: readonly OperationProject[];
  kpis: readonly OperationsKPI[];
  workflows: Readonly<Record<string, WorkflowState>>;
  latestOperation: string;
  supportCount: number;
  photoCount: number;
};
