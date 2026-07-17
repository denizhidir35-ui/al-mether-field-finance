"use client";

import { supabase } from "@/core/supabase/client";
import type { HrCreateCommand, HrFoundationSnapshot } from "../domain/hr-foundation";
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
}
