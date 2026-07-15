import assert from "node:assert/strict";
import test from "node:test";
import type { PersonnelRecord } from "../domain/personnel-record.ts";
import { assertPersonnelQrAssignment } from "./personnel-qr-assignment.ts";

const personnel = {
  id: "personnel-test", personnelCode: "PMTHR000001", displayName: "Test Personel", title: "Saha Personeli",
  assignedChiefCode: "SMTHR000001", status: "active", qrValue: "ALMETHER:PERSONNEL:PMTHR000001:V1", qrVersion: 1,
  createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(), documents: [], certificates: [], trainings: [], signatures: [], performanceRecords: [], authorizations: []
} satisfies PersonnelRecord;

test("QR accepts personnel assigned to both Chief and WorkOrder", () => {
  assert.doesNotThrow(() => assertPersonnelQrAssignment(personnel, "SMTHR000001", ["PMTHR000001"]));
});

test("QR rejects personnel assigned to another Chief", () => {
  assert.throws(() => assertPersonnelQrAssignment(personnel, "SMTHR000002", ["PMTHR000001"]), /bu Şefe bağlı değil/);
});

test("QR rejects personnel outside the WorkOrder", () => {
  assert.throws(() => assertPersonnelQrAssignment(personnel, "SMTHR000001", ["PMTHR000002"]), /İş Emri ekibinde değil/);
});
