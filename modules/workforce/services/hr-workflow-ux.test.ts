import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workforce = readFileSync("modules/workforce/components/WorkforceModule.tsx", "utf8");
const hrFoundation = readFileSync("modules/workforce/components/HrFoundationModule.tsx", "utf8");
const organizationCenter = readFileSync("modules/workforce/components/OrganizationCenter.tsx", "utf8");

test("HR exposes one employee directory without chief and personnel tabs", () => {
  assert.doesNotMatch(workforce, /Şef Yönetimi|Personel Yönetimi/);
  assert.doesNotMatch(workforce, /filter\(item => item\.role === tab\)/);
  assert.match(workforce, /Çalışan Dizini/);
  assert.match(workforce, /Çalışan Ekle/);
  assert.match(workforce, /aria-label="Çalışan Rolü"/);
});

test("existing PIN, QR, assignment and Excel import capabilities remain reachable", () => {
  assert.match(workforce, /resetChiefPin/);
  assert.match(workforce, /updatePersonnelChief/);
  assert.match(workforce, /Personel QR/);
  assert.match(workforce, /PersonnelImportWizard/);
});

test("department and team navigation is consolidated under Organization Center", () => {
  assert.doesNotMatch(hrFoundation, /label: "Departmanlar"/);
  assert.doesNotMatch(hrFoundation, /label: "Takımlar"/);
  assert.match(hrFoundation, /label: "Organizasyon Yapısı"/);
  assert.match(organizationCenter, /Departman Ekle/);
  assert.match(organizationCenter, /Takım Ekle/);
});
