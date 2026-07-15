"use client";

import { supabase } from "@/core/supabase/client";
import type { CreateWorkforceMember, WorkforceMember, WorkforceMutationResult } from "../domain/workforce";

async function request<T>(init?: RequestInit) {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (!data.session?.access_token) throw new Error("Şirket oturumu gerekli.");
  const response = await fetch("/api/workforce", {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
  });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "HR işlemi tamamlanamadı.");
  return payload;
}

export async function listWorkforce() {
  return (await request<{ members: WorkforceMember[] }>()).members;
}

export async function createWorkforceMember(input: CreateWorkforceMember) {
  return request<WorkforceMutationResult>({ method: "POST", body: JSON.stringify(input) });
}

export async function updatePersonnelChief(personnelCode: string, assignedChiefCode: string) {
  return request<{ member: WorkforceMember }>({ method: "PATCH", body: JSON.stringify({ personnelCode, assignedChiefCode }) });
}

export async function resetChiefPin(chiefCode: string) {
  return request<WorkforceMutationResult>({ method: "PATCH", body: JSON.stringify({ action: "RESET_CHIEF_PIN", chiefCode }) });
}
