import type { AppUser } from "@/types/auth";

type LocalCredential = AppUser & { password: string };

const APP_USERS: LocalCredential[] = [
  {
    id: "deniz",
    companyId: "al_mether",
    name: "Deniz Hıdır",
    email: "denizhidir@almether.com",
    password: "1234",
    role: "CEO",
    title: "Co-Founder & CEO"
  },
  {
    id: "aytac",
    companyId: "al_mether",
    name: "Aytaç Türkbay",
    email: "aytacturkbay@almether.com",
    password: "1234",
    role: "PARTNER",
    title: "Co-Founder"
  },
  {
    id: "assistant",
    companyId: "al_mether",
    name: "Yönetici Yardımcısı",
    email: "yardimci@almether.com",
    password: "1234",
    role: "ASSISTANT",
    title: "Executive Assistant"
  }
];

export function authenticateUser(email: string, password: string) {
  const credential = APP_USERS.find(
    user => user.email === email.trim().toLowerCase() && user.password === password.trim()
  );

  if (!credential) return null;

  const { password: _password, ...user } = credential;
  return user;
}
