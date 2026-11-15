import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { npm } from "./npm.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const ui = path.join(root, "packages/ui");
const dist = path.join(ui, "dist");
const artifacts = path.join(root, "artifacts");
const manifest = JSON.parse(fs.readFileSync(path.join(ui, "package.json"), "utf8"));
const { version, repository, peerDependencies } = manifest;
const coreName = "hys-ui-core";
const features = [
  {
    name: "hys-ui-markdown",
    source: "components/HysMarkdownEditor/",
    entry: "components/HysMarkdownEditor/HysMarkdownEditor.vue",
    exportName: "HysMarkdownEditor",
    dependencies: [
      "@codemirror/commands", "@codemirror/lang-markdown", "@codemirror/language",
      "@codemirror/state", "@codemirror/view", "@lezer/markdown", "@lezer/highlight",
      "github-slugger", "rehype-sanitize", "remark-gfm", "remark-parse", "remark-rehype", "unified",
    ],
    readme: 'import { HysMarkdownEditor } from "hys-ui-markdown";',
  },
  {
    name: "hys-ui-json",
    source: "components/HysJsonEditor/",
    entry: "components/HysJsonEditor/HysJsonEditor.vue",
    exportName: "HysJsonEditor",
    dependencies: [
      "@codemirror/commands", "@codemirror/lang-json", "@codemirror/language",
      "@codemirror/state", "@codemirror/view", "@lezer/highlight",
      "@cfworker/json-schema", "jsonrepair", "yaml",
    ],
    readme: 'import { HysJsonEditor } from "hys-ui-json";',
  },
  {
    name: "hys-ui-xlsx",
    source: "components/HysSpreadsheet/xlsx/",
    entry: "components/HysSpreadsheet/xlsx/spreadsheetExcel",
    dependencies: ["fflate", "saxes"],
    readme: 'import { createSpreadsheetExcelFormat } from "hys-ui-xlsx";\nconst fileFormats = [createSpreadsheetExcelFormat()]; // HysSpreadsheet 的 fileFormats',
  },
  {
    name: "hys-ui-pinyin",
    source: "composables/mentionPinyin",
    entry: "composables/mentionPinyin",
    dependencies: ["pinyin-pro"],
    readme: 'import { loadMentionPinyin } from "hys-ui-pinyin";\nconst pinyinLoader = loadMentionPinyin; // HysMention 的 pinyinLoader',
  },
];

const fold = relative => relative.replaceAll(path.sep, "/");
const write = (rootPath, relative, body) => {
  const target = path.join(rootPath, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
};
const read = relative => fs.readFileSync(path.join(dist, relative), "utf8");
const modulePath = relative => relative.replace(/^types\//, "");
const owns = (feature, relative) => modulePath(relative).startsWith(
  feature.source.endsWith("/") ? feature.source : feature.source + "."
);
const modules = fs.readdirSync(dist, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => fold(path.relative(dist, path.join(entry.parentPath, entry.name))));

function parse(file, source) {
  const scriptKind = file.endsWith(".js") ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
}

function rewriteFeatureImports(file, source, feature) {
  const ast = parse(file, source);
  const edits = [];
  function visit(node) {
    if (ts.isStringLiteral(node)) {
      const owner = node.parent;
      if (ts.isImportDeclaration(owner) || ts.isExportDeclaration(owner) ||
        (ts.isCallExpression(owner) && owner.expression.kind === ts.SyntaxKind.ImportKeyword) ||
        (ts.isLiteralTypeNode(owner) && ts.isImportTypeNode(owner.parent))) {
        const specifier = node.text;
        if (specifier.startsWith(".")) {
          const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
          if (!owns(feature, resolved) && !owns(feature, resolved + ".js")) {
            const subpath = modulePath(resolved).replace(/\.js$/, "");
            edits.push({ start: node.getStart(ast), end: node.end, value: JSON.stringify(coreName + "/internal/" + subpath) });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  for (const { start, end, value } of edits.reverse()) source = source.slice(0, start) + value + source.slice(end);
  return source;
}

function coreIndex(file, source) {
  const ast = parse(file, source);
  const editors = features.filter(feature => feature.exportName);
  const excluded = spec => editors.some(feature => spec.includes(feature.source));
  const bindings = new Set();
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
      !excluded(statement.moduleSpecifier.text)) continue;
    const imports = statement.importClause;
    if (imports?.name) bindings.add(imports.name.text);
    if (imports?.namedBindings && ts.isNamedImports(imports.namedBindings)) {
      for (const specifier of imports.namedBindings.elements) bindings.add(specifier.name.text);
    }
  }
  return ast.statements.flatMap(statement => {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) &&
      excluded(statement.moduleSpecifier.text)) return [];
    if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier &&
      statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      const entries = statement.exportClause.elements.filter(entry => !bindings.has((entry.propertyName ?? entry.name).text));
      return entries.length ? ["export { " + entries.map(entry => entry.getText(ast)).join(",\n  ") + " };"] : [];
    }
    return [statement.getText(ast)];
  }).join("\n") + "\n";
}

function coreFiles(stage) {
  for (const file of modules) {
    if (features.some(feature => owns(feature, file))) {
      if (file === "composables/mentionPinyin.js") {
        write(stage, "dist/" + file, "export const loadMentionPinyin = async () => undefined;\n");
      } else if (file === "types/composables/mentionPinyin.d.ts") {
        write(stage, "dist/" + file, read(file));
      }
      continue;
    }
    if (file === "components/HysSpreadsheet/spreadsheetExcelDefault.js") {
      write(stage, "dist/" + file, "export function defaultSpreadsheetExcelFormat() { return undefined; }\n");
    } else if (file === "index.js" || file === "types/index.d.ts") {
      write(stage, "dist/" + file, coreIndex(file, read(file)));
    } else {
      write(stage, "dist/" + file, fs.readFileSync(path.join(dist, file)));
    }
  }
}

const dependencies = names => Object.fromEntries(names.map(name => {
  assert(manifest.dependencies[name], "Missing dependency range for " + name);
  return [name, manifest.dependencies[name]];
}));

function stagePackage(stageRoot, feature) {
  const base = !feature;
  const name = feature?.name ?? coreName;
  const stage = path.join(stageRoot, name);
  const entry = feature?.entry ?? "index";
  const main = "./dist/" + entry + ".js";
  const types = "./dist/types/" + entry + ".d.ts";
  const featureExports = { ".": { types: "./dist/types/index.d.ts", import: "./dist/index.js" }, "./package.json": "./package.json" };
  const exports = base
    ? { ...manifest.exports, "./internal/*": { types: "./dist/types/*.d.ts", import: "./dist/*.js" } }
    : featureExports;
  const data = {
    name, version, description: base ? "HYS UI components with optional editor and file packages" : "Optional feature for HYS UI",
    type: "module", license: manifest.license, repository, files: ["dist", "README.md", "LICENSE"],
    main: base ? main : "./dist/index.js",
    types: base ? types : "./dist/types/index.d.ts",
    exports, sideEffects: manifest.sideEffects,
    peerDependencies: base ? peerDependencies : { [coreName]: version, ...peerDependencies },
    dependencies: dependencies(feature?.dependencies ?? ["async-validator", "dompurify"]),
    publishConfig: manifest.publishConfig,
  };
  if (base) coreFiles(stage);
  else {
    for (const file of modules.filter(file => owns(feature, file))) {
      const source = read(file);
      write(stage, "dist/" + file, rewriteFeatureImports(file, source, feature));
    }
    assert(fs.existsSync(path.join(stage, main)), "Missing runtime entry for " + name);
    assert(fs.existsSync(path.join(stage, types)), "Missing types entry for " + name);
    const scriptExport = feature.exportName ? "export { default as " + feature.exportName + " } from " : "export * from ";
    write(stage, "dist/index.js", scriptExport + JSON.stringify("./" + entry + ".js") + ";\n");
    const typesExport = feature.exportName
      ? scriptExport + JSON.stringify("./" + entry) + ";\nexport type * from " : "export * from ";
    write(stage, "dist/types/index.d.ts", typesExport + JSON.stringify("./" + entry) + ";\n");
  }
  write(stage, "package.json", JSON.stringify(data, null, 2) + "\n");
  write(stage, "LICENSE", fs.readFileSync(path.join(ui, "LICENSE")));
  const example = feature?.readme ?? 'import { HysButton } from "hys-ui-core";\nimport "hys-ui-core/style.css";';
  const fence = String.fromCharCode(96).repeat(3);
  write(stage, "README.md", "# " + name + "\n\n" + data.description + "\n\n" + fence + "ts\n" + example + "\n" + fence + "\n");
  return stage;
}

const temp = fs.realpathSync(os.tmpdir());
const stageRoot = fs.mkdtempSync(path.join(temp, "hys-ui-features-"));
fs.mkdirSync(artifacts, { recursive: true });
try {
  const packed = [];
  for (const feature of [undefined, ...features]) {
    const stage = stagePackage(stageRoot, feature);
    const [result] = JSON.parse(npm(["pack", stage, "--json", "--pack-destination", artifacts], { cwd: root }));
    const archive = path.join(artifacts, result.filename);
    packed.push({ name: result.name, version: result.version, file: archive });
    console.log("Packed " + archive);
  }
  write(artifacts, "feature-packages.json", JSON.stringify(packed, null, 2) + "\n");
} finally {
  assert.equal(path.dirname(fs.realpathSync(stageRoot)), temp);
  fs.rmSync(stageRoot, { recursive: true, force: true });
}
