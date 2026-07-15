import type { FieldPersonnelCode } from "./identifiers";

export type PersonnelRecord = {
  id: `personnel-${string}`;
  personnelCode: FieldPersonnelCode;
  displayName: string;
  title: string;
  assignedChiefCode?: string;
  status: "active" | "passive" | "archived";
  qrValue: string;
  qrVersion: number;
  createdAt: string;
  updatedAt: string;
  documents: readonly string[];
  certificates: readonly string[];
  trainings: readonly string[];
  signatures: readonly string[];
  performanceRecords: readonly string[];
  authorizations: readonly string[];
};

export type NewPersonnelRecord = Pick<PersonnelRecord, "displayName" | "title">;
export type PersonnelRecordUpdate = Partial<Pick<PersonnelRecord, "displayName" | "title">>;
