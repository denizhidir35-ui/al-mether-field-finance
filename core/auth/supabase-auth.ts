import type { User } from "@supabase/supabase-js";
import { supabase } from "@/core/supabase/client";
import type { AppRole, AppUser } from "@/types/auth";

type ProfileRow = {
  company_id: string;
  email: string;
  display_name: string;
  role: string;
  employee_code?: string | null;
};

function databaseErrorMessage(error: { message?: string; code?: string }) {
  if (error.code === "42P01" || error.code === "PGRST205") {
    return "Şirket profilleri henüz Supabase veritabanında kurulmamış.";
  }
  return error.message || "Şirket profili yüklenemedi.";
}

function toAppRole(role: string): AppRole {
  const normalized = role.trim().toUpperCase();
  if (["CEO", "PARTNER", "ASSISTANT", "MANAGER", "CHIEF", "PERSONNEL", "HR", "OFFICE", "EMPLOYEE", "PLATFORM_ADMIN"].includes(normalized)) {
    return normalized as AppRole;
  }
  return "ASSISTANT";
}

async function loadProfile(user: User): Promise<AppUser> {
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");

  const { data, error } = await supabase
    .from("profiles")
    .select("company_id,email,display_name,role,employee_code")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(databaseErrorMessage(error));
  if (!data) throw new Error("Bu kullanıcı için aktif şirket profili bulunamadı.");

  const profile = data as ProfileRow;
  const role = toAppRole(profile.role);
  if (role === "CHIEF" || role === "PERSONNEL") {
    throw new Error("Bu hesap Company Platform CEO oturumunda kullanılamaz. Şef girişini kullanın.");
  }
  const [{ data: licenses }, { data: permissions }] = await Promise.all([
    supabase.from("hr_company_licenses").select("module_code").eq("company_id", profile.company_id).eq("is_active", true),
    supabase.from("hr_role_permissions").select("permission_code").eq("company_id", profile.company_id).eq("role", role).eq("is_allowed", true),
  ]);
  return {
    id: user.id,
    companyId: profile.company_id,
    name: profile.display_name,
    email: profile.email.toLowerCase(),
    role,
    title: role === "CEO" ? "Co-Founder & CEO" : role === "PARTNER" ? "Co-Founder" : role === "HR" ? "Human Resources" : role === "MANAGER" ? "Manager" : role === "EMPLOYEE" ? "Employee" : role === "PLATFORM_ADMIN" ? "Platform Admin" : "Executive Assistant",
    platformUserCode: profile.employee_code ?? undefined,
    licensedModules: licenses?.map(item => String(item.module_code)),
    permissions: permissions?.map(item => String(item.permission_code)),
  };
}

export async function getAuthenticatedAppUser(): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return loadProfile(data.user);
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (!supabase) throw new Error("Supabase bağlantısı yapılandırılmamış.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  try {
    return await loadProfile(data.user);
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
}

export async function signInEmployee(phone: string, password: string): Promise<AppUser> {
  if (!supabase) throw new Error("Supabase bağlantısı yapılandırılmamış.");
  const { data, error } = await supabase.auth.signInWithPassword({ phone: phone.trim(), password });
  if (error) throw error;
  return loadProfile(data.user);
}

export async function requestEmployeeActivation(phone: string) {
  if (!supabase) throw new Error("Supabase bağlantısı yapılandırılmamış.");
  const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim(), options: { shouldCreateUser: false } });
  if (error) throw error;
}

export async function completeEmployeeActivation(phone: string, token: string, password: string): Promise<AppUser> {
  if (!supabase) throw new Error("Supabase bağlantısı yapılandırılmamış.");
  const { data, error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: token.trim(), type: "sms" });
  if (error || !data.user || !data.session) throw error ?? new Error("Telefon doğrulanamadı.");
  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) throw passwordError;
  const response = await fetch("/api/hr/activate", { method: "POST", headers: { authorization: `Bearer ${data.session.access_token}` } });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || "Personel hesabı aktifleştirilemedi.");
  return loadProfile(data.user);
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
