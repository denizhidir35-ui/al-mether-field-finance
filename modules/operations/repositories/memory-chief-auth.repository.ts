import type { ChiefAccount } from "../domain/chief-account";
import type { ChiefAuthRepository } from "./chief-auth.repository";

const CHIEF_ACCOUNT: ChiefAccount = {
  id: "chief-mthr001",
  personnelCode: "MTHR001",
  displayName: "Ahmet Yılmaz",
  role: "Chief",
  status: "active",
  assignedProjectCodes: ["ALM-0001"],
  isDemo: false
};

export class MemoryChiefAuthRepository implements ChiefAuthRepository {
  async authenticate(personnelNumber: string, password: string) {
    const normalizedNumber = personnelNumber.trim().toUpperCase();
    if (normalizedNumber !== CHIEF_ACCOUNT.personnelCode || password !== "1234") return null;
    return CHIEF_ACCOUNT;
  }
}
