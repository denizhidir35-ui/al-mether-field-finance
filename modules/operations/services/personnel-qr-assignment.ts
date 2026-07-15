import type { FieldPersonnelCode } from "../domain/identifiers";
import type { PersonnelRecord } from "../domain/personnel-record";

export function assertPersonnelQrAssignment(personnel: PersonnelRecord | undefined, chiefCode: string, workOrderPersonnel: readonly FieldPersonnelCode[]) {
  if (!personnel || personnel.status !== "active" || personnel.assignedChiefCode !== chiefCode) {
    throw new Error("Bu personel bu Şefe bağlı değil.");
  }
  if (!workOrderPersonnel.includes(personnel.personnelCode)) {
    throw new Error("Bu personel İş Emri ekibinde değil.");
  }
}
