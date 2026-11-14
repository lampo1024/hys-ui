export interface MarkdownRange { from: number; to: number }
export interface MarkdownEdit { changes: MarkdownRange & { insert: string }; selection: MarkdownRange }
export type HysMarkdownEditorView = "edit" | "split" | "preview";
export type MarkdownFormat = "bold" | "italic" | "strike" | "inlineCode" | "heading" | "quote" | "bullet" | "numbered" | "task" | "rule";

const inlineMarkers = { bold: "**", italic: "_", strike: "~~", inlineCode: "`" };
const prefix = /^([ \t]*)(?:#{1,6}[ \t]+|>[ \t]?|(?:[-+*]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]+)?)/;
const formatPrefix = { quote: /^> ?/, bullet: /^(?:[-+*])\s+(?!\[[ xX]\](?:\s|$))/, numbered: /^\d+[.)]\s+/, task: /^(?:[-+*]|\d+[.)])\s+\[[ xX]\](?:\s|$)/ };

function edit(from: number, to: number, insert: string, anchor = insert.length, end = anchor): MarkdownEdit {
  return { changes: { from, to, insert }, selection: { from: from + anchor, to: from + end } };
}

function block(source: string, range: MarkdownRange, text: string, caret: number) {
  const previous = source.slice(0, range.from);
  const following = source.slice(range.to);
  const before = previous && !previous.endsWith("\n\n") ? previous.endsWith("\n") ? "\n" : "\n\n" : "";
  const after = following && !following.startsWith("\n\n") ? following.startsWith("\n") ? "\n" : "\n\n" : "";
  const separator = text.endsWith("\n") ? after.slice(1) : after;
  return edit(range.from, range.to, before + text + separator, before.length + caret);
}

export function formatMarkdown(source: string, range: MarkdownRange, command: MarkdownFormat, heading = 0): MarkdownEdit {
  const { from, to } = range;
  if (command === "rule") return block(source, { from: to, to }, "---\n", 4);
  if (command in inlineMarkers) {
    const selected = source.slice(from, to);
    const marker = command === "inlineCode" && selected.includes("`") ? fence(selected, 1) : inlineMarkers[command as keyof typeof inlineMarkers];
    if (selected.length >= marker.length * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
      const text = selected.slice(marker.length, -marker.length);
      return edit(from, to, text, 0, text.length);
    }
    if (from >= marker.length && source.slice(from - marker.length, from) === marker && source.slice(to, to + marker.length) === marker) {
      return edit(from - marker.length, to + marker.length, selected, 0, selected.length);
    }
    const padding = command === "inlineCode" && (/^`|`$/.test(selected) || /^ .+ $/.test(selected)) ? " " : "";
    const wrap = (line: string) => line.replace(/^(\s*)(.*?)(\s*)$/, (_, lead, text, trail) => text ? lead + marker + padding + text + padding + marker + trail : line);
    if (selected.includes("\n")) {
      const lines = selected.split("\n");
      const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wrapped = new RegExp(`^(\\s*)${escaped}(.+?)${escaped}(\\s*)$`);
      const removing = lines.filter(line => line.trim()).every(line => wrapped.test(line));
      const replacement = lines.map(line => removing ? line.replace(wrapped, "$1$2$3") : wrap(line)).join("\n");
      return edit(from, to, replacement, 0, replacement.length);
    }
    const leading = selected.match(/^\s*/)?.[0] ?? "";
    const body = selected.trim();
    const trailing = selected.slice(leading.length + body.length);
    return edit(from, to, leading + marker + padding + body + padding + marker + trailing, leading.length + marker.length + padding.length,
      leading.length + marker.length + padding.length + body.length);
  }
  const start = from > 0 ? source.lastIndexOf("\n", from - 1) + 1 : 0;
  const endLine = source.indexOf("\n", to > from && source[to - 1] === "\n" ? to - 1 : to);
  const end = endLine < 0 ? source.length : endLine;
  const lines = source.slice(start, end).split("\n");
  const prefixes = lines.map((_, i) => ({
    heading: heading ? "#".repeat(heading) + " " : "", quote: "> ", bullet: "- ", numbered: `${i + 1}. `, task: "- [ ] ",
  })[command as Exclude<MarkdownFormat, keyof typeof inlineMarkers | "rule">]);
  const pattern = formatPrefix[command as keyof typeof formatPrefix];
  const toggleOff = !!pattern && lines.filter(line => line.trim()).every(line => pattern.test(line.trimStart())) && lines.some(line => line.trim());
  const result = lines.map((line, i) => {
    if (!line.trim() && lines.length > 1) return line;
    const indent = line.match(/^[ \t]*/)?.[0] ?? "";
    const body = line.slice(indent.length);
    const value = command === "heading" ? body.replace(/^#{1,6}[ \t]+/, "")
      : command === "quote" && !toggleOff ? body : body.replace(prefix, "");
    return indent + (toggleOff ? "" : prefixes[i]) + value;
  }).join("\n");
  if (from === to) {
    const caret = Math.max(0, Math.min(result.length, from - start + result.length - (end - start)));
    return edit(start, end, result, caret);
  }
  return edit(start, end, result, 0, result.length);
}

function fence(text: string, minimum: number) {
  return "`".repeat((text.match(/`+/g) ?? []).reduce((length, run) => Math.max(length, run.length + 1), minimum));
}

export function insertMarkdownBlock(source: string, range: MarkdownRange, kind: "code" | "table", values: { language: string; rows: number; columns: number }) {
  if (kind === "code") {
    const text = source.slice(range.from, range.to);
    const marker = fence(text, 3);
    const head = `${marker}${values.language}\n`;
    return block(source, range, `${head}${text}\n${marker}\n`, head.length);
  }
  const row = (cells: string[]) => `| ${cells.join(" | ")} |`;
  const header = row(Array.from({ length: values.columns }, (_, i) => `列 ${i + 1}`));
  const separator = row(Array(values.columns).fill("---"));
  const body = Array(values.rows).fill(row(Array(values.columns).fill("")));
  return block(source, range, [header, separator, ...body, ""].join("\n"), header.length + separator.length + 4);
}

export function markdownUrl(input: string, image = false) {
  const value = input.trim();
  if (!value || /[\u0000-\u0020\u007f<>\\]/.test(value) || value.startsWith("//")) return;
  if (image || /^[a-z][a-z\d+.-]*:/i.test(value)) {
    if (!(image ? /^https:\/\//i : /^https?:\/\//i).test(value)) return;
    try {
      const url = new URL(value);
      if (!url.hostname || url.username || url.password) return;
    } catch {
      return;
    }
  }
  return value;
}

export function insertMarkdownLink(range: MarkdownRange, image: boolean, text: string, url: string, title = "", labelSource?: string) {
  const label = labelSource ?? (text || (image ? "" : url)).replace(/[\\\[\]]/g, "\\$&").replace(/\r?\n/g, " ");
  const suffix = title ? ` "${title.replace(/[\\"]/g, "\\$&").replace(/\r?\n/g, " ")}"` : "";
  const destination = /[()]/.test(url) ? `<${url}>` : url;
  return edit(range.from, range.to, `${image ? "!" : ""}[${label}](${destination}${suffix})`);
}

export async function readMarkdownFile(file: File) {
  if (!/\.md$/i.test(file.name)) throw new Error("请选择 .md 文件。");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new Error("无法读取文件，请使用 UTF-8 编码的 Markdown 文件。");
  }
}
