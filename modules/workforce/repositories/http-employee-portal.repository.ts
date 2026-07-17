"use client";
import { supabase } from "@/core/supabase/client";
import type { EmployeePortalRepository, EmployeePortalSnapshot, HrSignedDocumentAccess } from "./employee-portal.repository";

export class HttpEmployeePortalRepository implements EmployeePortalRepository {
  private async token() {
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
    if (!data.session) throw new Error("Çalışan oturumu gerekli.");
    return data.session.access_token;
  }

  async loadSelf(): Promise<EmployeePortalSnapshot> {
    const response = await fetch("/api/hr/self", { headers: { authorization: `Bearer ${await this.token()}` } });
    const payload = await response.json() as EmployeePortalSnapshot & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Çalışan portalı yüklenemedi.");
    return payload;
  }

  async accessDocument(documentId: string, versionId: string, mode: "view" | "download") {
    const response = await fetch(`/api/hr/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}?mode=${mode}`, {
      headers: { authorization: `Bearer ${await this.token()}` },
    });
    const payload = await response.json() as HrSignedDocumentAccess & { error?: string };
    if (!response.ok || !payload.url) throw new Error(payload.error || "Güvenli belge bağlantısı oluşturulamadı.");
    return payload;
  }
}
