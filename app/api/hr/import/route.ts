import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireWorkforceManager, type WorkforceContext } from "@/core/workforce/server";
import type { PersonnelImportPreview, PersonnelImportReferences, PersonnelImportResult, PersonnelImportResultRow } from "@/modules/workforce/domain/personnel-import";
import { parsePersonnelImportWorkbook } from "@/modules/workforce/services/personnel-import-excel.server";
import { validatePersonnelImportRows } from "@/modules/workforce/services/personnel-import-validation";
import { buildHrFoundationSnapshot } from "@/modules/workforce/services/hr-snapshot.server";
import { reduceHrProjection, type HrProjectionEnvelope, type HrProjectionEvent } from "@/modules/workforce/services/hr-reducer";

export const runtime = "nodejs";

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Personel aktarımı tamamlanamadı."; }
function errorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error && typeof error.code === "string") return error.code.slice(0, 80);
  return "IMPORT_ROW_FAILED";
}

async function payloadFrom(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("Excel dosyası zorunludur.");
  const importBatchId = form.get("import_batch_id");
  return { file, importBatchId: typeof importBatchId === "string" ? importBatchId : null };
}

async function references({ admin, companyId }: WorkforceContext): Promise<PersonnelImportReferences> {
  const [chiefs, organizations, departments, teams, employees, profiles] = await Promise.all([
    admin.from("profiles").select("employee_code").eq("company_id", companyId).eq("role", "CHIEF").eq("status", "ACTIVE"),
    admin.from("hr_organizations").select("id,code").eq("company_id", companyId).eq("status", "ACTIVE"),
    admin.from("hr_departments").select("id,code,organization_id").eq("company_id", companyId).eq("status", "ACTIVE"),
    admin.from("hr_teams").select("id,code,department_id").eq("company_id", companyId).eq("status", "ACTIVE"),
    admin.from("hr_employees").select("employee_code,phone").eq("company_id", companyId),
    admin.from("profiles").select("email,phone").eq("company_id", companyId),
  ]);
  const failed = [chiefs, organizations, departments, teams, employees, profiles].find(result => result.error);
  if (failed?.error) throw failed.error;
  return {
    chiefs: (chiefs.data ?? []).map(row => ({ employeeCode: String(row.employee_code) })),
    organizations: (organizations.data ?? []).map(row => ({ id: String(row.id), code: String(row.code) })),
    departments: (departments.data ?? []).map(row => ({ id: String(row.id), code: String(row.code), organizationId: String(row.organization_id) })),
    teams: (teams.data ?? []).map(row => ({ id: String(row.id), code: String(row.code), departmentId: String(row.department_id) })),
    existing: {
      employeeCodes: (employees.data ?? []).map(row => String(row.employee_code)),
      emails: (profiles.data ?? []).flatMap(row => row.email ? [String(row.email)] : []),
      phones: [...(employees.data ?? []).flatMap(row => row.phone ? [String(row.phone)] : []), ...(profiles.data ?? []).flatMap(row => row.phone ? [String(row.phone)] : [])],
    },
  };
}

async function previewFile(file: File, context: WorkforceContext): Promise<{ preview: PersonnelImportPreview; sourceSha256: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  const parsed = await parsePersonnelImportWorkbook(file);
  return { preview: validatePersonnelImportRows(parsed.rows, await references(context), file.name, parsed.skipped), sourceSha256 };
}

function rowIdempotencyKey(companyId: string, sourceSha256: string, row: PersonnelImportPreview["rows"][number]) {
  const identity = [companyId, sourceSha256, row.rowNumber, row.values.employeeCode || "AUTO", row.values.email, row.values.phone].join("\u0000");
  return createHash("sha256").update(identity).digest("hex");
}

async function setRowStatus(context: WorkforceContext, rowId: string, status: string, options: { authUserId?: string; authCreated?: boolean; code?: string; message?: string } = {}) {
  const { error } = await context.admin.rpc("update_hr_personnel_import_row_status", {
    p_company_id: context.companyId,
    p_row_id: rowId,
    p_status: status,
    p_auth_user_id: options.authUserId ?? null,
    p_auth_created_by_import: options.authCreated ?? false,
    p_error_code: options.code ?? null,
    p_error_message: options.message ?? null,
  });
  if (error) throw error;
}

async function hasExternalAuthOwnership(context: WorkforceContext, authUserId: string, currentRowId: string, expectedIdempotencyKey: string) {
  const [memberships, profiles, employees, importClaims, authUser] = await Promise.all([
    context.admin.from("company_memberships").select("company_id", { count: "exact", head: true }).eq("user_id", authUserId),
    context.admin.from("profiles").select("id", { count: "exact", head: true }).eq("id", authUserId),
    context.admin.from("hr_employees").select("id", { count: "exact", head: true }).eq("profile_id", authUserId),
    context.admin.from("hr_personnel_import_rows").select("id", { count: "exact", head: true }).eq("auth_user_id", authUserId).neq("id", currentRowId),
    context.admin.auth.admin.getUserById(authUserId),
  ]);
  const queryError = [memberships.error, profiles.error, employees.error, importClaims.error, authUser.error].find(Boolean);
  if (queryError) return true;
  const metadataKey = authUser.data.user?.user_metadata?.import_idempotency_key;
  return (memberships.count ?? 0) > 0 || (profiles.count ?? 0) > 0 || (employees.count ?? 0) > 0 || (importClaims.count ?? 0) > 0 || metadataKey !== expectedIdempotencyKey;
}

async function compensateNewAuth(context: WorkforceContext, authUserId: string, rowId: string, idempotencyKey: string, originalError: unknown) {
  const code = errorCode(originalError);
  const message = errorMessage(originalError);
  if (await hasExternalAuthOwnership(context, authUserId, rowId, idempotencyKey)) {
    await setRowStatus(context, rowId, "MANUAL_REVIEW", { authUserId, authCreated: true, code, message });
    return { workflowStatus: "MANUAL_REVIEW" as const, message: `${message} Auth sahipliği bulundu; kullanıcı silinmedi.` };
  }
  const { error: deleteError } = await context.admin.auth.admin.deleteUser(authUserId);
  if (deleteError) {
    await setRowStatus(context, rowId, "MANUAL_REVIEW", { authUserId, authCreated: true, code: "AUTH_COMPENSATION_FAILED", message: deleteError.message });
    return { workflowStatus: "MANUAL_REVIEW" as const, message: "DB işlemi başarısız ve Auth telafisi tamamlanamadı." };
  }
  await setRowStatus(context, rowId, "COMPENSATED", { authCreated: true, code, message });
  return { workflowStatus: "COMPENSATED" as const, message: `${message} Yeni Auth güvenli biçimde telafi edildi.` };
}

async function importValidatedRows(context: WorkforceContext, preview: PersonnelImportPreview, sourceSha256: string): Promise<PersonnelImportResult> {
  const importBatchId = preview.importBatchId;
  const { data: existingBatch, error: existingBatchError } = await context.admin.from("hr_personnel_import_batches")
    .select("source_sha256,file_name,status,total_rows,actor_user_id")
    .eq("company_id", context.companyId).eq("id", importBatchId).maybeSingle();
  if (existingBatchError) throw existingBatchError;
  if (existingBatch && (existingBatch.source_sha256 !== sourceSha256 || existingBatch.file_name !== preview.fileName || existingBatch.total_rows !== preview.summary.total || existingBatch.actor_user_id !== context.userId)) {
    throw new Error("Import batch kimliği bu dosya veya kullanıcıyla eşleşmiyor.");
  }
  if (!existingBatch) {
    const { error: batchError } = await context.admin.from("hr_personnel_import_batches").insert({
      id: importBatchId, company_id: context.companyId, source_sha256: sourceSha256, file_name: preview.fileName,
      status: "PROCESSING", total_rows: preview.summary.total, skipped_rows: preview.summary.skipped, actor_user_id: context.userId,
    });
    if (batchError) throw batchError;
  }
  const { error: batchAuditError } = await context.admin.from("hr_security_audit_logs").insert({
    company_id: context.companyId,
    actor_user_id: context.userId,
    action: existingBatch ? "IMPORT_PERSONNEL_BATCH_RETRIED" : "IMPORT_PERSONNEL_BATCH_STARTED",
    resource_type: "HR_PERSONNEL_IMPORT_BATCH",
    resource_id: importBatchId,
    result: "ALLOWED",
    request_metadata: {
      import_batch_id: importBatchId,
      total_rows: preview.summary.total,
      processing_model: "SAGA_COMPENSATION",
    },
  });
  if (batchAuditError) throw batchAuditError;

  const results: PersonnelImportResultRow[] = [];
  const projectionEvents: HrProjectionEvent[] = [];
  for (const row of preview.rows) {
    let employeeCode = row.values.employeeCode;
    const idempotencyKey = rowIdempotencyKey(context.companyId, sourceSha256, row);
    const { data: reservedRows, error: reserveError } = await context.admin.rpc("reserve_hr_personnel_import_row", {
      p_company_id: context.companyId, p_import_batch_id: importBatchId, p_row_number: row.rowNumber,
      p_idempotency_key: idempotencyKey, p_source_sha256: sourceSha256, p_employee_code: employeeCode || null,
      p_email: row.values.email, p_phone: row.values.phone, p_actor_user_id: context.userId,
    });
    const reserved = Array.isArray(reservedRows) ? reservedRows[0] : reservedRows;
    if (reserveError || !reserved) { results.push({ rowNumber: row.rowNumber, employeeCode, status: "FAILED", workflowStatus: "FAILED", message: reserveError?.message ?? "Import satırı rezerve edilemedi." }); continue; }
    const rowId = String(reserved.row_id);
    employeeCode = reserved.resolved_employee_code ? String(reserved.resolved_employee_code) : employeeCode;
    if (reserved.reused) {
      const completed = reserved.row_status === "COMPLETED";
      results.push({ rowNumber: row.rowNumber, employeeCode, status: "SKIPPED", workflowStatus: completed ? "COMPLETED" : "MANUAL_REVIEW", message: completed ? "Aynı satır daha önce tamamlandı; tekrar oluşturulmadı." : `Aynı satır daha önce ${reserved.row_status} durumunda işlendi; manuel inceleme gerekli.` });
      continue;
    }
    if (!employeeCode) {
      const { data, error } = await context.admin.rpc("next_workforce_personnel_code");
      if (error || !data) {
        await setRowStatus(context, rowId, "FAILED", { code: error?.code ?? "EMPLOYEE_CODE_FAILED", message: error?.message ?? "Personel kodu üretilemedi." });
        results.push({ rowNumber: row.rowNumber, employeeCode: null, status: "FAILED", workflowStatus: "FAILED", message: error?.message ?? "Personel kodu üretilemedi." });
        continue;
      }
      employeeCode = String(data);
    }

    let createdAuthUserId: string | null = null;
    try {
      const { data: authData, error: authError } = await context.admin.auth.admin.createUser({
        email: row.values.email,
        phone: row.values.phone,
        email_confirm: false,
        phone_confirm: false,
        user_metadata: { display_name: row.values.displayName, employee_code: employeeCode, import_batch_id: importBatchId, import_row_number: row.rowNumber, import_idempotency_key: idempotencyKey },
      });
      if (authError || !authData.user) throw authError ?? new Error("Auth kullanıcısı oluşturulamadı.");
      createdAuthUserId = authData.user.id;
      await setRowStatus(context, rowId, "AUTH_CREATED", { authUserId: createdAuthUserId, authCreated: true });
      const { data: persistedRows, error: persistError } = await context.admin.rpc("complete_hr_personnel_import_row", {
        p_company_id: context.companyId, p_row_id: rowId, p_actor_user_id: context.userId, p_auth_user_id: createdAuthUserId,
        p_employee_code: employeeCode, p_display_name: row.values.displayName, p_phone: row.values.phone, p_email: row.values.email,
        p_job_title: row.values.jobTitle, p_chief_code: row.values.chiefCode, p_organization_id: row.values.organizationId,
        p_department_id: row.values.departmentId, p_team_id: row.values.teamId, p_idempotency_key: idempotencyKey,
      });
      const persisted = Array.isArray(persistedRows) ? persistedRows[0] : persistedRows;
      if (persistError || !persisted) throw persistError ?? new Error("Personel transaction tamamlanamadı.");
      projectionEvents.push({ sequence: Number(persisted.event_sequence), eventType: "EMPLOYEE_CREATED", aggregateType: "EMPLOYEE", aggregateId: employeeCode });
      results.push({ rowNumber: row.rowNumber, employeeCode, status: "SUCCESS", workflowStatus: "COMPLETED", message: "Personel başarıyla aktarıldı." });
    } catch (error) {
      if (!createdAuthUserId) {
        await setRowStatus(context, rowId, "FAILED", { code: errorCode(error), message: errorMessage(error) });
        results.push({ rowNumber: row.rowNumber, employeeCode, status: "FAILED", workflowStatus: "FAILED", message: errorMessage(error) });
      } else {
        const compensation = await compensateNewAuth(context, createdAuthUserId, rowId, idempotencyKey, error);
        results.push({ rowNumber: row.rowNumber, employeeCode, status: "FAILED", ...compensation });
      }
    }
  }

  if (projectionEvents.length) {
    const nextSnapshot = await buildHrFoundationSnapshot(context);
    const { data: currentProjection } = await context.admin.from("hr_read_models").select("snapshot").eq("company_id", context.companyId).maybeSingle();
    const reduced = projectionEvents.sort((a, b) => a.sequence - b.sequence).reduce((state, event) => reduceHrProjection(state, event, nextSnapshot), (currentProjection?.snapshot as HrProjectionEnvelope | null) ?? null);
    const lastSequence = projectionEvents.at(-1)?.sequence ?? 0;
    await context.admin.from("hr_read_models").upsert({ company_id: context.companyId, snapshot: reduced, event_sequence: lastSequence, updated_at: new Date().toISOString() }, { onConflict: "company_id" });
  }

  const success = results.filter(row => row.status === "SUCCESS").length;
  const failed = results.filter(row => row.status === "FAILED").length;
  const skipped = results.filter(row => row.status === "SKIPPED").length + preview.summary.skipped;
  const batchStatus = failed === 0 ? "COMPLETED" : success === 0 ? "FAILED" : "PARTIAL";
  if (!existingBatch || existingBatch.status === "PROCESSING") {
    await context.admin.from("hr_personnel_import_batches").update({ status: batchStatus, successful_rows: success, failed_rows: failed, skipped_rows: skipped, completed_at: new Date().toISOString() }).eq("company_id", context.companyId).eq("id", importBatchId);
  }
  await context.admin.from("hr_security_audit_logs").insert({
    company_id: context.companyId, actor_user_id: context.userId, action: "IMPORT_PERSONNEL_BATCH_COMPLETED", resource_type: "HR_PERSONNEL_IMPORT_BATCH", resource_id: importBatchId,
    result: failed === 0 ? "ALLOWED" : "ERROR", request_metadata: { import_batch_id: importBatchId, total_rows: preview.summary.total, successful_rows: success, failed_rows: failed, skipped_rows: skipped, processing_model: "SAGA_COMPENSATION" },
  });
  return { importBatchId, processingModel: "SAGA_COMPENSATION", summary: { total: preview.summary.total, success, failed, skipped }, rows: results };
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireWorkforceManager(request);
    const { file, importBatchId } = await payloadFrom(request);
    const { preview, sourceSha256 } = await previewFile(file, context);
    const mode = request.nextUrl.searchParams.get("mode") === "commit" ? "commit" : "preview";
    if (mode === "preview") return NextResponse.json({ preview });
    if (!importBatchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(importBatchId)) {
      return NextResponse.json({ error: "Geçerli import batch kimliği zorunludur." }, { status: 400 });
    }
    preview.importBatchId = importBatchId;
    if (preview.summary.error > 0) return NextResponse.json({ error: "Dosyadaki hatalar düzeltilmeden aktarım başlatılamaz.", preview }, { status: 422 });
    return NextResponse.json({ result: await importValidatedRows(context, preview, sourceSha256) });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
