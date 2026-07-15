import assert from "node:assert/strict";
import test from "node:test";
import { generateTemporaryPassword, isFourDigitTemporaryPassword } from "./temporary-password.ts";

test("HR creates random 4-digit Chief temporary passwords", () => {
  const passwords = Array.from({ length: 40 }, generateTemporaryPassword);
  assert.ok(passwords.every(isFourDigitTemporaryPassword));
  assert.ok(new Set(passwords).size > 30);
});
