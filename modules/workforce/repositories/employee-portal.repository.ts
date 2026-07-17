export type EmployeePortalSnapshot = {
  employee: { employeeCode: string; displayName: string; jobTitle: string | null; activationStatus: string; organizationId: string | null };
  documents: { id: string; title: string; status: string; approvalLevel: string }[];
};

export interface EmployeePortalRepository { loadSelf(): Promise<EmployeePortalSnapshot>; }
