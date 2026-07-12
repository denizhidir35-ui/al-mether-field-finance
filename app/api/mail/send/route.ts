import { NextRequest, NextResponse } from "next/server";
import { getMailAccount } from "@/core/mail/server/account";
import { requireMailUser } from "@/core/mail/server/auth";
import { sendHostingerMail } from "@/core/mail/server/hostinger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { recipientEmail?: string; subject?: string; body?: string };
    const recipientEmail = input.recipientEmail?.trim().toLowerCase() || "";
    const subject = input.subject?.trim() || "";
    const body = input.body?.trim() || "";
    if (!/^\S+@\S+\.\S+$/.test(recipientEmail) || !subject || !body || subject.length > 200 || body.length > 20000) {
      return NextResponse.json({ error: "Mail alanları geçersiz." }, { status: 422 });
    }
    const { user, adminClient } = await requireMailUser(request);
    const account = getMailAccount(user.email);
    const message = await sendHostingerMail(adminClient, user, account, { recipientEmail, subject, body });
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mail gönderilemedi." }, { status: 400 });
  }
}
