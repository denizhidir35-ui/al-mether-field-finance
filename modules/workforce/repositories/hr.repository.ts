import type { HrCreateCommand, HrFoundationSnapshot } from "../domain/hr-foundation";
import type { PersonnelImportPreview, PersonnelImportResult } from "../domain/personnel-import";

export interface HrRepository {
  loadFoundation(): Promise<HrFoundationSnapshot>;
  execute(command: HrCreateCommand): Promise<HrFoundationSnapshot>;
  previewPersonnelImport(file: File): Promise<PersonnelImportPreview>;
  commitPersonnelImport(file: File, importBatchId: string): Promise<PersonnelImportResult>;
}
