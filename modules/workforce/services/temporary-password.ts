import { randomBytes, randomInt } from "node:crypto";

export function generateTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%_-";
  const all = upper + lower + digits + symbols;
  const required = [upper, lower, digits, symbols].map(chars => chars[randomInt(chars.length)]);
  const random = Array.from(randomBytes(16), byte => all[byte % all.length]);
  return [...required, ...random]
    .map(value => ({ value, order: randomInt(1_000_000) }))
    .sort((a, b) => a.order - b.order)
    .map(item => item.value)
    .join("");
}

export function isStrongTemporaryPassword(password: string) {
  return password.length >= 16 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}
