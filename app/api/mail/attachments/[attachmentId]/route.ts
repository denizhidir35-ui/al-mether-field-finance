import { NextRequest, NextResponse } from "next/server";
import { requireMailUser } from "@/core/mail/server/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ attachmentId: string }> }) {
  try {
    const { attachmentId } = await params;
    const { user, adminClient } = await requireMailUser(request);
    const { data: attachment, error } = await adminClient.from("mether_mail_attachments")
      .select("id,message_id,filename,content_type,storage_path")
      .eq("id", attachmentId).eq("company_id", user.companyId).single();
    if (error || !attachment) return NextResponse.json({ error: "Ek bulunamadı." }, { status: 404 });
    const { data: message } = await adminClient.from("mether_mail_messages")
      .select("sender_user_id,recipient_user_id").eq("id", attachment.message_id).single();
    if (!message || (message.sender_user_id !== user.id && message.recipient_user_id !== user.id)) {
      return NextResponse.json({ error: "Bu ek için yetkiniz yok." }, { status: 403 });
    }
    const download = await adminClient.storage.from("mail-attachments").download(attachment.storage_path);
    if (download.error) throw new Error(download.error.message);
    return new NextResponse(await download.data.arrayBuffer(), {
      headers: {
        "Content-Type": attachment.content_type,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ek indirilemedi." }, { status: 400 });
  }
}
