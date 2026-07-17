export const HR_SIGNED_URL_MIN_SECONDS = 30;
export const HR_SIGNED_URL_DEFAULT_SECONDS = 60;
export const HR_SIGNED_URL_MAX_SECONDS = 300;

export type HrDocumentAccessMode = "view" | "download";

export const HR_STORAGE_CLASSES = [
  "IDENTITY", "DOCUMENT", "PAYROLL", "CONTRACT", "CERTIFICATE", "LEAVE", "ASSET",
  "HEALTH_REPORT", "MEDICAL", "CRITICAL",
] as const;

export type HrStorageClass = (typeof HR_STORAGE_CLASSES)[number];

export function resolveHrSignedUrlTtl(rawValue: string | undefined) {
  const requested = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isFinite(requested)) return HR_SIGNED_URL_DEFAULT_SECONDS;
  return Math.min(HR_SIGNED_URL_MAX_SECONDS, Math.max(HR_SIGNED_URL_MIN_SECONDS, requested));
}

export function isEmployeeScopedStoragePath(path: string, companyId: string, employeeCode: string) {
  const parts = path.split("/");
  return parts.length >= 4
    && parts.every(part => part.length > 0 && part !== "." && part !== "..")
    && parts[0] === companyId
    && parts[1] === employeeCode
    && HR_STORAGE_CLASSES.includes(parts[2] as HrStorageClass);
}

export function parseHrDocumentAccessMode(value: string | null): HrDocumentAccessMode {
  return value === "download" ? "download" : "view";
}

export function safeDownloadName(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").trim();
  return cleaned || "hr-document";
}
