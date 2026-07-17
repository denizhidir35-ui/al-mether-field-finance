import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bearerToken } from "@/core/workforce/server";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = bearerToken(request);
    if (!url || !publicKey || !serviceKey || !token) throw new Error("Aktivasyon yapılandırması eksik.");
    const publicClient = createClient(url, publicKey, { auth: { persistSession: false } });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await publicClient.auth.getUser(token);
    if (error || !data.user) throw new Error("Aktivasyon oturumu geçersiz.");
    const { data: profile, error: profileError } = await admin.from("profiles").select("company_id,employee_code,role").eq("id", data.user.id).single();
    if (profileError || !profile || profile.role !== "EMPLOYEE" || !profile.employee_code) throw new Error("Personel portal kaydı bulunamadı.");
    const { error: updateError } = await admin.from("profiles").update({ activation_status: "ACTIVE", updated_at: new Date().toISOString() }).eq("id", data.user.id);
    if (updateError) throw updateError;
    const { error: employeeError } = await admin.from("hr_employees").update({ activation_status: "ACTIVE", updated_at: new Date().toISOString() }).eq("company_id", profile.company_id).eq("employee_code", profile.employee_code);
    if (employeeError) throw employeeError;
    return NextResponse.json({ activated: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Aktivasyon tamamlanamadı." }, { status: 400 });
  }
}
