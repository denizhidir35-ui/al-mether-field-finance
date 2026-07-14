import type { MapCoordinate } from "@/core/map/types";
import type { ProjectCode } from "./identifiers";

export type OperationProjectStatus = "Sahada" | "Planlama" | "Teslim";
export type OperationMarkerStatus = "idle" | "active" | "attention" | "completed";

export type OperationProject = {
  id: string;
  code: ProjectCode;
  name: string;
  city: string;
  district: string;
  island: string;
  status: OperationProjectStatus;
  progress: number;
  supervisor: string;
  streets: number;
  distributionBoxes: number;
  buildings: number;
  startDate: string;
  estimatedEndDate: string;
  coordinates: MapCoordinate;
  activePersonnelCount: number;
  completedTargetCount: number;
  workflowState: string;
  latestOperation: string;
  supportCount: number;
  photoCount: number;
  markerStatus: OperationMarkerStatus;
};
