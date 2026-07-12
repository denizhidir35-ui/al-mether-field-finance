import "server-only";

export type MailAccount = { email: string; password: string };

export function getMailAccount(email: string): MailAccount {
  const raw = process.env.HOSTINGER_MAIL_ACCOUNTS_JSON;
  if (!raw) throw new Error("Hostinger posta hesapları sunucuda yapılandırılmamış.");

  let accounts: Record<string, string>;
  try {
    accounts = JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new Error("Hostinger posta hesapları yapılandırması geçersiz.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const password = accounts[normalizedEmail];
  if (!password) throw new Error(`${normalizedEmail} posta kutusu henüz bağlanmamış.`);
  return { email: normalizedEmail, password };
}
