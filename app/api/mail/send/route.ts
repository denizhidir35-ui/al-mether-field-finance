import { NextRequest, NextResponse } from "next/server";
import { getMailAccount } from "@/core/mail/server/account";
import { requireMailUser } from "@/core/mail/server/auth";
import { sendHostingerMail } from "@/core/mail/server/hostinger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { recipientEmail?: string; cc?: string[]; bcc?: string[]; subject?: string; body?: string; attachments?: { name: string; type: string; data: string }[] };
    const recipientEmail = input.recipientEmail?.trim().toLowerCase() || "";
    const cc = input.cc || [];
    const bcc = input.bcc || [];
    const attachments = input.attachments || [];
    const subject = input.subject?.trim() || "";
    const body = input.body?.trim() || "";
    const emailIsValid = (email: string) => /^\S+@\S+\.\S+$/.test(email);
    const attachmentBytes = attachments.reduce((total, attachment) => total + Math.ceil((attachment.data.split(",", 2)[1]?.length || 0) * 0.75), 0);
    if (!emailIsValid(recipientEmail) || !cc.every(emailIsValid) || !bcc.every(emailIsValid) || !subject || !body || subject.length > 200 || body.length > 20000 || attachmentBytes > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Mail alanları geçersiz." }, { status: 422 });
    }
    const { user, adminClient } = await requireMailUser(request);
    const account = getMailAccount(user.email);
    const message = await sendHostingerMail(adminClient, user, account, {
      recipientEmail, cc, bcc, subject, body, attachments,
    });
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mail gönderilemedi." }, { status: 400 });
  }
}
