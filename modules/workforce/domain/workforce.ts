export type WorkforceRole = "CHIEF" | "PERSONNEL";

export type WorkforceMember = {
  id: string;
  displayName: string;
  employeeCode: string;
  role: WorkforceRole;
  status: "ACTIVE" | "PASSIVE" | "ARCHIVED";
  assignedChiefCode: string | null;
  qrValue: string | null;
  title: string | null;
  temporaryPin?: string | null;
};

export type CreateChief = { role: "CHIEF"; displayName: string };
export type CreatePersonnel = { role: "PERSONNEL"; displayName: string; title: string; assignedChiefCode: string };
export type CreateWorkforceMember = CreateChief | CreatePersonnel;
export type WorkforceMutationResult = { member: WorkforceMember; temporaryPassword?: string };
