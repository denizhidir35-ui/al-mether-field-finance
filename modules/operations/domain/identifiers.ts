export type PersonnelCode = `MTHR${string}`;
export type ProjectCode = `ALM-${string}`;
export type TargetCode = `TGT-${string}`;

export const OPERATION_CODE_PATTERNS = {
  personnel: /^MTHR\d{3}$/,
  project: /^ALM-\d{4}$/,
  target: /^TGT-\d{4}$/
} as const;
