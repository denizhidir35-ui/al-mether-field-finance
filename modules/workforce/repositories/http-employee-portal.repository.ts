"use client";
import { supabase } from "@/core/supabase/client";
import type { EmployeePortalRepository, EmployeePortalSnapshot } from "./employee-portal.repository";

export class HttpEmployeePortalRepository implements EmployeePortalRepository {
  async loadSelf(): Promise<EmployeePortalSnapshot> {
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
    if (!data.session) throw new Error("Çalışan oturumu gerekli.");
    const response = await fetch("/api/hr/self", { headers: { authorization: `Bearer ${data.session.access_token}` } });
    const payload = await response.json() as EmployeePortalSnapshot & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Çalışan portalı yüklenemedi.");
    return payload;
  }
}
