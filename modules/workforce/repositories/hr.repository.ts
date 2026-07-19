import type { HrCreateCommand, HrFoundationSnapshot } from "../domain/hr-foundation";
import type { PersonnelImportPreview, PersonnelImportResult } from "../domain/personnel-import";
import type { HrLeaveAction, HrLeaveCreateInput, HrLeaveFilters, HrLeaveList, HrLeaveRequest } from "../domain/hr-leave";

export interface HrRepository {
  loadFoundation(): Promise<HrFoundationSnapshot>;
  execute(command: HrCreateCommand): Promise<HrFoundationSnapshot>;
  previewPersonnelImport(file: File): Promise<PersonnelImportPreview>;
  commitPersonnelImport(file: File, importBatchId: string): Promise<PersonnelImportResult>;
  listLeaveRequests(filters?: HrLeaveFilters): Promise<HrLeaveList>;
  getLeaveRequest(id: string): Promise<HrLeaveRequest>;
  createLeaveRequest(input: HrLeaveCreateInput): Promise<HrLeaveRequest>;
  transitionLeaveRequest(id: string, action: HrLeaveAction, reason: string, idempotencyKey: string): Promise<HrLeaveRequest>;
}
