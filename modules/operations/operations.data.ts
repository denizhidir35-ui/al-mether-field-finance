import type { WorkOrder } from "./domain/work-order";
import type { PersonnelRecord } from "./domain/personnel-record";
import type { OperationProject } from "./types";
import type { ChiefAccount } from "./domain/chief-account";

export const OPERATION_CHIEFS: readonly ChiefAccount[] = [{
  id: "SMTHR000001",
  personnelCode: "SMTHR000001",
  displayName: "Ahmet Yılmaz",
  role: "Chief",
  status: "active",
  assignedProjectCodes: ["ALM-0001", "ALM-0002", "ALM-0003"]
}];

export const OPERATION_PROJECTS: readonly OperationProject[] = [
  {
    id: "project-alm-0001",
    code: "ALM-0001",
    name: "Karşıyaka Fiber Dönüşüm",
    city: "İzmir",
    district: "Karşıyaka",
    island: "085",
    status: "Sahada",
    progress: 72,
    supervisor: "Ahmet Yılmaz",
    streets: 18,
    distributionBoxes: 46,
    buildings: 284,
    startDate: "01 Tem 2026",
    estimatedEndDate: "28 Tem 2026",
    coordinates: { lat: 38.4554, lng: 27.1197 },
    activePersonnelCount: 5,
    completedTargetCount: 24,
    workflowState: "Kablo",
    latestOperation: "Bina dışı kablo kontrolü",
    supportCount: 0,
    photoCount: 86,
    markerStatus: "idle"
  },
  {
    id: "project-alm-0002",
    code: "ALM-0002",
    name: "Bornova Altyapı Operasyonu",
    city: "İzmir",
    district: "Bornova",
    island: "086",
    status: "Sahada",
    progress: 46,
    supervisor: "Mehmet Kaya",
    streets: 12,
    distributionBoxes: 31,
    buildings: 196,
    startDate: "06 Tem 2026",
    estimatedEndDate: "04 Ağu 2026",
    coordinates: { lat: 38.4622, lng: 27.2165 },
    activePersonnelCount: 4,
    completedTargetCount: 11,
    workflowState: "Keşif",
    latestOperation: "DEKA fotoğrafı doğrulandı",
    supportCount: 0,
    photoCount: 54,
    markerStatus: "idle"
  },
  {
    id: "project-alm-0003",
    code: "ALM-0003",
    name: "Gaziemir Saha Teslimi",
    city: "İzmir",
    district: "Gaziemir",
    island: "101",
    status: "Teslim",
    progress: 91,
    supervisor: "Serkan Demir",
    streets: 9,
    distributionBoxes: 24,
    buildings: 148,
    startDate: "18 Haz 2026",
    estimatedEndDate: "15 Tem 2026",
    coordinates: { lat: 38.3213, lng: 27.1297 },
    activePersonnelCount: 3,
    completedTargetCount: 39,
    workflowState: "Teslim",
    latestOperation: "Son fotoğraflar tamamlandı",
    supportCount: 0,
    photoCount: 46,
    markerStatus: "completed"
  }
] as const;

// Master records are created through HR and CEO commands. Demo operation state is
// deliberately not used as an operational source of truth.
export const OPERATION_WORK_ORDERS: readonly WorkOrder[] = [];
export const OPERATION_PERSONNEL: readonly PersonnelRecord[] = [];
