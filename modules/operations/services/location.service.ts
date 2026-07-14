import type { MapCoordinate } from "@/core/map/types";

export interface OperationLocationService {
  capture(): Promise<MapCoordinate>;
}
