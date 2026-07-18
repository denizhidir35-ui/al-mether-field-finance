export type HrSection =
  | "dashboard"
  | "employees"
  | "organizations"
  | "departments"
  | "teams"
  | "leave"
  | "payroll"
  | "documents"
  | "personnel-file"
  | "identity-settings"
  | "assets"
  | "notifications";

export type HrOrganization = { id: string; code: string; name: string; status: string };
export type HrDepartment = { id: string; organizationId: string; code: string; name: string; managerEmployeeCode: string | null; status: string };
export type HrTeam = { id: string; departmentId: string; code: string; name: string; managerEmployeeCode: string | null; status: string };
export type HrEmployee = {
  id: string;
  employeeCode: string;
  displayName: string;
  phone: string | null;
  jobTitle: string | null;
  hrRole: "HR" | "MANAGER" | "EMPLOYEE" | "PLATFORM_ADMIN" | "CHIEF";
  organizationId: string | null;
  departmentId: string | null;
  teamId: string | null;
  managerEmployeeCode: string | null;
  activationStatus: string;
  status: string;
};
export type HrDocument = { id: string; documentCode: string; title: string; status: string; version: number; recipientCount: number };

export type HrFoundationSnapshot = {
  organizations: HrOrganization[];
  departments: HrDepartment[];
  teams: HrTeam[];
  employees: HrEmployee[];
  documents: HrDocument[];
  counts: { leave: number; payroll: number; assets: number; notifications: number; pendingActivation: number };
};

export type HrCreateCommand =
  | { action: "CREATE_ORGANIZATION"; name: string; code?: string }
  | { action: "CREATE_DEPARTMENT"; organizationId: string; name: string; code?: string }
  | { action: "CREATE_TEAM"; departmentId: string; name: string; code?: string }
  | { action: "CREATE_DOCUMENT"; title: string; content: string };
