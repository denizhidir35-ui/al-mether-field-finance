import { NextRequest, NextResponse } from "next/server";
import { requireWorkforceManager } from "@/core/workforce/server";
import type { WorkforceMember } from "@/modules/workforce/domain/workforce";
import { generateTemporaryPassword } from "@/modules/workforce/services/temporary-password";

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "HR işlemi tamamlanamadı." }, { status });
}

function text(value: unknown, field: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new Error(`${field} zorunludur.`);
  return result;
}

function phoneNumber(value: unknown) {
  const raw = text(value, "Telefon").replace(/[\s()-]/g, "");
  const normalized = raw.startsWith("0") ? `+90${raw.slice(1)}` : raw;
  if (!/^\+[1-9]\d{9,14}$/.test(normalized)) throw new Error("Telefon uluslararası formatta olmalıdır.");
  return normalized;
}

async function listMembers(admin: Awaited<ReturnType<typeof requireWorkforceManager>>["admin"], companyId: string) {
  const [{ data: chiefs, error: chiefError }, { data: personnel, error: personnelError }] = await Promise.all([
    admin.from("profiles").select("id,display_name,employee_code,status").eq("company_id", companyId).eq("role", "CHIEF").order("employee_code"),
    admin.from("operation_personnel").select("id,display_name,personnel_code,status,assigned_chief_code,qr_value,title").eq("company_id", companyId).order("personnel_code"),
  ]);
  if (chiefError) throw chiefError;
  if (personnelError) throw personnelError;
  const chiefPins = new Map<string, string | null>();
  await Promise.all((chiefs ?? []).map(async row => {
    const { data } = await admin.auth.admin.getUserById(String(row.id));
    const pin = data.user?.user_metadata?.temporary_pin;
    chiefPins.set(String(row.id), typeof pin === "string" && /^\d{4}$/.test(pin) ? pin : null);
  }));
  return [
    ...(chiefs ?? []).map(row => ({ id: String(row.id), displayName: String(row.display_name), employeeCode: String(row.employee_code), role: "CHIEF", status: String(row.status), assignedChiefCode: null, qrValue: null, title: null, temporaryPin: chiefPins.get(String(row.id)) ?? null })),
    ...(personnel ?? []).map(row => ({ id: String(row.id), displayName: String(row.display_name), employeeCode: String(row.personnel_code), role: "PERSONNEL", status: String(row.status), assignedChiefCode: row.assigned_chief_code ? String(row.assigned_chief_code) : null, qrValue: String(row.qr_value), title: String(row.title) })),
  ] as WorkforceMember[];
}

export async function GET(request: NextRequest) {
  try {
    const { admin, companyId } = await requireWorkforceManager(request);
    return NextResponse.json({ members: await listMembers(admin, companyId) });
  } catch (error) { return errorResponse(error, 403); }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, scoped, companyId, userId } = await requireWorkforceManager(request);
    const body = await request.json() as Record<string, unknown>;
    const role = text(body.role, "Rol").toUpperCase();
    const displayName = text(body.displayName, "Ad soyad");

    if (role === "CHIEF") {
      const { data: codeData, error: codeError } = await admin.rpc("next_workforce_chief_code");
      if (codeError || !codeData) throw codeError ?? new Error("Şef kodu üretilemedi.");
      const employeeCode = String(codeData);
      const temporaryPassword = generateTemporaryPassword();
      const internalEmail = `${employeeCode.toLowerCase()}@almether.com`;
      const { data: authData, error: authError } = await admin.auth.admin.createUser({ email: internalEmail, password: temporaryPassword, email_confirm: true, user_metadata: { display_name: displayName, employee_code: employeeCode, temporary_pin: temporaryPassword } });
      if (authError || !authData.user) throw authError ?? new Error("Şef Auth kaydı oluşturulamadı.");
      const { error: profileError } = await admin.from("profiles").insert({ id: authData.user.id, company_id: companyId, email: internalEmail, display_name: displayName, role: "CHIEF", employee_code: employeeCode, status: "ACTIVE", is_active: true });
      if (profileError) {
        await admin.auth.admin.updateUserById(authData.user.id, { ban_duration: "876000h" });
        throw profileError;
      }
      const { error: membershipError } = await admin.from("company_memberships").insert({ company_id: companyId, user_id: authData.user.id, email: internalEmail, display_name: displayName, role: "CHIEF", is_active: true });
      if (membershipError) throw membershipError;
      const { error: employeeError } = await admin.from("hr_employees").upsert({ company_id: companyId, employee_code: employeeCode, profile_id: authData.user.id, display_name: displayName, job_title: "Saha Şefi", hr_role: "CHIEF", activation_status: "ACTIVE", status: "ACTIVE" }, { onConflict: "company_id,employee_code" });
      if (employeeError) throw employeeError;
      const { error: eventError } = await scoped.from("hr_events").insert({ company_id: companyId, aggregate_type: "EMPLOYEE", aggregate_id: employeeCode, event_type: "EMPLOYEE_CREATED", payload: { employeeCode, displayName, hrRole: "CHIEF" }, actor_user_id: userId, deduplication_key: crypto.randomUUID() });
      if (eventError) throw eventError;
      const member = (await listMembers(admin, companyId)).find(item => item.employeeCode === employeeCode);
      if (!member) throw new Error("Kaydedilen Şef okunamadı.");
      return NextResponse.json({ member, temporaryPassword }, { status: 201 });
    }

    if (role === "PERSONNEL") {
      const assignedChiefCode = text(body.assignedChiefCode, "Şef").toUpperCase();
      const phone = phoneNumber(body.phone);
      const { data: chief } = await admin.from("profiles").select("id").eq("company_id", companyId).eq("employee_code", assignedChiefCode).eq("role", "CHIEF").eq("status", "ACTIVE").maybeSingle();
      if (!chief) throw new Error("Seçilen aktif Şef bulunamadı.");
      const { data: codeData, error: codeError } = await admin.rpc("next_workforce_personnel_code");
      if (codeError || !codeData) throw codeError ?? new Error("Personel kodu üretilemedi.");
      const personnelCode = String(codeData);
      const internalEmail = `${personnelCode.toLowerCase()}@employee.almether.internal`;
      const { data: authData, error: authError } = await admin.auth.admin.createUser({ phone, phone_confirm: false, user_metadata: { display_name: displayName, employee_code: personnelCode } });
      if (authError || !authData.user) throw authError ?? new Error("Personel portal hesabı oluşturulamadı.");
      const { error: profileError } = await admin.from("profiles").insert({ id: authData.user.id, company_id: companyId, email: internalEmail, phone, display_name: displayName, role: "EMPLOYEE", employee_code: personnelCode, status: "ACTIVE", is_active: true, activation_status: "PENDING_PHONE" });
      if (profileError) throw profileError;
      const { error: membershipError } = await admin.from("company_memberships").insert({ company_id: companyId, user_id: authData.user.id, email: internalEmail, display_name: displayName, role: "EMPLOYEE", is_active: true });
      if (membershipError) throw membershipError;
      const { data: created, error: personnelError } = await admin.from("operation_personnel").insert({ company_id: companyId, personnel_code: personnelCode, display_name: displayName, title: typeof body.title === "string" ? body.title.trim() || "Saha Personeli" : "Saha Personeli", status: "ACTIVE", assigned_chief_code: assignedChiefCode, qr_value: "AUTO", created_by: userId }).select("id,personnel_code").single();
      if (personnelError || !created) throw personnelError ?? new Error("Personel kaydedilemedi.");
      const { error: employeeError } = await admin.from("hr_employees").upsert({ company_id: companyId, employee_code: personnelCode, profile_id: authData.user.id, operation_personnel_id: created.id, display_name: displayName, phone, job_title: typeof body.title === "string" ? body.title.trim() || "Saha Personeli" : "Saha Personeli", hr_role: "EMPLOYEE", manager_employee_code: assignedChiefCode, activation_status: "PENDING_PHONE", status: "ACTIVE" }, { onConflict: "company_id,employee_code" });
      if (employeeError) throw employeeError;
      const { error: grantError } = await admin.from("hr_access_grants").insert({ company_id: companyId, profile_id: authData.user.id, access_role: "EMPLOYEE", scope_type: "SELF", employee_code: personnelCode });
      if (grantError) throw grantError;
      const { error: eventError } = await scoped.from("hr_events").insert({ company_id: companyId, aggregate_type: "EMPLOYEE", aggregate_id: personnelCode, event_type: "EMPLOYEE_CREATED", payload: { employeeCode: personnelCode, displayName, hrRole: "EMPLOYEE", operationPersonnelId: created.id }, actor_user_id: userId, deduplication_key: crypto.randomUUID() });
      if (eventError) throw eventError;
      const member = (await listMembers(admin, companyId)).find(item => item.employeeCode === created.personnel_code);
      if (!member) throw new Error("Kaydedilen personel okunamadı.");
      return NextResponse.json({ member }, { status: 201 });
    }
    throw new Error("Yalnız Şef veya Personel oluşturulabilir.");
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin, companyId } = await requireWorkforceManager(request);
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "RESET_CHIEF_PIN") {
      const chiefCode = text(body.chiefCode, "Şef No").toUpperCase();
      const { data: chief, error: chiefError } = await admin.from("profiles").select("id").eq("company_id", companyId).eq("employee_code", chiefCode).eq("role", "CHIEF").eq("status", "ACTIVE").maybeSingle();
      if (chiefError) throw chiefError;
      if (!chief) throw new Error("Aktif Şef bulunamadı.");
      const temporaryPassword = generateTemporaryPassword();
      const { data: authUser, error: authReadError } = await admin.auth.admin.getUserById(String(chief.id));
      if (authReadError || !authUser.user) throw authReadError ?? new Error("Şef Auth kaydı bulunamadı.");
      const { error: authError } = await admin.auth.admin.updateUserById(String(chief.id), { password: temporaryPassword, user_metadata: { ...authUser.user.user_metadata, temporary_pin: temporaryPassword } });
      if (authError) throw authError;
      const member = (await listMembers(admin, companyId)).find(item => item.employeeCode === chiefCode);
      if (!member) throw new Error("Güncellenen Şef okunamadı.");
      return NextResponse.json({ member, temporaryPassword });
    }
    const personnelCode = text(body.personnelCode, "Personel No").toUpperCase();
    const assignedChiefCode = text(body.assignedChiefCode, "Şef").toUpperCase();
    const { data: chief, error: chiefError } = await admin.from("profiles").select("id").eq("company_id", companyId).eq("employee_code", assignedChiefCode).eq("role", "CHIEF").eq("status", "ACTIVE").maybeSingle();
    if (chiefError) throw chiefError;
    if (!chief) throw new Error("Seçilen aktif Şef bulunamadı.");
    const { data: updated, error: personnelError } = await admin.from("operation_personnel").update({ assigned_chief_code: assignedChiefCode, updated_at: new Date().toISOString() }).eq("company_id", companyId).eq("personnel_code", personnelCode).select("personnel_code").maybeSingle();
    if (personnelError) throw personnelError;
    if (!updated) throw new Error("Personel bulunamadı.");
    const member = (await listMembers(admin, companyId)).find(item => item.employeeCode === personnelCode);
    if (!member) throw new Error("Güncellenen personel okunamadı.");
    return NextResponse.json({ member });
  } catch (error) { return errorResponse(error); }
}
