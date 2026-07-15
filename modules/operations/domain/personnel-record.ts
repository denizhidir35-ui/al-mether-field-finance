import type { FieldPersonnelCode } from "./identifiers";

export type PersonnelRecord = {
  id: `personnel-${string}`;
  personnelCode: FieldPersonnelCode;
  displayName: string;
  title: string;
  status: "active" | "passive";
  qrValue: string;
  createdAt: string;
};

export type NewPersonnelRecord = Pick<PersonnelRecord, "displayName" | "title">;
