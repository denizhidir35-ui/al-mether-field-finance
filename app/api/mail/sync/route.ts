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
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (messages || []).map(message => message.id);
    const attachmentResult = ids.length
      ? await adminClient.from("mether_mail_attachments").select("id,message_id,filename,content_type,byte_size").in("message_id", ids)
      : { data: [], error: null };
    if (attachmentResult.error) throw new Error(attachmentResult.error.message);
    const enriched = (messages || []).map(message => ({
      ...message,
      attachments: (attachmentResult.data || []).filter(item => item.message_id === message.id).map(item => ({
        id: item.id, name: item.filename, contentType: item.content_type, size: Number(item.byte_size),
      })),
    }));
    return NextResponse.json({ synced, messages: enriched });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mail senkronizasyonu başarısız." }, { status: 400 });
  }
}
