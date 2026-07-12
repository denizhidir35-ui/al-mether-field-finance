import "server-only";

import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export type ServerMailUser = {
  id: string;
  companyId: string;
  email: string;
  displayName: string;
};

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !serviceKey) throw new Error("Supabase sunucu yapılandırması eksik.");
  return {
    publicClient: createClient(url, publicKey, { auth: { persistSession: false } }),
    adminClient: createClient(url, serviceKey, { auth: { persistSession: false } }),
  };
}

export async function requireMailUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Oturum gerekli.");

  const { publicClient, adminClient } = clients();
  const { data: authData, error: authError } = await publicClient.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Oturum geçersiz.");

  const { data: profile, error: profileError } = await adminClient.from("profiles")
    .select("company_id,email,display_name")
    .eq("id", authData.user.id).eq("is_active", true).single();
  if (profileError || !profile) throw new Error("Aktif şirket profili bulunamadı.");

  return {
    user: {
      id: authData.user.id,
      companyId: profile.company_id as string,
      email: (profile.email as string).toLowerCase(),
      displayName: profile.display_name as string,
    } satisfies ServerMailUser,
    adminClient,
  };
}
