export type HysKeyValueType = "string" | "number" | "boolean" | "json";
export type HysKeyValueValue = string | number | boolean | null | readonly unknown[] | Record<string, unknown>;

export function keyValueFromText(value: string, type: HysKeyValueType = "string"): HysKeyValueValue {
  if (type === "string") return value;
  const text = value.trim();
  if (type === "boolean") {
    if (text === "true" || text === "false") return text === "true";
    throw new Error("请输入 true 或 false");
  }
  const parsed: unknown = JSON.parse(text, (_, item: unknown) => {
    if (typeof item === "number" && (!Number.isFinite(item) || (Number.isInteger(item) && !Number.isSafeInteger(item)))) {
      throw new Error("此数字超出安全范围，可改用文本");
    }
    return item;
  });
  if (type === "number" && typeof parsed !== "number") throw new Error("请输入有效数字");
  return parsed as HysKeyValueValue;
}

export function readKeyValueRows(text: string, format: "json" | "pairs") {
  if (format === "pairs") {
    return text.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
      const delimiter = line.includes("\t") ? line.indexOf("\t") : line.indexOf("=");
      const key = line.slice(0, delimiter).trim();
      if (delimiter < 1 || !key) throw new Error("第 " + (index + 1) + " 行缺少键名或分隔符");
      return { key, value: line.slice(delimiter + 1), type: "string" as const };
    });
  }
  const source = text.trim();
  JSON.parse(source);
  if (!source.startsWith("{")) throw new Error("请输入 JSON 对象");
  const result: { key: string; value: string; type: HysKeyValueType }[] = [];
  const string = /"(?:[^"\\]|\\[\s\S])*"/y;
  let start = 1;
  while (start < source.length - 1) {
    while (/\s|,/.test(source[start] ?? "")) start++;
    string.lastIndex = start;
    const keyText = string.exec(source)?.[0];
    if (!keyText) break;
    const key: string = JSON.parse(keyText);
    start = source.indexOf(":", start + keyText.length) + 1;
    while (/\s/.test(source[start] ?? "")) start++;
    let end = start;
    let depth = 0;
    while (end < source.length - 1) {
      const char = source[end];
      if (char === '"') {
        string.lastIndex = end;
        string.exec(source);
        end = string.lastIndex;
        continue;
      }
      if (char === "," && depth === 0) break;
      if (char === "{" || char === "[") depth++;
      if (char === "}" || char === "]") depth--;
      end++;
    }
    const raw = source.slice(start, end).trimEnd();
    const type = raw[0] === '"' ? "string" : /^[+-]?\d/.test(raw) ? "number" : /^(true|false)$/.test(raw) ? "boolean" : "json";
    result.push({ key, value: type === "string" ? JSON.parse(raw) : raw, type });
    start = end;
  }
  return result;
}
