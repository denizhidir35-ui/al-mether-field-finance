export const PERSONNEL_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const PERSONNEL_IMPORT_MAX_ROWS = 1000;

export type PersonnelImportRawRow = {
  rowNumber: number;
  employeeCode: string;
  displayName: string;
  phone: string;
  email: string;
  jobTitle: string;
  chiefCode: string;
  organizationCode: string;
  departmentCode: string;
  teamCode: string;
};

export type PersonnelImportNormalizedRow = PersonnelImportRawRow & {
  phone: string;
  email: string;
  employeeCode: string;
  chiefCode: string;
  organizationCode: string;
  departmentCode: string;
  teamCode: string;
  organizationId: string | null;
  departmentId: string | null;
  teamId: string | null;
};

export type PersonnelImportIssue = {
  field: keyof PersonnelImportRawRow | "row";
  severity: "WARNING" | "ERROR";
  message: string;
};

export type PersonnelImportPreviewRow = {
  rowNumber: number;
  status: "VALID" | "WARNING" | "ERROR";
  values: PersonnelImportNormalizedRow;
  issues: PersonnelImportIssue[];
};

export type PersonnelImportSummary = {
  total: number;
  valid: number;
  warning: number;
  error: number;
  skipped: number;
};

export type PersonnelImportPreview = {
  importBatchId: string;
  fileName: string;
  summary: PersonnelImportSummary;
  rows: PersonnelImportPreviewRow[];
};

export type PersonnelImportResultRow = {
  rowNumber: number;
  employeeCode: string | null;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  workflowStatus: "COMPLETED" | "FAILED" | "COMPENSATED" | "MANUAL_REVIEW";
  message: string;
};

export type PersonnelImportResult = {
  importBatchId: string;
  processingModel: "SAGA_COMPENSATION";
  summary: { total: number; success: number; failed: number; skipped: number };
  rows: PersonnelImportResultRow[];
};

export type PersonnelImportReferences = {
  chiefs: Array<{ employeeCode: string }>;
  organizations: Array<{ id: string; code: string }>;
  departments: Array<{ id: string; code: string; organizationId: string }>;
  teams: Array<{ id: string; code: string; departmentId: string }>;
  existing: { employeeCodes: string[]; emails: string[]; phones: string[] };
};
