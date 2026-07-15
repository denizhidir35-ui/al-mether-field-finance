import assert from "node:assert/strict";
import test from "node:test";
import { generateTemporaryPassword, isStrongTemporaryPassword } from "./temporary-password.ts";

test("temporary passwords are strong, server-generated and non-repeating", () => {
  const passwords = Array.from({ length: 100 }, generateTemporaryPassword);
  assert.equal(new Set(passwords).size, passwords.length);
  assert.ok(passwords.every(isStrongTemporaryPassword));
  assert.ok(passwords.every(password => password.length === 20));
});
