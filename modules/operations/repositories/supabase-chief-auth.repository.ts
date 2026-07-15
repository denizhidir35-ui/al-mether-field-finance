import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChiefAccount } from "../domain/chief-account";
import type { ChiefCode, ProjectCode } from "../domain/identifiers";
import type { ChiefAuthRepository } from "./chief-auth.repository";

type ChiefProfileRow = {
  display_name: string;
  employee_code: string;
  role: string;
  status: string;
};

function chiefAuthEmail(employeeCode: string) {
  return `${employeeCode.toLowerCase()}@almether.com`;
}

export class SupabaseChiefAuthRepository implements ChiefAuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async authenticate(personnelNumber: string, password: string) {
    const employeeCode = personnelNumber.trim().toUpperCase();
    if (!/^SMTHR\d{6}$/.test(employeeCode) || !password) return null;

    const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
      email: chiefAuthEmail(employeeCode),
      password,
    });
    if (authError) return null;

    const { data: profileData, error: profileError } = await this.client
      .from("profiles")
      .select("display_name,employee_code,role,status")
      .eq("id", authData.user.id)
      .maybeSingle();
    const profile = profileData as ChiefProfileRow | null;
    if (profileError || !profile || profile.employee_code !== employeeCode || profile.role !== "CHIEF" || profile.status !== "ACTIVE") {
      await this.client.auth.signOut();
      return null;
    }

    const { data: workOrders, error: workOrderError } = await this.client
      .from("work_orders")
      .select("project_code")
      .eq("assigned_chief_id", employeeCode)
      .in("status", ["assigned", "active"]);
    if (workOrderError) {
      await this.client.auth.signOut();
      return null;
    }

    return {
      id: employeeCode,
      personnelCode: employeeCode as ChiefCode,
      displayName: profile.display_name,
      role: "Chief",
      status: "active",
      assignedProjectCodes: (workOrders ?? []).map(row => row.project_code as ProjectCode),
    } satisfies ChiefAccount;
  }

  getDevelopmentAccount() { return null; }

  async signOut() {
    await this.client.auth.signOut();
  }
}
