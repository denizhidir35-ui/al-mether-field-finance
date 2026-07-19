import assert from "node:assert/strict";
import test from "node:test";
import type { PersonnelImportRawRow, PersonnelImportReferences } from "../domain/personnel-import";
import { normalizeImportPhone, validatePersonnelImportRows } from "./personnel-import-validation.ts";

const references: PersonnelImportReferences = {
  chiefs: [{ employeeCode: "SMTHR000001" }],
  organizations: [{ id: "org-1", code: "ORG-01" }, { id: "org-2", code: "ORG-02" }],
  departments: [{ id: "dep-1", code: "DEP-01", organizationId: "org-1" }],
  teams: [{ id: "team-1", code: "TEAM-01", departmentId: "dep-1" }],
  existing: { employeeCodes: ["PMTHR000099"], emails: ["existing@almether.com"], phones: ["+905551112233"] },
};

function row(overrides: Partial<PersonnelImportRawRow> = {}): PersonnelImportRawRow {
  return {
    rowNumber: 2,
    employeeCode: "",
    displayName: "Ada Yılmaz",
    phone: "0555 222 33 44",
    email: "ada@example.com",
    jobTitle: "Saha Personeli",
    chiefCode: "SMTHR000001",
    organizationCode: "ORG-01",
    departmentCode: "DEP-01",
    teamCode: "TEAM-01",
    ...overrides,
  };
}

test("valid row is normalized and system-generated personnel code is only a warning", () => {
  const preview = validatePersonnelImportRows([row()], references);
  assert.equal(preview.summary.error, 0);
  assert.equal(preview.summary.warning, 1);
  assert.equal(preview.rows[0]?.values.phone, "+905552223344");
  assert.equal(preview.rows[0]?.values.organizationId, "org-1");
  assert.equal(preview.rows[0]?.values.departmentId, "dep-1");
  assert.equal(preview.rows[0]?.values.teamId, "team-1");
});

test("duplicate identities in the same file are rejected before import", () => {
  const preview = validatePersonnelImportRows([
    row({ employeeCode: "PMTHR000010" }),
    row({ rowNumber: 3, employeeCode: "PMTHR000010" }),
  ], references);
  assert.equal(preview.summary.error, 2);
  assert.ok(preview.rows.every(item => item.issues.some(issue => issue.message.includes("tekrar"))));
});

test("existing company identities and invalid hierarchy are rejected", () => {
  const preview = validatePersonnelImportRows([row({
    employeeCode: "PMTHR000099",
    email: "existing@almether.com",
    phone: "+90 555 111 22 33",
    organizationCode: "ORG-02",
  })], references);
  const messages = preview.rows[0]?.issues.map(issue => issue.message).join(" ") ?? "";
  assert.equal(preview.summary.error, 1);
  assert.match(messages, /zaten kayıtlıdır/);
  assert.match(messages, /organizasyona bağlı değildir/);
});

test("unknown chief, organization, department and malformed contact data are rejected", () => {
  const preview = validatePersonnelImportRows([row({
    phone: "123",
    email: "bad-email",
    chiefCode: "SMTHR999999",
    organizationCode: "UNKNOWN",
    departmentCode: "UNKNOWN",
  })], references);
  assert.equal(preview.summary.error, 1);
  assert.ok((preview.rows[0]?.issues.length ?? 0) >= 5);
});

test("phone normalization accepts local Turkish mobile input and rejects malformed input", () => {
  assert.equal(normalizeImportPhone("(0555) 222-33-44"), "+905552223344");
  assert.equal(normalizeImportPhone("5552223344"), "+905552223344");
  assert.equal(normalizeImportPhone("555"), null);
});
