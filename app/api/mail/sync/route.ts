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
    return NextResponse.json({ synced });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mail senkronizasyonu başarısız." }, { status: 400 });
  }
}
