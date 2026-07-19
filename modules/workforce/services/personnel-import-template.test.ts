import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { strFromU8, unzipSync } from "fflate";
import readXlsxFile from "read-excel-file/node";

const templateUrl = new URL("../../../public/templates/al-mether-personel-import.xlsx", import.meta.url);

test("downloadable personnel template is readable and matches the server contract", async () => {
  const sheets = await readXlsxFile(Buffer.from(readFileSync(templateUrl)), { trim: true });
  const sheet = sheets.find(item => item.sheet === "Personeller");
  assert.ok(sheet);
  assert.deepEqual(sheet.data[0], [
    "Personel No (Opsiyonel)", "Ad Soyad", "Telefon", "E-posta", "Görev", "Şef No",
    "Organizasyon Kodu", "Departman Kodu", "Takım Kodu",
  ]);
  assert.ok(!sheet.data[0]?.some(value => String(value).toLocaleLowerCase("tr-TR").includes("company")));
});

test("downloadable personnel template contains no formulas", () => {
  const archive = unzipSync(readFileSync(templateUrl));
  const formulas = Object.entries(archive)
    .filter(([path]) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(path))
    .filter(([, contents]) => /<f(?:\s|>)/i.test(strFromU8(contents)));
  assert.equal(formulas.length, 0);
});
