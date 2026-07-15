import { isSupabaseConfigured, supabase } from "@/core/supabase/client";
import type { MailRepository } from "../domain/mail-repository";
import { LocalMailRepository } from "./local-mail-repository";
import { SupabaseMailRepository } from "./supabase-mail-repository";

export async function createMailRepository(): Promise<MailRepository> {
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return new SupabaseMailRepository(supabase);
  }

  if (process.env.NODE_ENV === "development") {
    return new LocalMailRepository();
  }

  if (isSupabaseConfigured) throw new Error("Mether Mail için geçerli Supabase oturumu bulunamadı.");
  return new LocalMailRepository();
}
