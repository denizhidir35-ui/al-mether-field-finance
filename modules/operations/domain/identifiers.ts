export type PersonnelCode = `MTHR${string}`;
export type FieldPersonnelCode = `PRS${string}`;
export type ProjectCode = `ALM-${string}`;
export type TargetCode = `TGT-${string}`;
export type WorkOrderCode = `ALM-${string}`;
export type WorkOrderId = `work-order-${string}`;

export const OPERATION_CODE_PATTERNS = {
  personnel: /^MTHR\d{3}$/,
  fieldPersonnel: /^PRS\d{6}$/,
  project: /^ALM-\d{4}$/,
  target: /^TGT-\d{4}$/
} as const;
