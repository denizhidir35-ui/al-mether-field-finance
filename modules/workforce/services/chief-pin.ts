export function isFourDigitTemporaryPassword(password: string) {
  return /^\d{4}$/.test(password);
}
