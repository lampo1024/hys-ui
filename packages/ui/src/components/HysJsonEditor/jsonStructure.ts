import { formatJson, jsonPointer, parseJsonDocument, type JsonNode } from "./jsonDocument";
import { nodeRange, removeJsonChild } from "./jsonTreeEdits";

export const jsonValue = (source: string, node: JsonNode) => source.slice(node.from, node.to);
export const jsonMember = (node: JsonNode, key: string) => node.children?.find(child => child.label === key);
export const pointerPart = (part: string) => part.replace(/~/g, "~0").replace(/\//g, "~1");
export const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function* jsonNodes(root: JsonNode): Generator<JsonNode> {
  const pending = [root];
  while (pending.length) {
    const node = pending.pop()!;
    yield node;
    for (let index = (node.children?.length ?? 0) - 1; index >= 0; index--) pending.push(node.children![index]);
  }
}

export function locatePointer(root: JsonNode, pointer: string) {
  let node: JsonNode | undefined = root;
  if (!pointer) return node;
  if (!pointer.startsWith("/")) return undefined;
  for (const segment of pointer.slice(1).split("/")) {
    if (!node || /~(?![01])/.test(segment)) return undefined;
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    node = jsonMember(node, key);
    if (node?.ambiguous) return undefined;
  }
  return node;
}

export function requireJson(source: string, unique = true) {
  const document = parseJsonDocument(source);
  if (!document.valid) throw new Error("请先修正 JSON 语法。");
  if (unique && document.duplicates.length) throw new Error("请先从状态栏定位并处理重复键。");
  return document.root;
}

function decimal(raw: string) {
  const [mantissa, exponent = "0"] = raw.replace(/^-/, "").toLowerCase().split("e");
  const [integer, fraction = ""] = mantissa.split(".");
  const significant = (integer + fraction).replace(/^0+/, "");
  if (!significant) return { sign: 0, digits: "", place: 0n };
  return {
    sign: raw.startsWith("-") ? -1 : 1,
    digits: significant.replace(/0+$/, ""),
    place: BigInt(exponent) + BigInt(significant.length - fraction.length),
  };
}

export function compareJsonNumbers(first: string, second: string) {
  if (first === second) return 0;
  const a = decimal(first), b = decimal(second);
  if (a.sign !== b.sign) return a.sign - b.sign;
  if (a.place !== b.place) return (a.place < b.place ? -1 : 1) * a.sign;
  // Trailing zeroes are already stripped. An unshared suffix is greater than implicit zeroes.
  return compareText(a.digits, b.digits) * a.sign;
}

export function jsonNumberFits(raw: string) {
  const value = Number(raw);
  return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value))
    && compareJsonNumbers(raw, String(value)) === 0;
}

function comparable(node?: JsonNode) {
  return node && (node.type === "number" || node.type === "string" || node.type === "boolean");
}

export function compareJsonFields(a: JsonNode | undefined, b: JsonNode | undefined, direction: 1 | -1) {
  if (!comparable(a) || !comparable(b)) return Number(!!comparable(b)) - Number(!!comparable(a));
  if (a!.type !== b!.type) return compareText(a!.type, b!.type) * direction;
  const result = a!.type === "number" ? compareJsonNumbers(a!.preview, b!.preview)
    : a!.type === "string" ? compareText(JSON.parse(a!.preview), JSON.parse(b!.preview))
      : compareText(a!.preview, b!.preview);
  return result * direction;
}

function fingerprint(node: JsonNode): string {
  if (node.type === "number") {
    const value = decimal(node.preview);
    return `n:${value.sign}:${value.digits}:${value.place}`;
  }
  if (node.type === "string") return "s:" + JSON.stringify(JSON.parse(node.preview));
  if (node.type === "array") return "[" + node.children!.map(fingerprint).join(",") + "]";
  if (node.type === "object") return "{" + [...node.children!]
    .sort((a, b) => compareText(a.label, b.label)).map(child => JSON.stringify(child.label) + ":" + fingerprint(child)).join(",") + "}";
  return node.preview;
}

export type JsonOrganizeAction = "sort-keys" | "sort-array" | "dedupe";

export function organizeJson(source: string, target: JsonNode, action: JsonOrganizeAction, direction: 1 | -1, field?: string) {
  const members = target.children ?? [];
  if (target.type !== (action === "sort-keys" ? "object" : "array")) throw new Error("请选择与操作匹配的对象或数组。");
  let ordered: JsonNode[];
  const objectField = (node: JsonNode, key: string) => node.type === "object" ? jsonMember(node, key) : undefined;
  if (action === "sort-keys") ordered = [...members].sort((a, b) => compareText(a.label, b.label) * direction);
  else if (action === "sort-array") {
    if (field === undefined) throw new Error("请选择排序字段。");
    ordered = [...members].sort((a, b) => compareJsonFields(objectField(a, field), objectField(b, field), direction));
  } else {
    const seen = new Set<string>();
    ordered = members.filter(node => {
      const value = field === undefined ? node : objectField(node, field);
      if (!value) return true;
      const key = fingerprint(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  const moved = action === "dedupe" ? members.length - ordered.length : ordered.filter((node, i) => node !== members[i]).length;
  if (!moved) return { source, affected: 0 };
  const first = nodeRange(members[0]).from;
  const last = members.at(-1)!.to;
  const multiline = /[\r\n]/.test(source.slice(target.from, target.to));
  const line = source.slice(0, first).split(/\r\n|[\r\n]/).at(-1)!;
  const whitespace = /^[ \t]*/.exec(line)![0];
  const delimiter = members.length > 1 ? source.slice(members[0].to, nodeRange(members[1]).from)
    : multiline ? "," + (source.includes("\r\n") ? "\r\n" : "\n") + whitespace : ",";
  const next = ordered.map(node => source.slice(nodeRange(node).from, node.to)).join(delimiter);
  return { source: source.slice(0, first) + next + source.slice(last), affected: moved };
}

export function duplicateRemoval(root: JsonNode, offset: number) {
  for (const parent of jsonNodes(root)) {
    const siblings = parent.children;
    if (!siblings?.length) continue;
    const index = siblings.findIndex(node => node.key?.from === offset && node.duplicate);
    if (index >= 0) return removeJsonChild(siblings[index], siblings, index);
  }
}

export interface JsonDifference {
  path: string;
  type: "added" | "removed" | "changed";
  before?: JsonNode;
  after?: JsonNode;
}

export function compareJsonDocuments(before: JsonNode, after: JsonNode) {
  const rows: JsonDifference[] = [];
  const pending: { before?: JsonNode; after?: JsonNode; path: string }[] = [{ before, after, path: "" }];
  while (pending.length) {
    const pair = pending.pop()!;
    const { before: a, after: b } = pair;
    if (!a || !b || a.type !== b.type) {
      rows.push({ ...pair, type: !a ? "added" : !b ? "removed" : "changed" });
    } else if (a.children && b.children) {
      const left = new Map(a.children.map(node => [node.label, node]));
      const right = new Map(b.children.map(node => [node.label, node]));
      const keys = [...new Set([...left.keys(), ...right.keys()])];
      for (const key of keys.reverse()) pending.push({ before: left.get(key), after: right.get(key), path: pair.path + "/" + pointerPart(key) });
    } else if (fingerprint(a) !== fingerprint(b)) rows.push({ ...pair, type: "changed" });
  }
  return rows;
}

export const jsonPathLabel = (node: JsonNode) => jsonPointer(node) || (node.ambiguous ? "重复键" : "根节点");
export const jsonArrayText = (source: string, nodes: readonly JsonNode[]) =>
  formatJson("[" + nodes.map(node => jsonValue(source, node)).join(",") + "]", 2);
