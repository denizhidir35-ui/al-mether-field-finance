import { supabase } from "@/core/supabase/client";
import type { MailRepository } from "../domain/mail-repository";
import { LocalMailRepository } from "./local-mail-repository";
import { SupabaseMailRepository } from "./supabase-mail-repository";

export async function createMailRepository(): Promise<MailRepository> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return new SupabaseMailRepository(supabase);
  }
  return new LocalMailRepository();
}
