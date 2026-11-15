import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { npm } from "./npm.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const packages = JSON.parse(fs.readFileSync(path.join(root, "artifacts/feature-packages.json"), "utf8"));
const core = packages.find(pkg => pkg.name === "hys-ui-core");
assert(core && packages.every(pkg => pkg.version === core.version), "Expected packages at the same version");

const temp = fs.realpathSync(os.tmpdir());
const consumer = fs.mkdtempSync(path.join(temp, "hys-ui-feature-test-"));
const runtime = code => execFileSync(
  process.execPath,
  ["--input-type=module", "-e", code],
  { cwd: consumer, stdio: "inherit" },
);
const install = archives => npm(
  ["install", "--no-audit", "--no-fund", "--ignore-scripts", ...archives.map(pkg => pkg.file)],
  { cwd: consumer, stdio: "inherit" },
);
try {
  fs.writeFileSync(path.join(consumer, "package.json"), JSON.stringify({
    name: "hys-ui-feature-consumer", private: true, type: "module", dependencies: { vue: "^3.5.13" },
  }));
  install([core]);
  for (const name of [
    "hys-ui", "@codemirror/state", "unified", "@cfworker/json-schema",
    "jsonrepair", "yaml", "fflate", "saxes", "pinyin-pro",
  ]) {
    assert(!fs.existsSync(path.join(consumer, "node_modules", name)), "Core installed " + name);
  }
  runtime(`
    import assert from "node:assert/strict";
    import * as core from "hys-ui-core";
    import { spreadsheetFiles } from "hys-ui-core/internal/components/HysSpreadsheet/spreadsheetFiles";
    import { loadMentionPinyin } from "hys-ui-core/internal/composables/mentionPinyin";
    assert(core.HysButton && core.HysForm && core.HysSpreadsheet && core.HysRichTextEditor);
    assert(!core.HysJsonEditor && !core.HysMarkdownEditor);
    assert.deepEqual([...spreadsheetFiles().keys()], ["json"]);
    assert.equal(await loadMentionPinyin(), undefined);
  `);

  install(packages.filter(pkg => pkg !== core));
  runtime(`
    import assert from "node:assert/strict";
    import { createSSRApp, h } from "vue";
    import { renderToString } from "vue/server-renderer";
    import { provideHysConfig } from "hys-ui-core";
    import { spreadsheetFiles } from "hys-ui-core/internal/components/HysSpreadsheet/spreadsheetFiles";
    import { HysJsonEditor } from "hys-ui-json";
    import { HysMarkdownEditor } from "hys-ui-markdown";
    import { createSpreadsheetExcelFormat } from "hys-ui-xlsx";
    import { loadMentionPinyin } from "hys-ui-pinyin";

    assert(HysJsonEditor);
    const rendered = await renderToString(createSSRApp({
      setup() {
        provideHysConfig({ theme: "green" });
        return () => h(HysMarkdownEditor, { modelValue: "# Test", view: "preview" });
      },
    }));
    assert.match(rendered, /theme="green"/);
    assert(rendered.includes(">Test</h1>"));

    const format = spreadsheetFiles([createSpreadsheetExcelFormat()]).get("xlsx");
    const book = { sheets: [{ id: "main", name: "Data", rows: [["First", 42]] }] };
    const blob = await format.encode(book);
    const decoded = await format.decode(new File([blob], "Data.xlsx"));
    assert.deepEqual(decoded.sheets[0].rows[0], ["First", 42]);
    const pinyin = await loadMentionPinyin();
    assert.deepEqual(pinyin("张三"), ["zhang", "san"]);
  `);

  fs.writeFileSync(path.join(consumer, "fixture.ts"), `
    import { h } from "vue";
    import { HysMention, HysSpreadsheet, type HysMentionPinyinLoader } from "hys-ui-core";
    import { HysJsonEditor, type HysJsonEditorView } from "hys-ui-json";
    import { HysMarkdownEditor, type HysMarkdownEditorView } from "hys-ui-markdown";
    import { createSpreadsheetExcelFormat } from "hys-ui-xlsx";
    import { loadMentionPinyin } from "hys-ui-pinyin";

    const pinyinLoader: HysMentionPinyinLoader = loadMentionPinyin;
    const view: HysJsonEditorView = "tree";
    const markdownView: HysMarkdownEditorView = "split";
    void [
      h(HysMention, { pinyinLoader }),
      h(HysSpreadsheet, { fileFormats: [createSpreadsheetExcelFormat()] }),
      h(HysJsonEditor, { view }),
      h(HysMarkdownEditor, { view: markdownView }),
    ];
  `);
  execFileSync(process.execPath, [
    path.join(root, "node_modules/vue-tsc/bin/vue-tsc.js"), "--noEmit", "--strict", "--skipLibCheck",
    "--target", "ES2022", "--module", "ESNext", "--moduleResolution", "Bundler", "fixture.ts",
  ], { cwd: consumer, stdio: "inherit" });
  console.log("PASS: core dependency boundaries, packages, public types, shared theme, XLSX round trip and Pinyin");
} finally {
  assert.equal(path.dirname(fs.realpathSync(consumer)), temp);
  fs.rmSync(consumer, { recursive: true, force: true });
}
