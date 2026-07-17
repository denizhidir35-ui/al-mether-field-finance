import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bearerToken } from "@/core/workforce/server";

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = bearerToken(request);
    if (!url || !publicKey || !token) throw new Error("Çalışan portalı yapılandırması eksik.");
    const authClient = createClient(url, publicKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) throw new Error("Çalışan oturumu geçersiz.");
    const scoped = createClient(url, publicKey, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: profile, error: profileError } = await scoped.from("profiles").select("employee_code,role").eq("id", authData.user.id).single();
    if (profileError || !profile?.employee_code || !["EMPLOYEE", "PERSONNEL"].includes(String(profile.role))) throw new Error("Çalışan profili bulunamadı.");
    const { data: employee, error: employeeError } = await scoped.from("hr_employees").select("employee_code,display_name,job_title,activation_status,organization_id").eq("employee_code", profile.employee_code).single();
    if (employeeError || !employee) throw employeeError ?? new Error("HR çalışan kaydı bulunamadı.");
    const { data: recipients, error: recipientError } = await scoped.from("hr_document_recipients").select("id,document_id,version_id,status,approval_level,hr_documents(title)").eq("employee_code", profile.employee_code).order("sent_at", { ascending: false });
    if (recipientError) throw recipientError;
    const versionIds = (recipients ?? []).map(row => String(row.version_id));
    const { data: versions, error: versionError } = versionIds.length
      ? await scoped.from("hr_document_versions").select("id,storage_path,status").in("id", versionIds)
      : { data: [], error: null };
    if (versionError) throw versionError;
    const versionById = new Map((versions ?? []).map(version => [String(version.id), version]));
    return NextResponse.json({
      employee: { employeeCode: String(employee.employee_code), displayName: String(employee.display_name), jobTitle: employee.job_title ? String(employee.job_title) : null, activationStatus: String(employee.activation_status), organizationId: employee.organization_id ? String(employee.organization_id) : null },
      documents: (recipients ?? []).map(row => {
        const version = versionById.get(String(row.version_id));
        return {
          id: String(row.id),
          documentId: String(row.document_id),
          versionId: String(row.version_id),
          title: String(Array.isArray(row.hr_documents) ? row.hr_documents[0]?.title ?? "Belge" : (row.hr_documents as { title?: string } | null)?.title ?? "Belge"),
          status: String(row.status),
          approvalLevel: String(row.approval_level),
          hasFile: Boolean(version?.storage_path && version.status === "ACTIVE"),
        };
      }),
    });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Çalışan portalı yüklenemedi." }, { status: 403 }); }
}
