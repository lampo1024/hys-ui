import { jsonLanguage } from "@codemirror/lang-json";

export type JsonRange = { from: number; to: number };
export type JsonEdit = JsonRange & { insert: string };
export type JsonType = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface JsonNode extends JsonRange {
  id: string;
  label: string;
  type: JsonType;
  /** Present for object members, including the empty key. */
  key?: JsonRange;
  parent?: string;
  children?: JsonNode[];
  preview: string;
  duplicate?: boolean;
  ambiguous?: boolean;
}

export interface JsonDuplicate extends JsonRange {
  label: string;
  original: number;
  originalTo: number;
}

export type JsonDocument =
  | { valid: true; root: JsonNode; duplicates: JsonDuplicate[] }
  | { valid: false; error: JsonRange };

type Syntax = ReturnType<typeof jsonLanguage.parser.parse>["topNode"];

const nodeTypes: Record<string, JsonType> = {
  Object: "object", Array: "array", String: "string", Number: "number",
  True: "boolean", False: "boolean", Null: "null",
};
export const typeLabels: Record<JsonType, string> = {
  object: "对象", array: "数组", string: "字符串", number: "数字", boolean: "布尔值", null: "空值",
};

function pointerPart(key: string) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

export function parseJsonDocument(source: string): JsonDocument {
  const tree = jsonLanguage.parser.parse(source);
  const cursor = tree.cursor();
  do {
    if (cursor.type.isError) return { valid: false, error: { from: cursor.from, to: cursor.to } };
  } while (cursor.next());

  function createNode(syntax: Syntax, label: string, id: string, parent?: string, key?: JsonRange): JsonNode {
    const { from, to } = syntax;
    const type = nodeTypes[syntax.name];
    return { from, to, id, label, parent, key, type, preview: "" };
  }

  const rootSyntax = tree.topNode.firstChild!;
  const root = createNode(rootSyntax, "根节点", "root");
  const duplicates: JsonDuplicate[] = [];
  const pending = [{ node: root, syntax: rootSyntax }];
  while (pending.length) {
    const { node, syntax } = pending.pop()!;
    if (node.type !== "object" && node.type !== "array") {
      node.preview = source.slice(node.from, node.to);
      continue;
    }

    const seen = new Map<string, { first: JsonNode; count: number }>();
    node.children = [];
    for (let child = syntax.firstChild; child; child = child.nextSibling) {
      if (node.type === "object" && child.name === "Property") {
        const { from, to } = child.firstChild!;
        const name: string = JSON.parse(source.slice(from, to));
        const prior = seen.get(name);
        const value = child.lastChild!;
        const member = createNode(value, name, `${node.id}/${pointerPart(name)}${prior ? `~2${++prior.count}` : ""}`, node.id, { from, to });
        if (prior) {
          duplicates.push({ from, to, label: name, original: prior.first.key!.from, originalTo: prior.first.key!.to });
          prior.first.duplicate = member.duplicate = true;
        } else seen.set(name, { first: member, count: 1 });
        node.children.push(member);
        pending.push({ node: member, syntax: value });
      } else if (node.type === "array" && Object.hasOwn(nodeTypes, child.name)) {
        const index = node.children.length;
        const item = createNode(child, String(index), `${node.id}/${index}`, node.id);
        node.children.push(item);
        pending.push({ node: item, syntax: child });
      }
    }
    for (const child of node.children) child.ambiguous = node.ambiguous || child.duplicate;
    node.preview = node.type === "object" ? `{ ${node.children.length} 个字段 }` : `[ ${node.children.length} 项 ]`;
  }
  duplicates.sort((a, b) => a.from - b.from);
  return { valid: true, root, duplicates };
}

export function jsonLineStarts(source: string) {
  return [0, ...Array.from(source.matchAll(/\r\n|[\r\n]/g), match => match.index + match[0].length)];
}

export function jsonLocation(starts: readonly number[], offset: number) {
  let first = 0;
  let end = starts.length;
  while (first + 1 < end) {
    const middle = (first + end) >>> 1;
    if (starts[middle] <= offset) first = middle;
    else end = middle;
  }
  return { line: first + 1, column: offset - starts[first] + 1 };
}

export function jsonPointer(node: JsonNode) {
  return node.ambiguous ? undefined : node.id.slice("root".length);
}

/** Call with valid JSON. Only the whitespace between the original tokens changes. */
export function formatJson(source: string, spaces: number) {
  const tokens = source.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|[^\t\r\n {}\[\],:"]+/g) ?? [];
  if (!spaces) return tokens.join("");
  const unit = " ".repeat(spaces);
  const lines: string[] = [];
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "}" || token === "]") {
      depth--;
      if (tokens[i - 1] !== "{" && tokens[i - 1] !== "[") lines.push("\n", unit.repeat(depth));
    }
    lines.push(token);
    if (token === "{" || token === "[") {
      depth++;
      if (tokens[i + 1] !== "}" && tokens[i + 1] !== "]") lines.push("\n", unit.repeat(depth));
    } else if (token === ",") lines.push("\n", unit.repeat(depth));
    else if (token === ":") lines.push(" ");
  }
  return lines.join("");
}

export async function readJsonFile(file: File) {
  if (!/\.json$/i.test(file.name)) throw new Error("请选择 .json 文件。");
  return readJsonTextFile(file);
}

export async function readJsonTextFile(file: File) {
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    throw new Error("无法读取文件，请重新选择。");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("文件需要使用 UTF-8 编码。");
  }
}
