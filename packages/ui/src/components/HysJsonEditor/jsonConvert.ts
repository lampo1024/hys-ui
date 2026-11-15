import { formatJson, type JsonNode } from "./jsonDocument";
import { jsonMember, jsonValue, requireJson } from "./jsonStructure";

export type JsonConversion = "to-csv" | "from-csv" | "to-yaml" | "from-yaml" | "to-typescript";

export function jsonColumns(rows: readonly JsonNode[]) {
  return [...new Set(rows.flatMap(row => row.children?.map(field => field.label) ?? []))];
}

export function jsonTableArrays(root: JsonNode) {
  const result: JsonNode[] = [];
  const pending = [root];
  while (pending.length) {
    const node = pending.pop()!;
    if (node.type === "array" && node.children!.every(child => child.type === "object")) result.push(node);
    for (let i = (node.children?.length ?? 0) - 1; i >= 0; i--) pending.push(node.children![i]);
  }
  return result;
}

function csvRows(text: string) {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", mode: "plain" | "quoted" | "closed" = "plain";
  let line = 1;
  for (let i = 0; i < source.length; i++) {
    const character = source[i];
    if (mode === "quoted") {
      if (character !== '"') { cell += character; if (character === "\n") line++; }
      else if (source[i + 1] === '"') { cell += '"'; i++; }
      else mode = "closed";
    } else if (character === "," || character === "\r" || character === "\n") {
      row.push(cell);
      cell = "";
      mode = "plain";
      if (character !== ",") {
        if (character === "\r" && source[i + 1] === "\n") i++;
        rows.push(row);
        row = [];
        line++;
      }
    } else if (character === '"' && !cell && mode === "plain") mode = "quoted";
    else {
      if (character === '"' || mode === "closed") throw new Error("CSV 第 " + line + " 行的引号无效。");
      cell += character;
    }
  }
  if (mode === "quoted") throw new Error("CSV 存在未闭合的引号。");
  if (row.length || cell || mode === "closed") rows.push([...row, cell]);
  return rows;
}

export function csvToJson(text: string) {
  const [header, ...rows] = csvRows(text);
  if (!header) throw new Error("请输入包含表头的 CSV。");
  if (new Set(header).size !== header.length) throw new Error("CSV 表头包含重复字段。");
  const records = rows.map((row, index) => {
    if (row.length !== header.length) throw new Error("CSV 第 " + (index + 1) + " 条数据的列数与表头不同。");
    return "{" + header.map((key, i) => JSON.stringify(key) + ":" + JSON.stringify(row[i])).join(",") + "}";
  });
  return formatJson("[" + records.join(",") + "]", 2);
}

const quoteCsv = (value: string) => /[",\r\n]/.test(value) || !value ? '"' + value.replace(/"/g, '""') + '"' : value;

function toCsv(source: string, root: JsonNode) {
  if (root.type !== "array" || !root.children!.every(row => row.type === "object")) throw new Error("CSV 导出需要对象数组。");
  const columns = jsonColumns(root.children!);
  if (!columns.length) throw new Error("对象数组至少需要一个字段。");
  const rows = root.children!.map(row => columns.map(column => {
    const field = jsonMember(row, column);
    if (!field || field.type === "null") return "";
    if (field.type === "string") return JSON.parse(field.preview) as string;
    return formatJson(jsonValue(source, field), 0);
  }));
  return [columns, ...rows].map(row => row.map(quoteCsv).join(",")).join("\r\n");
}

function toYaml(source: string, root: JsonNode) {
  const lines: string[] = [];
  const safeQuoted = (text: string) => text.replace(/[\u0085\u2028\u2029]/g, char => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0"));
  function write(node: JsonNode, indent: number, prefix = "") {
    const padding = " ".repeat(indent);
    if (!node.children?.length) {
      const value = jsonValue(source, node);
      lines.push(padding + prefix + (node.children ? formatJson(value, 0) : safeQuoted(value)));
      return;
    }
    if (prefix) lines.push(padding + prefix.trimEnd());
    const depth = indent + (prefix ? 2 : 0);
    for (const child of node.children) write(child, depth, node.type === "array" ? "- " : safeQuoted(JSON.stringify(child.label)) + ": ");
  }
  write(root, 0);
  return lines.join("\n") + "\n";
}

function yamlNumber(raw: string) {
  let token = raw.replace(/^\+/, "").replace(/^(-?)\./, "$10.").replace(/\.(?=[eE]|$)/, ".0");
  token = token.replace(/^(-?)0+(?=\d)/, "$1");
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) throw new Error("YAML 数值无法表示为 JSON。");
  return token;
}

export async function yamlToJson(text: string) {
  const { parseDocument, isAlias, isMap, isSeq, isScalar } = await import("yaml");
  const document = parseDocument(text, { version: "1.2", intAsBigInt: true, uniqueKeys: true, keepSourceTokens: true });
  if (document.errors.length || document.warnings.length) throw new Error((document.errors[0] ?? document.warnings[0]).message);
  const ancestors = new Set<object>();
  let aliasDepth = 0;
  let aliasNodes = 0;
  function write(node: unknown): string {
    if (aliasDepth && ++aliasNodes > 100_000) throw new Error("YAML 别名展开的内容过大。");
    if (isAlias(node)) {
      const target = node.resolve(document);
      if (!target || ancestors.has(target)) throw new Error("YAML 存在无效或循环引用的别名。");
      aliasDepth++;
      try { return write(target); } finally { aliasDepth--; }
    }
    if (node == null) return "null";
    if (isMap(node) || isSeq(node)) {
      if (node.tag && !["tag:yaml.org,2002:map", "tag:yaml.org,2002:seq"].includes(node.tag)) throw new Error("此 YAML 集合不能直接表示为 JSON。");
      ancestors.add(node);
      try {
        if (isSeq(node)) return "[" + node.items.map(write).join(",") + "]";
        const names = new Set<string>();
        return "{" + node.items.map(({ key, value }) => {
          const name = isAlias(key) ? key.resolve(document) : key;
          if (!isScalar(name) || typeof name.value !== "string") throw new Error("YAML 映射键必须是字符串。");
          if (names.has(name.value)) throw new Error("YAML 映射包含重复键。");
          names.add(name.value);
          return JSON.stringify(name.value) + ":" + write(value);
        }).join(",") + "}";
      } finally { ancestors.delete(node); }
    }
    if (!isScalar(node)) throw new Error("YAML 值无法表示为 JSON。");
    if (typeof node.value === "bigint") return node.source?.startsWith("-") && node.value === 0n ? "-0" : node.value.toString();
    if (typeof node.value === "number") return yamlNumber(node.source ?? "");
    if (node.value === null || typeof node.value === "boolean" || typeof node.value === "string") return JSON.stringify(node.value);
    throw new Error("YAML 值无法表示为 JSON。");
  }
  return formatJson(write(document.contents), 2);
}

export function jsonTypeScript(root: JsonNode) {
  function infer(samples: JsonNode[], depth: number): string {
    const types = new Set<string>();
    const padding = "  ".repeat(depth);
    const objects = samples.filter(node => node.type === "object");
    const arrays = samples.filter(node => node.type === "array");
    for (const node of samples) if (!node.children) types.add(node.type);
    if (objects.length) {
      const keys = jsonColumns(objects);
      const members = keys.map(key => {
        const values = objects.flatMap(object => { const node = jsonMember(object, key); return node ? [node] : []; });
        return padding + "  " + JSON.stringify(key) + (values.length === objects.length ? "" : "?") + ": " + infer(values, depth + 1) + ";";
      });
      types.add(keys.length ? "{\n" + members.join("\n") + "\n" + padding + "}" : "Record<string, never>");
    }
    if (arrays.length) types.add("Array<" + infer(arrays.flatMap(array => array.children!), depth) + ">");
    return [...types].join(" | ") || "unknown";
  }
  return "export type Root = " + infer([root], 0) + ";\n";
}

export async function convertJson(mode: JsonConversion, input: string) {
  if (mode === "from-csv") return { value: csvToJson(input), extension: "json" };
  if (mode === "from-yaml") return { value: await yamlToJson(input), extension: "json" };
  const root = requireJson(input);
  if (mode === "to-csv") return { value: toCsv(input, root), extension: "csv" };
  if (mode === "to-yaml") return { value: toYaml(input, root), extension: "yaml" };
  return { value: jsonTypeScript(root), extension: "ts" };
}
