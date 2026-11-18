import assert from "node:assert/strict";
import { test } from "node:test";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { HysBarcode, HysInputMask, HysTag, HysVirtualList, HysWatermark } from "../packages/ui/dist/index.js";
import { encodeBarcode, barcodeBars } from "../packages/ui/dist/components/HysBarcode/barcodeEncoding.js";
import { maskTokens, readMask, formatMask } from "../packages/ui/dist/components/HysInputMask/maskInput.js";
import { fixedVirtualRange } from "../packages/ui/dist/composables/fixedVirtualRange.js";
import { virtualOffsetIndex } from "../packages/ui/dist/composables/virtualOffsets.js";
import { highlightText, middleEllipsis } from "../packages/ui/dist/components/HysOverflowText/overflowText.js";
import { keyValueFromText, readKeyValueRows } from "../packages/ui/dist/components/HysKeyValueEditor/keyValueData.js";

test("retail codes compute and validate check digits, preserving leading zero", () => {
  for (const [format, value, complete, modules] of [
    ["EAN13", "690123456789", "6901234567892", 95],
    ["EAN8", "9638507", "96385074", 67],
    ["UPCA", "03600029145", "036000291452", 95],
  ]) {
    const encoded = encodeBarcode(value, format);
    assert.equal(encoded.value, complete);
    assert.equal(encoded.bits.length, modules);
    assert.equal(encoded.bits.slice(0, 3), "101");
    assert.equal(encoded.bits.slice(-3), "101");
    assert.deepEqual(encodeBarcode(complete, format), encoded);
    const bad = complete.slice(0, -1) + ((Number(complete.at(-1)) + 1) % 10);
    assert.match(encodeBarcode(bad, format).error, /校验位/);
  }
  assert.deepEqual(encodeBarcode("036000291452", "UPCA").bits, encodeBarcode("0036000291452", "EAN13").bits);
  assert.match(encodeBarcode("690123号", "EAN13").error, /数字/);
});

test("linear codes emit correct Code 128 symbols and Code 39 guard widths", () => {
  const widths = bits => bits.match(/1+|0+/g).map(run => run.length).join("");
  assert.equal(widths(encodeBarcode("1234", "CODE128").bits), "2112321122321311231212412331112");
  assert.equal(widths(encodeBarcode("AB", "CODE128").bits), "2112141113231311234111312331112");
  assert.equal(widths(encodeBarcode("A", "CODE39").bits), "13113131113111131131131131311");
  assert.match(encodeBarcode("中文", "CODE128").error, /ASCII/);
  assert.match(encodeBarcode("*AB*", "CODE39").error, /Code 39/);
  assert.deepEqual(barcodeBars("10111001"), [{ start: 0, width: 1 }, { start: 2, width: 3 }, { start: 7, width: 1 }]);
});

test("mask formatting preserves raw values, paste filtering and caret mapped onto separators", () => {
  const phone = maskTokens("### #### ####");
  assert.equal(readMask(phone, "138 0000 1234 extra", true), "13800001234");
  const display = formatMask(phone, "13800001234");
  assert.equal(display.text, "138 0000 1234");
  assert.deepEqual(display.offsets.slice(0, 6), [0, 1, 2, 3, 5, 6]);
  const custom = maskTokens("AA-###");
  assert.equal(readMask(custom, "A0B-0x92", true), "AB092");
  assert.equal(formatMask(custom, "AB092").text, "AB-092");
  assert.equal(formatMask(maskTokens("\\A-*"), "B").text, "A-B");
});

test("Unicode masks preserve surrogate pairs and accept custom one-character rules", () => {
  const tokens = maskTokens("AA-X", { X: /[０-９]/gu });
  assert.equal(readMask(tokens, "港𠀋-８", true), "港𠀋８");
  assert.deepEqual(formatMask(tokens, "港𠀋８"), { text: "港𠀋-８", offsets: [0, 1, 3, 3, 5] });
});

test("middle ellipsis keeps file suffixes and highlight matching is literal", () => {
  assert.equal(middleEllipsis("abcdefgh.abc", text => text.length <= 10), "abcde….abc");
  assert.equal(middleEllipsis("短", text => text.length <= 10), "短");
  assert.deepEqual(highlightText("X.*x", [".*", "X"]).filter(part => part.match).map(part => part.text), ["X", ".*", "x"]);
});

test("typed key-value import preserves field order and duplicate rows", () => {
  const rows = readKeyValueRows('{"2":true,"1":{"x":",]"},"2":"001","n":9007199254740993}', "json");
  assert.deepEqual(rows.map(row => row.key), ["2", "1", "2", "n"]);
  assert.deepEqual(rows.slice(0, 3).map(row => keyValueFromText(row.value, row.type)), [true, {x: ",]"}, "001"]);
  assert.throws(() => keyValueFromText(rows[3].value, rows[3].type), /安全/);
  assert.deepEqual(readKeyValueRows("host=dev=example\nport\t80", "pairs").map(row => row.value), ["dev=example", "80"]);
});

test("virtual offsets find the variable-length row at range boundaries", () => {
  const offsets = [0, 24, 156, 260];
  assert.equal(virtualOffsetIndex(offsets, 23), 0);
  assert.equal(virtualOffsetIndex(offsets, 24), 1);
  assert.equal(virtualOffsetIndex(offsets, 157), 2);
  assert.equal(virtualOffsetIndex(offsets, 260), 2);
});

test("fixed-height virtualization covers visible rows, overscan and empty lists", () => {
  assert.deepEqual(fixedVirtualRange(10000, 40, 4000, 220, 4), { start: 96, end: 109, visibleStart: 100, visibleEnd: 105 });
  assert.deepEqual(fixedVirtualRange(0, 40, 0, 220, 4), { start: 0, end: -1, visibleStart: 0, visibleEnd: -1 });
  assert.equal(fixedVirtualRange(3, 40, 0, 220, 4).end, 2);
});

test("SSR exposes barcode labels, input labels and only a virtual row window", async () => {
  const html = await renderToString(createSSRApp({
    render: () => h("main", [
      h(HysBarcode, { value: "9638507", format: "EAN8" }),
      h(HysInputMask, { modelValue: "20261118", preset: "date", "aria-label": "日期掩码" }),
      h(HysTag, { label: "已锁定", selectable: true, selected: true }),
      h(HysVirtualList, { items: Array.from({ length: 1000 }, (_, i) => i), height: 100, rowHeight: 20 },
        { item: ({ item }) => "日志 " + item }),
      h(HysWatermark, { text: "水印 <内部>" }, { default: () => "可读正文" }),
    ]),
  }));
  assert.match(html, /aria-label="EAN8 96385074"/);
  assert.match(html, /aria-label="日期掩码"/);
  assert.match(html, /aria-pressed="true"/);
  assert.equal((html.match(/role="listitem"/g) ?? []).length, 9);
  assert.match(html, /aria-setsize="1000"/);
  assert.match(html, /%26lt%3B/);
  assert.match(html, /可读正文/);
});
