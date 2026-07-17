import { NextRequest, NextResponse } from "next/server";
import { requireWorkforceIdentity, requireWorkforceManager } from "@/core/workforce/server";
import {
  isEmployeeScopedStoragePath,
  parseHrDocumentAccessMode,
  resolveHrSignedUrlTtl,
  safeDownloadName,
} from "@/modules/workforce/services/hr-storage-access";

type RouteContext = { params: Promise<{ documentId: string; versionId: string }> };

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Belge erişimi tamamlanamadı." }, { status });
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  try {
    const context = await requireWorkforceIdentity(request);
    const { documentId, versionId } = await routeContext.params;
    const mode = parseHrDocumentAccessMode(request.nextUrl.searchParams.get("mode"));
    const ttlSeconds = resolveHrSignedUrlTtl(process.env.HR_SIGNED_URL_TTL_SECONDS);

    const { data: version, error: versionError } = await context.scoped
      .from("hr_document_versions")
      .select("id,company_id,document_id,employee_code,storage_path,status,sensitivity,hr_documents(title)")
      .eq("company_id", context.companyId)
      .eq("document_id", documentId)
      .eq("id", versionId)
      .single();
    if (versionError || !version) throw new Error("Belge sürümü bulunamadı veya erişim yetkiniz yok.");
    if (version.status !== "ACTIVE") throw new Error("Arşivlenmiş belge sürümü açılamaz.");
    if (!version.employee_code || !version.storage_path) throw new Error("Belge dosyası henüz yüklenmemiş.");
    if (!isEmployeeScopedStoragePath(version.storage_path, context.companyId, version.employee_code)) {
      throw new Error("Belge storage kapsamı geçersiz.");
    }

    const titleRelation = version.hr_documents as unknown as { title?: string } | { title?: string }[] | null;
    const title = Array.isArray(titleRelation) ? titleRelation[0]?.title : titleRelation?.title;
    const options = mode === "download" ? { download: safeDownloadName(title || "hr-document") } : undefined;
    const { data: signed, error: signedError } = await context.scoped.storage
      .from("hr-private")
      .createSignedUrl(version.storage_path, ttlSeconds, options);
    if (signedError || !signed?.signedUrl) throw new Error("Güvenli belge bağlantısı üretilemedi.");

    const eventType = mode === "download" ? "DOWNLOADED" : "VIEWED";
    const auditMetadata = {
      versionId,
      mode,
      ttlSeconds,
      sensitivity: version.sensitivity,
      storageEmployeeCode: version.employee_code,
    };
    const { error: documentAuditError } = await context.admin.from("hr_document_audit_events").insert({
      company_id: context.companyId,
      document_id: documentId,
      employee_code: context.employeeCode,
      event_type: eventType,
      metadata: auditMetadata,
      actor_user_id: context.userId,
    });
    if (documentAuditError) throw documentAuditError;
    const { error: securityAuditError } = await context.admin.from("hr_security_audit_logs").insert({
      company_id: context.companyId,
      actor_user_id: context.userId,
      action: `DOCUMENT_${eventType}`,
      resource_type: "HR_DOCUMENT_VERSION",
      resource_id: versionId,
      result: "ALLOWED",
      request_metadata: auditMetadata,
    });
    if (securityAuditError) throw securityAuditError;

    return NextResponse.json({
      url: signed.signedUrl,
      expiresIn: ttlSeconds,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      mode,
    });
  } catch (error) {
    return errorResponse(error, 403);
  }
}

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  try {
    const context = await requireWorkforceManager(request);
    const { documentId, versionId } = await routeContext.params;
    const { data: version, error: versionError } = await context.scoped
      .from("hr_document_versions")
      .select("id,status")
      .eq("company_id", context.companyId)
      .eq("document_id", documentId)
      .eq("id", versionId)
      .single();
    if (versionError || !version) throw new Error("Belge sürümü bulunamadı.");
    if (version.status === "ARCHIVED") return NextResponse.json({ status: "ARCHIVED" });

    const archivedAt = new Date().toISOString();
    const { error: archiveError } = await context.scoped.from("hr_document_versions").update({
      status: "ARCHIVED",
      archived_at: archivedAt,
      archived_by: context.userId,
    }).eq("company_id", context.companyId).eq("document_id", documentId).eq("id", versionId);
    if (archiveError) throw archiveError;
    const { error: auditError } = await context.admin.from("hr_document_audit_events").insert({
      company_id: context.companyId,
      document_id: documentId,
      employee_code: context.employeeCode,
      event_type: "ARCHIVED",
      metadata: { versionId },
      actor_user_id: context.userId,
    });
    if (auditError) throw auditError;
    return NextResponse.json({ status: "ARCHIVED", archivedAt });
  } catch (error) {
    return errorResponse(error, 403);
  }
}
