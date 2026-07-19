import "server-only";

import { strFromU8, unzipSync } from "fflate";
import readXlsxFile from "read-excel-file/node";
import { PERSONNEL_IMPORT_MAX_FILE_BYTES, PERSONNEL_IMPORT_MAX_ROWS, type PersonnelImportRawRow } from "../domain/personnel-import";

const HEADER_MAP = {
  "PERSONEL NO (OPSİYONEL)": "employeeCode",
  "PERSONEL NO": "employeeCode",
  "AD SOYAD": "displayName",
  "TELEFON": "phone",
  "E-POSTA": "email",
  "EPOSTA": "email",
  "GÖREV": "jobTitle",
  "ŞEF NO": "chiefCode",
  "ORGANİZASYON KODU": "organizationCode",
  "DEPARTMAN KODU": "departmentCode",
  "TAKIM KODU": "teamCode",
} as const;

type ImportField = (typeof HEADER_MAP)[keyof typeof HEADER_MAP];
const REQUIRED_HEADERS: ImportField[] = ["displayName", "phone", "email", "jobTitle", "chiefCode", "organizationCode", "departmentCode"];

function normalizedHeader(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");
}

function cellText(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "function" || typeof value === "object") throw new Error("Desteklenmeyen Excel hücre değeri.");
  return String(value).trim();
}

function rejectFormulaCells(bytes: Uint8Array) {
  const archive = unzipSync(bytes);
  for (const [path, contents] of Object.entries(archive)) {
    if (!/^xl\/worksheets\/sheet\d+\.xml$/i.test(path)) continue;
    if (/<f(?:\s|>)/i.test(strFromU8(contents))) throw new Error("Formül içeren hücreler kabul edilmez.");
  }
}

export async function parsePersonnelImportWorkbook(file: File) {
  if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".xlsx")) throw new Error("Yalnız .xlsx dosyaları kabul edilir.");
  if (file.size <= 0) throw new Error("Excel dosyası boş.");
  if (file.size > PERSONNEL_IMPORT_MAX_FILE_BYTES) throw new Error("Excel dosyası en fazla 5 MB olabilir.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  rejectFormulaCells(bytes);
  const sheets = await readXlsxFile(Buffer.from(bytes), { trim: true });
  const sheet = sheets.find(item => item.sheet === "Personeller") ?? sheets[0];
  if (!sheet) throw new Error("Excel çalışma sayfası bulunamadı.");

  const headerByColumn = new Map<number, ImportField>();
  const headerRow = sheet.data[0] ?? [];
  headerRow.forEach((cell, columnIndex) => {
    const mapped = HEADER_MAP[normalizedHeader(cellText(cell)) as keyof typeof HEADER_MAP];
    if (mapped) headerByColumn.set(columnIndex, mapped);
  });
  const present = new Set(headerByColumn.values());
  const missing = REQUIRED_HEADERS.filter(field => !present.has(field));
  if (missing.length) throw new Error("Excel şablonu geçersiz veya zorunlu sütunlar eksik.");

  const rows: PersonnelImportRawRow[] = [];
  let skipped = 0;
  for (let rowIndex = 1; rowIndex < sheet.data.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1;
    const values: Record<ImportField, string> = {
      employeeCode: "", displayName: "", phone: "", email: "", jobTitle: "", chiefCode: "", organizationCode: "", departmentCode: "", teamCode: "",
    };
    for (const [columnIndex, field] of headerByColumn) values[field] = cellText(sheet.data[rowIndex]?.[columnIndex]);
    if (Object.values(values).every(value => !value)) { skipped += 1; continue; }
    rows.push({ rowNumber, ...values });
    if (rows.length > PERSONNEL_IMPORT_MAX_ROWS) throw new Error(`Bir dosyada en fazla ${PERSONNEL_IMPORT_MAX_ROWS} personel aktarılabilir.`);
  }
  if (!rows.length) throw new Error("Excel dosyasında aktarılabilir personel satırı bulunamadı.");
  return { rows, skipped };
}
