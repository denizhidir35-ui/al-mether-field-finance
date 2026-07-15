import assert from "node:assert/strict";
import test from "node:test";
import { parsePersonnelQr } from "./qr.service.ts";

test("QR scanner accepts only Personnel identities", () => {
  assert.equal(parsePersonnelQr("ALMETHER:PERSONNEL:PMTHR000001:V1"), "PMTHR000001");
  assert.throws(() => parsePersonnelQr("ALMETHER:CHIEF:SMTHR000001:V1"), /personel QR/);
  assert.throws(() => parsePersonnelQr("ALMETHER:CEO:CMTHR000001:V1"), /personel QR/);
  assert.throws(() => parsePersonnelQr("ALMETHER:HR:OMTHR000001:V1"), /personel QR/);
});
