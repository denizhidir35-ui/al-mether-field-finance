import { randomInt } from "node:crypto";
export { isFourDigitTemporaryPassword } from "./chief-pin.ts";

export function generateTemporaryPassword() {
  return String(randomInt(1_000, 10_000));
}
