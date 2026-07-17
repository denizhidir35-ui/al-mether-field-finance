import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

type WorkforceContext = {
  admin: SupabaseClient;
  scoped: SupabaseClient;
  companyId: string;
  userId: string;
  employeeCode: string | null;
  role: string;
};

function configuredClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !serviceKey) throw new Error("Supabase Workforce sunucu yapılandırması eksik.");
  return {
    publicClient: createClient(url, publicKey, { auth: { persistSession: false } }),
    admin: createClient(url, serviceKey, { auth: { persistSession: false } }),
  };
}

export function bearerToken(request: NextRequest) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

export async function requireWorkforceManager(request: NextRequest): Promise<WorkforceContext> {
  const token = bearerToken(request);
  if (!token) throw new Error("Oturum gerekli.");
  const { publicClient, admin } = configuredClients();
  const { data: authData, error: authError } = await publicClient.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Oturum geçersiz.");
  const { data: profile, error: profileError } = await admin.from("profiles")
    .select("company_id,role,status,is_active,employee_code")
    .eq("id", authData.user.id)
    .single();
  if (profileError || !profile || !["CEO", "PARTNER", "MANAGER", "HR", "PLATFORM_ADMIN"].includes(String(profile.role)) || profile.status !== "ACTIVE" || !profile.is_active) {
    throw new Error("HR yönetim ekranı yetkisi bulunamadı.");
  }
  const scoped = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return {
    admin,
    scoped,
    companyId: String(profile.company_id),
    userId: authData.user.id,
    employeeCode: profile.employee_code ? String(profile.employee_code) : null,
    role: String(profile.role),
  };
}
