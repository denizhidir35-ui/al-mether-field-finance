"use client";

import { supabase } from "@/core/supabase/client";
import type { HrCreateCommand, HrFoundationSnapshot } from "../domain/hr-foundation";
import type { PersonnelImportPreview, PersonnelImportResult } from "../domain/personnel-import";
import type { HrRepository } from "./hr.repository";

async function accessToken() {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (!data.session?.access_token) throw new Error("Şirket oturumu gerekli.");
  return data.session.access_token;
}
export class HttpHrRepository implements HrRepository {
  private async request(init?: RequestInit) {
    const response = await fetch("/api/hr", {
      ...init,
      headers: { "content-type": "application/json", authorization: `Bearer ${await accessToken()}` },
    });
    const payload = await response.json() as { snapshot?: HrFoundationSnapshot; error?: string };
    if (!response.ok || !payload.snapshot) throw new Error(payload.error || "HR Foundation yüklenemedi.");
    return payload.snapshot;
  }

  loadFoundation() { return this.request(); }
  execute(command: HrCreateCommand) { return this.request({ method: "POST", body: JSON.stringify(command) }); }

  private async importRequest<T>(mode: "preview" | "commit", file: File, key: "preview" | "result", importBatchId?: string) {
    const body = new FormData();
    body.set("file", file);
    if (importBatchId) body.set("import_batch_id", importBatchId);
    const response = await fetch(`/api/hr/import?mode=${mode}`, {
      method: "POST",
      headers: { authorization: `Bearer ${await accessToken()}` },
      body,
    });
    const payload = await response.json() as Record<string, T | string>;
    const value = payload[key];
    if (!response.ok || !value || typeof value === "string") {
      throw new Error(typeof payload.error === "string" ? payload.error : "Personel aktarımı tamamlanamadı.");
    }
    return value;
  }

  previewPersonnelImport(file: File) {
    return this.importRequest<PersonnelImportPreview>("preview", file, "preview");
  }

  commitPersonnelImport(file: File, importBatchId: string) {
    return this.importRequest<PersonnelImportResult>("commit", file, "result", importBatchId);
  }
}
