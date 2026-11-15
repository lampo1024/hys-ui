import type { JsonNode } from "./jsonDocument";
import { compareJsonNumbers, compareText, jsonMember, jsonNodes } from "./jsonStructure";

type Selector =
  | { kind: "key"; key: string }
  | { kind: "index"; index: number }
  | { kind: "slice"; start?: number; end?: number; step: number }
  | { kind: "wildcard" }
  | { kind: "filter"; matches: (node: JsonNode) => boolean };
type Segment = { recursive: boolean; selectors: Selector[] };
type Token = { text: string; offset: number };
const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const name = /^[\p{L}_\u0080-\uffff][\p{L}\p{N}_\u0080-\uffff]*$/u;
const comparisons = ["==", "!=", "<", "<=", ">", ">="];

function stringLiteral(token: string): string {
  if (token[0] === '"') return JSON.parse(token);
  return JSON.parse('"' + token.slice(1, -1).replace(/\\.|"/g, value => value === "\\'" ? "'" : value === '"' ? '\\"' : value) + '"');
}

function tokenize(query: string) {
  const tokens: Token[] = [];
  const pattern = /\s+|"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|[\p{L}_\u0080-\uffff][\p{L}\p{N}_\u0080-\uffff]*|\.\.|==|!=|<=|>=|&&|\|\||[$@.*,\[\]:?!<>()]/guy;
  while (pattern.lastIndex < query.length) {
    const offset = pattern.lastIndex;
    const token = pattern.exec(query);
    if (!token) throw new Error("JSONPath 第 " + (offset + 1) + " 列包含无法识别的符号。");
    if (token[0].trim()) tokens.push({ text: token[0], offset });
  }
  return tokens;
}

function compareLiteral(node: JsonNode | undefined, literal: string, op: string) {
  if (!node) return op === "!=";
  const kind = number.test(literal) ? "number" : /^['"]/.test(literal) ? "string" : literal === "null" ? "null" : "boolean";
  if (node.type !== kind) return op === "!=";
  const order = kind === "number" ? compareJsonNumbers(node.preview, literal)
    : kind === "string" ? compareText(JSON.parse(node.preview), stringLiteral(literal))
      : compareText(node.preview, literal);
  if (op === "==") return order === 0;
  if (op === "!=") return order !== 0;
  if (kind !== "number" && kind !== "string") return order === 0 && (op === "<=" || op === ">=");
  return op === "<" ? order < 0 : op === "<=" ? order <= 0 : op === ">" ? order > 0 : order >= 0;
}

function parseQuery(query: string) {
  const tokens = tokenize(query);
  let i = 0;
  const peek = () => tokens[i]?.text ?? "";
  const fail = (message: string): never => {
    throw new Error("JSONPath 第 " + ((tokens[i]?.offset ?? query.length) + 1) + " 列：" + message);
  };
  const consume = (text: string) => peek() === text && !!++i;
  function expect(text: string) {
    if (!consume(text)) fail("需要 " + text + "。");
  }
  function key() {
    const token = peek();
    if (!name.test(token)) fail("需要字段名。");
    i++;
    return token;
  }
  function integer() {
    if (!/^-?(?:0|[1-9]\d*)$/.test(peek())) return undefined;
    const value = Number(peek());
    if (!Number.isSafeInteger(value)) fail("索引、切片边界和步长必须是安全整数。");
    i++;
    return value;
  }
  function atomicFilter(): (node: JsonNode) => boolean {
    if (consume("!")) { const rule = atomicFilter(); return node => !rule(node); }
    if (consume("(")) { const rule = filter(); expect(")"); return rule; }
    if (!consume("@")) fail("当前支持从 @ 开始的字段条件。");
    const parts: Extract<Selector, { kind: "key" | "index" }>[] = [];
    while (peek() === "." || peek() === "[") {
      if (consume(".")) parts.push({ kind: "key", key: key() });
      else {
        expect("[");
        if (/^['"]/.test(peek())) parts.push({ kind: "key", key: stringLiteral(tokens[i++].text) });
        else {
          const index = integer();
          if (index === undefined) fail("条件路径中需要字段名或数组索引。");
          parts.push({ kind: "index", index: index! });
        }
        expect("]");
      }
    }
    const op = peek();
    const compare = comparisons.includes(op);
    let literal = "";
    if (compare) {
      i++;
      literal = peek();
      if (!number.test(literal) && !/^['"]/.test(literal) && !["null", "true", "false"].includes(literal)) fail("需要字符串、数字、布尔值或 null。");
      if (/^['"]/.test(literal)) stringLiteral(literal);
      i++;
    }
    return node => {
      let selected: JsonNode | undefined = node;
      for (const part of parts) {
        if (!selected) break;
        selected = select(selected, part)[0];
      }
      return compare ? compareLiteral(selected, literal, op) : !!selected;
    };
  }
  function and() {
    const rules = [atomicFilter()];
    while (consume("&&")) rules.push(atomicFilter());
    return (node: JsonNode) => rules.every(rule => rule(node));
  }
  function filter() {
    const rules = [and()];
    while (consume("||")) rules.push(and());
    return (node: JsonNode) => rules.some(rule => rule(node));
  }
  function selector(): Selector {
    if (consume("*")) return { kind: "wildcard" };
    if (consume("?")) return { kind: "filter", matches: filter() };
    if (/^['"]/.test(peek())) return { kind: "key", key: stringLiteral(tokens[i++].text) };
    const start = integer();
    if (consume(":")) {
      const end = integer();
      const step = consume(":") ? integer() ?? 1 : 1;
      return { kind: "slice", start, end, step };
    }
    return start === undefined ? fail("当前不支持此选择器。") : { kind: "index", index: start };
  }
  expect("$");
  const segments: Segment[] = [];
  while (peek()) {
    const recursive = consume("..");
    const dot = recursive || consume(".");
    const selectors: Selector[] = [];
    if (consume("[")) {
      do { selectors.push(selector()); } while (consume(","));
      expect("]");
    } else if (dot) selectors.push(consume("*") ? { kind: "wildcard" } : { kind: "key", key: key() });
    else fail("需要字段、下标或递归选择器。");
    segments.push({ recursive, selectors });
  }
  return segments;
}

function select(node: JsonNode, selector: Selector): JsonNode[] {
  const children = node.children ?? [];
  if (selector.kind === "wildcard") return children;
  if (selector.kind === "filter") return children.filter(selector.matches);
  if (selector.kind === "key") {
    const child = node.type === "object" ? jsonMember(node, selector.key) : undefined;
    return child ? [child] : [];
  }
  if (node.type !== "array") return [];
  if (selector.kind === "index") {
    const child = children.at(selector.index);
    return child ? [child] : [];
  }
  const { start, end, step } = selector;
  if (!step) return [];
  const length = children.length;
  const low = step > 0 ? 0 : -1;
  const high = step > 0 ? length : length - 1;
  const normalize = (n: number) => Math.min(high, Math.max(low, n < 0 ? n + length : n));
  const stop = end === undefined ? (step > 0 ? length : -1) : normalize(end);
  const selected: JsonNode[] = [];
  for (let i = start === undefined ? (step > 0 ? 0 : length - 1) : normalize(start);
    step > 0 ? i < stop : i > stop; i += step) selected.push(children[i]);
  return selected;
}

export function queryJson(root: JsonNode, expression: string) {
  try {
    let matches = [root];
    for (const segment of parseQuery(expression)) {
      const next: JsonNode[] = [];
      for (const node of matches) {
        for (const from of segment.recursive ? jsonNodes(node) : [node]) {
          for (const selector of segment.selectors) for (const result of select(from, selector)) {
            if (next.length === 100_000) throw new Error("匹配超过 100,000 项，请缩小查询范围。");
            next.push(result);
          }
        }
      }
      matches = next;
    }
    return matches;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("JSONPath 字符串中的转义无效。");
    if (error instanceof RangeError) throw new Error("JSONPath 条件嵌套过深。");
    throw error;
  }
}
