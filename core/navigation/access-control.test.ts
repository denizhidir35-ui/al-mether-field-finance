import assert from "node:assert/strict";
import test from "node:test";
import { modulesForUser } from "./access-control.ts";

test("HR role cannot see finance or operations", () => {
  const modules = modulesForUser({ id: "1", companyId: "c", name: "HR", email: "hr@example.com", role: "HR", title: "HR" });
  assert.deepEqual(modules, ["dashboard", "hr", "documents", "settings"]);
});
test("company license narrows visible modules", () => {
  const modules = modulesForUser({ id: "1", companyId: "c", name: "CEO", email: "ceo@example.com", role: "CEO", title: "CEO", licensedModules: ["hr", "documents"] });
  assert.deepEqual(modules, ["dashboard", "hr", "documents"]);
});
