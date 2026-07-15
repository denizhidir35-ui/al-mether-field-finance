import type { ChiefAccount } from "../domain/chief-account";
import type { ChiefAuthRepository } from "./chief-auth.repository";
import { OPERATION_CHIEFS } from "../operations.data";

const CHIEF_ACCOUNT: ChiefAccount = OPERATION_CHIEFS[0];

export class MemoryChiefAuthRepository implements ChiefAuthRepository {
  async authenticate(personnelNumber: string, password: string) {
    const normalizedNumber = personnelNumber.trim().toUpperCase();
    if (normalizedNumber !== CHIEF_ACCOUNT.personnelCode || password !== "1234") return null;
    return CHIEF_ACCOUNT;
  }

  getDevelopmentAccount() {
    return process.env.NODE_ENV === "development" ? CHIEF_ACCOUNT : null;
  }
}
