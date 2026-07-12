import { NextRequest, NextResponse } from "next/server";
import { getMailAccount } from "@/core/mail/server/account";
import { requireMailUser } from "@/core/mail/server/auth";
import { syncHostingerInbox } from "@/core/mail/server/hostinger";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { user, adminClient } = await requireMailUser(request);
    const account = getMailAccount(user.email);
    const synced = await syncHostingerInbox(adminClient, user, account);
    const { data: messages, error } = await adminClient.from("mether_mail_messages")
      .select("*")
      .eq("company_id", user.companyId)
      .or(`recipient_user_id.eq.${user.id},sender_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ synced, messages });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mail senkronizasyonu başarısız." }, { status: 400 });
  }
}
