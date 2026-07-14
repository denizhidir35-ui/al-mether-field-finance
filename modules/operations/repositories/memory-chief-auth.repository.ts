import type { ChiefAccount } from "../domain/chief-account";
import type { ChiefAuthRepository } from "./chief-auth.repository";

const DEMO_CHIEF: ChiefAccount = {
  id: "chief-mthr001",
  personnelCode: "MTHR001",
  displayName: "Ahmet Yılmaz",
  role: "Chief",
  status: "active",
  assignedProjectCodes: ["ALM-0001"],
  isDemo: true
};

export class MemoryChiefAuthRepository implements ChiefAuthRepository {
  async authenticate(personnelNumber: string, password: string) {
    const normalizedNumber = personnelNumber.trim().toUpperCase();
    if (normalizedNumber !== DEMO_CHIEF.personnelCode || password !== "1234") return null;
    return DEMO_CHIEF;
  }
}
