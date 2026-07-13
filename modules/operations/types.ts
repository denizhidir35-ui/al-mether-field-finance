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
  coordinates: { x: number; y: number };
};

export type OperationsKPI = {
  label: string;
  mobileLabel: string;
  value: string;
  detail: string;
};

export type DailyOperationMetric = {
  label: string;
  mobileLabel: string;
  value: string;
};
