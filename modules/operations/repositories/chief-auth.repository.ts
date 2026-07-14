import type { ChiefAccount } from "../domain/chief-account";

export interface ChiefAuthRepository {
  authenticate(personnelNumber: string, password: string): Promise<ChiefAccount | null>;
}
