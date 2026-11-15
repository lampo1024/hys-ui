import { formatJson, parseJsonDocument, type JsonEdit, type JsonNode, type JsonType } from "./jsonDocument";

export type JsonNodeAction = "add" | "edit" | "rename";

export function initialJsonValue(type: JsonType) {
  return type === "object" ? "{}" : type === "array" ? "[]" : type === "number" ? "0" : "";
}

export function encodeJsonValue(type: JsonType, value: string) {
  if (type === "string") return JSON.stringify(value);
  if (type === "null") return "null";
  if (type === "boolean") return value === "true" ? "true" : "false";
  const trimmed = value.trim();
  const result = parseJsonDocument(trimmed);
  if (!result.valid || result.root.type !== type) return undefined;
  return trimmed;
}

export function nodeRange(node: JsonNode) {
  return { from: node.key?.from ?? node.from, to: node.to };
}

function leadingIndent(source: string, offset: number) {
  const line = source.slice(0, offset).split(/\r\n|[\r\n]/).at(-1)!;
  return /^[\t ]*/.exec(line)![0];
}

export function appendJsonChild(source: string, parent: JsonNode, key: string, value: string, spaces: number): JsonEdit {
  const children = parent.children!;
  const last = children.at(-1);
  const from = last?.to ?? parent.from + 1;
  const padded = /[\r\n]/.test(source.slice(from, parent.to - 1));
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const indent = children.length
    ? leadingIndent(source, nodeRange(children[0]).from)
    : leadingIndent(source, parent.from) + " ".repeat(spaces);
  const formatted = padded ? formatJson(value, spaces).replace(/\n/g, newline + indent) : formatJson(value, 0);
  const field = parent.type === "object" ? JSON.stringify(key) + (padded ? ": " : ":") : "";
  const prefix = (last ? "," : "") + (padded ? newline + indent : "");
  return { from, to: from, insert: prefix + field + formatted };
}

export function removeJsonChild(node: JsonNode, siblings: readonly JsonNode[], index: number): JsonEdit {
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  const from = nodeRange(node).from;
  return next ? { from, to: nodeRange(next).from, insert: "" }
    : { from: previous?.to ?? from, to: node.to, insert: "" };
}

export function swapJsonChildren(source: string, first: JsonNode, second: JsonNode): JsonEdit[] {
  const [left, right] = first.from < second.from ? [first, second] : [second, first];
  return [
    { from: left.from, to: left.to, insert: source.slice(right.from, right.to) },
    { from: right.from, to: right.to, insert: source.slice(left.from, left.to) },
  ];
}
