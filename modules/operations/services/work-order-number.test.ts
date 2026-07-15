import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDekaNumber, normalizeProjectNumber } from "./work-order-number.ts";

test("CEO project and DEKA numbers use canonical WorkOrder identifiers", () => {
  assert.equal(normalizeProjectNumber("4"), "ALM-0004");
  assert.equal(normalizeProjectNumber("alm-25"), "ALM-0025");
  assert.equal(normalizeDekaNumber("85"), "TGT-0085");
  assert.equal(normalizeDekaNumber("DEKA-105"), "TGT-0105");
  assert.equal(normalizeProjectNumber("proje"), null);
});
