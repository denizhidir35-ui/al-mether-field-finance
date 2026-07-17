import type { HrCreateCommand, HrFoundationSnapshot } from "../domain/hr-foundation";

export interface HrRepository {
  loadFoundation(): Promise<HrFoundationSnapshot>;
  execute(command: HrCreateCommand): Promise<HrFoundationSnapshot>;
}
