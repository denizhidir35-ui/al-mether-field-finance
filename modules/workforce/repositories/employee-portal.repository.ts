export type EmployeePortalSnapshot = {
  employee: { employeeCode: string; displayName: string; jobTitle: string | null; activationStatus: string; organizationId: string | null };
  documents: { id: string; documentId: string; versionId: string; title: string; status: string; approvalLevel: string; hasFile: boolean }[];
};

export type HrSignedDocumentAccess = { url: string; expiresIn: number; expiresAt: string; mode: "view" | "download" };

export interface EmployeePortalRepository {
  loadSelf(): Promise<EmployeePortalSnapshot>;
  accessDocument(documentId: string, versionId: string, mode: "view" | "download"): Promise<HrSignedDocumentAccess>;
}
