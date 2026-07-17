import assert from "node:assert/strict";
import test from "node:test";
import { reduceHrProjection } from "./hr-reducer.ts";

const empty = { organizations: [], departments: [], teams: [], employees: [], documents: [], counts: { leave: 0, payroll: 0, assets: 0, notifications: 0, pendingActivation: 0 } };

test("HR reducer advances sequence and aggregate revision", () => {
  const first = reduceHrProjection(null, { sequence: 1, eventType: "ORGANIZATION_CREATED", aggregateType: "ORGANIZATION", aggregateId: "org-1" }, empty);
  const second = reduceHrProjection(first, { sequence: 2, eventType: "ORGANIZATION_UPDATED", aggregateType: "ORGANIZATION", aggregateId: "org-1" }, empty);
  assert.equal(second.meta.lastSequence, 2);
  assert.equal(second.meta.aggregateRevisions["ORGANIZATION:org-1"], 2);
});
