import type { MapCoordinate } from "@/core/map/types";

export type EvidenceType = "photo" | "location" | "qr" | "document" | "audio";
export type EvidenceSyncStatus = "local" | "pending" | "syncing" | "synced" | "failed";
export type EvidenceAnalysisStatus = "not_requested" | "pending" | "completed" | "failed";

export type OperationEvidence = {
  id: string;
  workOrderId: string;
  stepId: string;
  type: EvidenceType;
  requirement: "required" | "optional";
  localReference?: string;
  remoteReference?: string;
  coordinates?: MapCoordinate;
  capturedAt: string;
  syncStatus: EvidenceSyncStatus;
  analysisStatus: EvidenceAnalysisStatus;
};
