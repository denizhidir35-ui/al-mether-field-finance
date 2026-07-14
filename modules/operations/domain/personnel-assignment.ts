export type PersonnelAssignment = {
  id: string;
  workOrderId: string;
  personnelIds: readonly string[];
  assignedBy: string;
  assignedAt: string;
  status: "active" | "completed";
};
