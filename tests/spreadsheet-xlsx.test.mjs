import { test } from "node:test";
import assert from "node:assert/strict";
import { strToU8, strFromU8, unzipSync, zipSync } from "fflate";
import { decodeXlsx } from "../packages/ui/dist/components/HysSpreadsheet/xlsx/xlsxRead.js";
import { encodeXlsx } from "../packages/ui/dist/components/HysSpreadsheet/xlsx/xlsxWrite.js";

const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const office =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const relationships =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const rels = (...parts) =>
  `<Relationships xmlns="${relationships}">${parts
    .map(
      ([id, type, target]) =>
        `<Relationship Id="${id}" Type="${office}/${type}" Target="${target}"/>`,
    )
    .join("")}</Relationships>`;

function independentFile(sheet, additions = {}) {
  const parts = {
    "_rels/.rels": rels(["root", "officeDocument", "work/book.xml"]),
    "work/book.xml": `<workbook xmlns="${main}" xmlns:r="${office}"><workbookPr date1904="1"/><sheets><sheet name="Sales" sheetId="7" r:id="sheet"/></sheets><definedNames><definedName name="Revenue">Sales!$B$2:$B$3</definedName></definedNames></workbook>`,
    "work/_rels/book.xml.rels": rels(
      ["sheet", "worksheet", "../tables/data.xml"],
      ["strings", "sharedStrings", "strings.xml"],
      ["styles", "styles", "style.xml"],
    ),
    "work/strings.xml": `<sst xmlns="${main}"><si><r><t xml:space="preserve">001 </t></r><r><t>商品</t></r></si><si><t>=literal</t></si></sst>`,
    "work/style.xml": `<styleSheet xmlns="${main}"><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>`,
    "tables/data.xml": `<worksheet xmlns="${main}">${sheet}</worksheet>`,
    ...additions,
  };
  return zipSync(
    Object.fromEntries(
      Object.entries(parts).map(([key, value]) => [key, strToU8(value)]),
    ),
  );
}

test("XLSX imports OPC relationships, rich strings, a shared formula and 1904 dates", () => {
  const input =
    independentFile(`<dimension ref="A1:D3"/><sheetViews><sheetView><pane ySplit="1" state="frozen"/></sheetView></sheetViews>
    <sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" s="1"><v>1</v></c><c r="D1" t="b"><v>0</v></c></row>
    <row r="2"><c r="A2"><v>4</v></c><c r="B2"><f t="shared" si="5" ref="B2:B3">A2+$A$2</f><v>8</v></c></row>
    <row r="3"><c r="A3"><v>9</v></c><c r="B3"><f t="shared" si="5"/><v>13</v></c></row></sheetData>
    <dataValidations count="1"><dataValidation type="list" sqref="D2:D1048576" allowBlank="1"><formula1>"Open,Done"</formula1></dataValidation></dataValidations>`);
  const book = decodeXlsx(input, "fixture");
  const sheet = book.sheets[0];
  assert.equal(book.name, "fixture");
  assert.deepEqual(sheet.rows, [
    ["001 商品", "'=literal", "1904-01-02", false],
    [4, "=A2+$A$2"],
    [9, "=A3+$A$2"],
  ]);
  assert.equal(sheet.cells.C1.type, "date");
  assert.equal(sheet.frozenRows, 1);
  assert.deepEqual(sheet.cells.D3.options, ["Open", "Done"]);
  assert.deepEqual(book.names.Revenue, { sheetId: sheet.id, range: "B2:B3" });
});

test("XLSX writes typed values, cached formulas, metadata and layout to the expected OOXML parts", () => {
  const bytes = encodeXlsx({
    name: "Export",
    sheets: [
      {
        id: "sales",
        name: "销售",
        rows: [
          ["编码", "价格", "交付", "状态"],
          ["001", 12, "2026-12-01", "已完成"],
          [null, "=B2*2", null, true],
          [],
        ],
        frozenRows: 1,
        frozenColumns: 1,
        merges: ["A4:D4"],
        tabColor: "#345ec4",
        formats: {
          B2: {
            bold: true,
            number: "currency",
            currency: "USD",
            backgroundColor: "#123456",
          },
        },
        cells: {
          A2: { link: "https://example.test/item", note: "测试备注" },
          C2: { type: "date" },
          D2: { type: "select", options: ["待完成", "已完成"] },
        },
        rowOptions: { 2: { hidden: true } },
        columnOptions: { 1: { size: 124 } },
      },
      { id: "totals", name: "汇总", rows: [["='销售'!B3"]], hidden: true },
    ],
    names: { Total: { sheetId: "totals", range: "A1" } },
  });
  const files = unzipSync(bytes);
  const sheetXml = strFromU8(files["xl/worksheets/sheet1.xml"]);
  assert.match(sheetXml, /<f>B2\*2<\/f><v>24<\/v>/);
  assert.match(sheetXml, /<mergeCell ref="A4:D4"/);
  assert.match(sheetXml, /<legacyDrawing r:id="rId3"/);
  assert.match(
    strFromU8(files["[Content_Types].xml"]),
    /spreadsheetml\.sheet\.main\+xml/,
  );
  const book = decodeXlsx(bytes);
  const sheet = book.sheets[0];
  assert.equal(sheet.rows[1][0], "001");
  assert.equal(sheet.rows[1][2], "2026-12-01");
  assert.equal(sheet.rows[2][3], true);
  assert.equal(sheet.formats.B2.backgroundColor, "#123456");
  assert.equal(sheet.cells.A2.note, "测试备注");
  assert.equal(sheet.cells.A2.link, "https://example.test/item");
  assert.equal(sheet.rowOptions[2].hidden, true);
  assert.equal(sheet.columnOptions[1].size, 124);
  assert.equal(sheet.frozenColumns, 1);
  assert.equal(book.sheets[1].hidden, true);
  assert.equal(book.sheets[1].rows[0][0], "='销售'!B3");
});

test("XLSX retains the default display formats of typed percentage, currency and multiline cells", () => {
  const values = [0.125, 1248.5, "第一行\n第二行", "09:05:30", "2028-02-29T16:05:25"];
  const bytes = encodeXlsx({ sheets: [{
    id: "s", name: "Typed", rows: [values],
    cells: {
      A1: { type: "percent" }, B1: { type: "currency" }, C1: { type: "multiline" },
      D1: { type: "time" }, E1: { type: "datetime-local" },
    },
  }] });
  const [sheet] = decodeXlsx(bytes).sheets;
  assert.deepEqual(sheet.rows[0], values);
  assert.equal(sheet.formats.A1.number, "percent");
  assert.equal(sheet.formats.B1.number, "currency");
  assert.equal(sheet.formats.C1.overflow, "wrap");
});

test("XLSX rejects corrupt or over-limit data without a truncated workbook", () => {
  assert.throws(() => decodeXlsx(new Uint8Array([1, 2, 3, 4])));
  assert.throws(
    () =>
      decodeXlsx(independentFile('<dimension ref="A1:A10001"/><sheetData/>')),
    /超出/,
  );
  assert.throws(
    () => encodeXlsx({ sheets: [{ id: "x", name: "Bad/Name", rows: [[1]] }] }),
    /名称/,
  );
});
