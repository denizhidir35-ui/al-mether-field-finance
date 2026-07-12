import { NextRequest, NextResponse } from "next/server";
import { requireMailUser } from "@/core/mail/server/auth";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { messageId?: string; action?: "archive" | "delete" };
    if (!input.messageId || !input.action) return NextResponse.json({ error: "Geçersiz işlem." }, { status: 422 });
    const { user, adminClient } = await requireMailUser(request);
    const { data: message, error: readError } = await adminClient.from("mether_mail_messages")
      .select("id,sender_user_id,recipient_user_id")
      .eq("id", input.messageId).eq("company_id", user.companyId).single();
    if (readError || !message || (message.sender_user_id !== user.id && message.recipient_user_id !== user.id)) {
      return NextResponse.json({ error: "Bu mail için yetkiniz yok." }, { status: 403 });
    }
    const update = input.action === "archive" ? { is_archived: true } : { deleted_at: new Date().toISOString() };
    const { error } = await adminClient.from("mether_mail_messages").update(update).eq("id", input.messageId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mail işlemi başarısız." }, { status: 400 });
  }
}
