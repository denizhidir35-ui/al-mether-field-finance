import type { User } from "@supabase/supabase-js";
import { supabase } from "@/core/supabase/client";
import type { AppRole, AppUser } from "@/types/auth";

type ProfileRow = {
  company_id: string;
  email: string;
  display_name: string;
  role: string;
};

function databaseErrorMessage(error: { message?: string; code?: string }) {
  if (error.code === "42P01" || error.code === "PGRST205") {
    return "Şirket profilleri henüz Supabase veritabanında kurulmamış.";
  }
  return error.message || "Şirket profili yüklenemedi.";
}

function toAppRole(role: string): AppRole {
  const normalized = role.trim().toUpperCase();
  if (normalized === "CEO" || normalized === "PARTNER" || normalized === "ASSISTANT") {
    return normalized;
  }
  return "ASSISTANT";
}

async function loadProfile(user: User): Promise<AppUser> {
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");

  const { data, error } = await supabase
    .from("profiles")
    .select("company_id,email,display_name,role")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(databaseErrorMessage(error));
  if (!data) throw new Error("Bu kullanıcı için aktif şirket profili bulunamadı.");

  const profile = data as ProfileRow;
  const role = toAppRole(profile.role);
  return {
    id: user.id,
    companyId: profile.company_id,
    name: profile.display_name,
    email: profile.email.toLowerCase(),
    role,
    title: role === "CEO" ? "Co-Founder & CEO" : role === "PARTNER" ? "Co-Founder" : "Executive Assistant",
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

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
