import type {
  PersonnelImportIssue,
  PersonnelImportPreview,
  PersonnelImportPreviewRow,
  PersonnelImportRawRow,
  PersonnelImportReferences,
} from "../domain/personnel-import";

function upper(value: string) { return value.trim().toUpperCase(); }
function lower(value: string) { return value.trim().toLocaleLowerCase("tr-TR"); }

export function normalizeImportPhone(value: string) {
  const raw = value.trim().replace(/[\s()-]/g, "");
  const normalized = raw.startsWith("0") ? `+90${raw.slice(1)}` : /^5\d{9}$/.test(raw) ? `+90${raw}` : raw;
  return /^\+[1-9]\d{9,14}$/.test(normalized) ? normalized : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

function counts(values: string[]) {
  const result = new Map<string, number>();
  values.filter(Boolean).forEach(value => result.set(value, (result.get(value) ?? 0) + 1));
  return result;
}

export function validatePersonnelImportRows(rawRows: PersonnelImportRawRow[], references: PersonnelImportReferences, fileName = "personel.xlsx", skipped = 0): PersonnelImportPreview {
  const existingCodes = new Set(references.existing.employeeCodes.map(upper));
  const existingEmails = new Set(references.existing.emails.map(lower));
  const existingPhones = new Set(references.existing.phones);
  const chiefs = new Set(references.chiefs.map(item => upper(item.employeeCode)));
  const organizations = new Map(references.organizations.map(item => [upper(item.code), item]));
  const departments = new Map(references.departments.map(item => [upper(item.code), item]));
  const teams = new Map(references.teams.map(item => [upper(item.code), item]));

  const codeCounts = counts(rawRows.map(row => upper(row.employeeCode)));
  const emailCounts = counts(rawRows.map(row => lower(row.email)));
  const phoneCounts = counts(rawRows.map(row => normalizeImportPhone(row.phone) ?? row.phone.trim()));

  const rows: PersonnelImportPreviewRow[] = rawRows.map(raw => {
    const issues: PersonnelImportIssue[] = [];
    const employeeCode = upper(raw.employeeCode);
    const email = lower(raw.email);
    const phone = normalizeImportPhone(raw.phone);
    const chiefCode = upper(raw.chiefCode);
    const organizationCode = upper(raw.organizationCode);
    const departmentCode = upper(raw.departmentCode);
    const teamCode = upper(raw.teamCode);
    const add = (field: PersonnelImportIssue["field"], severity: PersonnelImportIssue["severity"], message: string) => issues.push({ field, severity, message });

    if (!raw.displayName.trim()) add("displayName", "ERROR", "Ad Soyad zorunludur.");
    if (raw.displayName.trim().length > 120) add("displayName", "ERROR", "Ad Soyad 120 karakteri aşamaz.");
    if (!raw.jobTitle.trim()) add("jobTitle", "ERROR", "Görev zorunludur.");
    if (!raw.phone.trim()) add("phone", "ERROR", "Telefon zorunludur.");
    else if (!phone) add("phone", "ERROR", "Telefon uluslararası formatta olmalıdır.");
    if (!email) add("email", "ERROR", "E-posta zorunludur.");
    else if (!isValidEmail(email)) add("email", "ERROR", "E-posta formatı geçersizdir.");
    if (!chiefCode) add("chiefCode", "ERROR", "Şef No zorunludur.");
    else if (!chiefs.has(chiefCode)) add("chiefCode", "ERROR", "Aktif şef bulunamadı.");
    if (!organizationCode) add("organizationCode", "ERROR", "Organizasyon Kodu zorunludur.");
    if (!departmentCode) add("departmentCode", "ERROR", "Departman Kodu zorunludur.");

    if (employeeCode) {
      if (!/^PMTHR\d{6}$/.test(employeeCode)) add("employeeCode", "ERROR", "Personel No PMTHR000001 formatında olmalıdır.");
      if ((codeCounts.get(employeeCode) ?? 0) > 1) add("employeeCode", "ERROR", "Personel No dosyada tekrar ediyor.");
      if (existingCodes.has(employeeCode)) add("employeeCode", "ERROR", "Personel No şirkette zaten kayıtlıdır.");
    } else add("employeeCode", "WARNING", "Personel No sistem tarafından üretilecektir.");

    if (email && (emailCounts.get(email) ?? 0) > 1) add("email", "ERROR", "E-posta dosyada tekrar ediyor.");
    if (email && existingEmails.has(email)) add("email", "ERROR", "E-posta şirkette zaten kayıtlıdır.");
    if (phone && (phoneCounts.get(phone) ?? 0) > 1) add("phone", "ERROR", "Telefon dosyada tekrar ediyor.");
    if (phone && existingPhones.has(phone)) add("phone", "ERROR", "Telefon şirkette zaten kayıtlıdır.");

    const organization = organizations.get(organizationCode);
    const department = departments.get(departmentCode);
    const team = teamCode ? teams.get(teamCode) : undefined;
    if (organizationCode && !organization) add("organizationCode", "ERROR", "Organizasyon bulunamadı.");
    if (departmentCode && !department) add("departmentCode", "ERROR", "Departman bulunamadı.");
    if (organization && department && department.organizationId !== organization.id) add("departmentCode", "ERROR", "Departman seçilen organizasyona bağlı değildir.");
    if (teamCode && !team) add("teamCode", "ERROR", "Takım bulunamadı.");
    if (team && department && team.departmentId !== department.id) add("teamCode", "ERROR", "Takım seçilen departmana bağlı değildir.");

    const status = issues.some(issue => issue.severity === "ERROR") ? "ERROR" : issues.some(issue => issue.severity === "WARNING") ? "WARNING" : "VALID";
    return {
      rowNumber: raw.rowNumber,
      status,
      values: {
        ...raw,
        employeeCode,
        displayName: raw.displayName.trim(),
        phone: phone ?? raw.phone.trim(),
        email,
        jobTitle: raw.jobTitle.trim(),
        chiefCode,
        organizationCode,
        departmentCode,
        teamCode,
        organizationId: organization?.id ?? null,
        departmentId: department?.id ?? null,
        teamId: team?.id ?? null,
      },
      issues,
    };
  });

  return {
    importBatchId: crypto.randomUUID(),
    fileName,
    summary: {
      total: rows.length,
      valid: rows.filter(row => row.status === "VALID").length,
      warning: rows.filter(row => row.status === "WARNING").length,
      error: rows.filter(row => row.status === "ERROR").length,
      skipped,
    },
    rows,
  };
}
