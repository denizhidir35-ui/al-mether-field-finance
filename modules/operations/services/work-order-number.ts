import type { ProjectCode, TargetCode } from "../domain/identifiers";

function normalize(value: string, prefix: string) {
  const clean = value.trim().toUpperCase().replace(new RegExp(`^${prefix}-?`), "");
  if (!/^\d{1,6}$/.test(clean)) return null;
  return `${prefix}-${clean.padStart(4, "0")}`;
}

export function normalizeProjectNumber(value: string) {
  return normalize(value, "ALM") as ProjectCode | null;
}

export function normalizeDekaNumber(value: string) {
  return normalize(value.replace(/^DEKA-?/i, ""), "TGT") as TargetCode | null;
}
