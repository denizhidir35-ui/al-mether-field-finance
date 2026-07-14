import type { MapCoordinate } from "@/core/map/types";
import type { ProjectCode, TargetCode } from "./identifiers";

export type OperationTargetType = "building" | "distribution_box" | "solar_panel" | "camera" | "utility_point" | "telecom_point" | "custom";

export type OperationTarget = {
  id: string;
  code: TargetCode;
  projectCode: ProjectCode;
  type: OperationTargetType;
  label: string;
  status: "pending" | "active" | "completed";
  coordinates?: MapCoordinate;
  metadata: Readonly<Record<string, string | number | boolean>>;
};
