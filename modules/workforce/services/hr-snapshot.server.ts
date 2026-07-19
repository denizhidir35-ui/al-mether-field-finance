import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HrFoundationSnapshot } from "../domain/hr-foundation";

export async function buildHrFoundationSnapshot({ scoped, companyId }: { scoped: SupabaseClient; companyId: string }): Promise<HrFoundationSnapshot> {
  const todayUtc = new Date().toISOString().slice(0, 10);
  const [organizations, departments, teams, employees, documents, leave, pendingLeave, todayOnLeave, payroll, assets, notifications] = await Promise.all([
    scoped.from("hr_organizations").select("id,code,name,status").eq("company_id", companyId).order("name"),
    scoped.from("hr_departments").select("id,organization_id,code,name,manager_employee_code,status").eq("company_id", companyId).order("name"),
    scoped.from("hr_teams").select("id,department_id,code,name,manager_employee_code,status").eq("company_id", companyId).order("name"),
    scoped.from("hr_employees").select("id,employee_code,display_name,phone,job_title,hr_role,organization_id,department_id,team_id,manager_employee_code,activation_status,status").eq("company_id", companyId).order("display_name"),
    scoped.from("hr_documents").select("id,document_code,title,status,hr_document_versions(version),hr_document_recipients(count)").eq("company_id", companyId).order("created_at", { ascending: false }),
    scoped.from("hr_leave_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    scoped.from("hr_leave_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "PENDING"),
    scoped.from("hr_leave_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "APPROVED").lte("starts_on", todayUtc).gte("ends_on", todayUtc),
    scoped.from("hr_payroll_records").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    scoped.from("hr_asset_assignments").select("id", { count: "exact", head: true }).eq("company_id", companyId).is("returned_at", null),
    scoped.from("hr_notifications").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_read", false),
  ]);
  const failed = [organizations, departments, teams, employees, documents, leave, pendingLeave, todayOnLeave, payroll, assets, notifications].find(result => result.error);
  if (failed?.error) {
    if (failed.error.code === "42P01" || failed.error.code === "PGRST205") throw new Error("HR Foundation migration henüz Supabase üzerinde çalıştırılmamış.");
    throw failed.error;
  }

  return {
    organizations: (organizations.data ?? []).map(row => ({ id: String(row.id), code: String(row.code), name: String(row.name), status: String(row.status) })),
    departments: (departments.data ?? []).map(row => ({ id: String(row.id), organizationId: String(row.organization_id), code: String(row.code), name: String(row.name), managerEmployeeCode: row.manager_employee_code ? String(row.manager_employee_code) : null, status: String(row.status) })),
    teams: (teams.data ?? []).map(row => ({ id: String(row.id), departmentId: String(row.department_id), code: String(row.code), name: String(row.name), managerEmployeeCode: row.manager_employee_code ? String(row.manager_employee_code) : null, status: String(row.status) })),
    employees: (employees.data ?? []).map(row => ({ id: String(row.id), employeeCode: String(row.employee_code), displayName: String(row.display_name), phone: row.phone ? String(row.phone) : null, jobTitle: row.job_title ? String(row.job_title) : null, hrRole: String(row.hr_role) as "HR" | "MANAGER" | "EMPLOYEE" | "PLATFORM_ADMIN" | "CHIEF", organizationId: row.organization_id ? String(row.organization_id) : null, departmentId: row.department_id ? String(row.department_id) : null, teamId: row.team_id ? String(row.team_id) : null, managerEmployeeCode: row.manager_employee_code ? String(row.manager_employee_code) : null, activationStatus: String(row.activation_status), status: String(row.status) })),
    documents: (documents.data ?? []).map(row => {
      const versions = Array.isArray(row.hr_document_versions) ? row.hr_document_versions : [];
      const recipients = Array.isArray(row.hr_document_recipients) ? row.hr_document_recipients : [];
      return { id: String(row.id), documentCode: String(row.document_code), title: String(row.title), status: String(row.status), version: Math.max(0, ...versions.map(item => Number(item.version) || 0)), recipientCount: Number(recipients[0]?.count ?? 0) };
    }),
    counts: { leave: leave.count ?? 0, pendingLeave: pendingLeave.count ?? 0, todayOnLeave: todayOnLeave.count ?? 0, payroll: payroll.count ?? 0, assets: assets.count ?? 0, notifications: notifications.count ?? 0, pendingActivation: (employees.data ?? []).filter(row => row.activation_status !== "ACTIVE").length },
  };
}
