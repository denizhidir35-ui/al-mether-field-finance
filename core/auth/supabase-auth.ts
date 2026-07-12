import type { User } from "@supabase/supabase-js";
import { supabase } from "@/core/supabase/client";
import type { AppRole, AppUser } from "@/types/auth";

type MembershipRow = {
  company_id: string;
  email: string;
  display_name: string;
  role: string;
};

function toAppRole(role: string): AppRole {
  const normalized = role.trim().toUpperCase();
  if (normalized === "CEO" || normalized === "PARTNER" || normalized === "ASSISTANT") {
    return normalized;
  }
  return "ASSISTANT";
}

async function loadMembership(user: User): Promise<AppUser> {
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");

  const { data, error } = await supabase
    .from("company_memberships")
    .select("company_id,email,display_name,role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Bu kullanıcı için aktif şirket üyeliği bulunamadı.");

  const membership = data as MembershipRow;
  const role = toAppRole(membership.role);
  return {
    id: user.id,
    companyId: membership.company_id,
    name: membership.display_name,
    email: membership.email.toLowerCase(),
    role,
    title: role === "CEO" ? "Co-Founder & CEO" : role === "PARTNER" ? "Co-Founder" : "Executive Assistant",
  };
}

export async function getAuthenticatedAppUser(): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return loadMembership(data.user);
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (!supabase) throw new Error("Supabase bağlantısı yapılandırılmamış.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  try {
    return await loadMembership(data.user);
  } catch (membershipError) {
    await supabase.auth.signOut();
    throw membershipError;
  }
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
