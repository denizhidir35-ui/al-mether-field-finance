import assert from "node:assert/strict";
import test from "node:test";
import {
  HR_SIGNED_URL_DEFAULT_SECONDS,
  HR_SIGNED_URL_MAX_SECONDS,
  HR_SIGNED_URL_MIN_SECONDS,
  isEmployeeScopedStoragePath,
  parseHrDocumentAccessMode,
  resolveHrSignedUrlTtl,
  safeDownloadName,
} from "./hr-storage-access.ts";

test("signed URL TTL is short and bounded", () => {
  assert.equal(resolveHrSignedUrlTtl(undefined), HR_SIGNED_URL_DEFAULT_SECONDS);
  assert.equal(resolveHrSignedUrlTtl("1"), HR_SIGNED_URL_MIN_SECONDS);
  assert.equal(resolveHrSignedUrlTtl("9999"), HR_SIGNED_URL_MAX_SECONDS);
  assert.equal(resolveHrSignedUrlTtl("90"), 90);
});

test("storage path is isolated by company and employee code", () => {
  assert.equal(isEmployeeScopedStoragePath("company-a/PMTHR000001/DOCUMENT/file.pdf", "company-a", "PMTHR000001"), true);
  assert.equal(isEmployeeScopedStoragePath("company-a/PMTHR000001/HEALTH_REPORT/file.pdf", "company-a", "PMTHR000001"), true);
  assert.equal(isEmployeeScopedStoragePath("company-b/PMTHR000001/DOCUMENT/file.pdf", "company-a", "PMTHR000001"), false);
  assert.equal(isEmployeeScopedStoragePath("company-a/PMTHR000002/DOCUMENT/file.pdf", "company-a", "PMTHR000001"), false);
  assert.equal(isEmployeeScopedStoragePath("company-a/PMTHR000001/UNKNOWN/file.pdf", "company-a", "PMTHR000001"), false);
  assert.equal(isEmployeeScopedStoragePath("company-a/PMTHR000001/DOCUMENT/../file.pdf", "company-a", "PMTHR000001"), false);
});

test("document access mode and download filename are normalized", () => {
  assert.equal(parseHrDocumentAccessMode("download"), "download");
  assert.equal(parseHrDocumentAccessMode("anything"), "view");
  assert.equal(safeDownloadName("Payroll: July/2026.pdf"), "Payroll- July-2026.pdf");
});
