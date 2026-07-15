export type ManagementCode = `CMTHR${string}`;
export type ChiefCode = `SMTHR${string}`;
export type OfficeCode = `OMTHR${string}`;
export type FieldPersonnelCode = `PMTHR${string}`;
export type PlatformUserCode = ManagementCode | ChiefCode | OfficeCode | FieldPersonnelCode;
export type ProjectCode = `ALM-${string}`;
export type TargetCode = `TGT-${string}`;
export type WorkOrderCode = `ALM-${string}`;
export type WorkOrderId = `work-order-${string}`;

export const OPERATION_CODE_PATTERNS = {
  management: /^CMTHR\d{6}$/,
  chief: /^SMTHR\d{6}$/,
  office: /^OMTHR\d{6}$/,
  fieldPersonnel: /^PMTHR\d{6}$/,
  project: /^ALM-\d{4}$/,
  target: /^TGT-\d{4}$/
} as const;
