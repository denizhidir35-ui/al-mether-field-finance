import type { MapCoordinate } from "@/core/map/types";

export type OperationProjectStatus = "Sahada" | "Planlama" | "Teslim";

export type OperationProject = {
  id: string;
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
};

export type OperationsKPI = {
  label: string;
  mobileLabel: string;
  value: string;
  detail: string;
};
