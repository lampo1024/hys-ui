import { strToU8, unzipSync, zipSync } from "fflate";
import { SaxesParser } from "saxes";

export const workbookMime =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const spreadsheetNamespace =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
export const officeRelationships =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
export const packageRelationships =
  "http://schemas.openxmlformats.org/package/2006/relationships";
export const maxXlsxBytes = 32 * 1024 * 1024;
const maxExpandedBytes = 128 * 1024 * 1024;
const maxXmlNodes = 1_500_000;

export interface XmlNode {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text: string;
}

export function xml(input: string) {
  const stack: XmlNode[] = [];
  let root: XmlNode | undefined;
  let nodes = 0;
  const parser = new SaxesParser({ xmlns: true, position: false });
  parser.on("doctype", () => {
    throw new Error("Excel 文件包含不受支持的 XML 声明。");
  });
  parser.on("opentag", (tag) => {
    if (stack.length >= 64 || ++nodes > maxXmlNodes)
      throw new Error("Excel 文件的 XML 结构超出导入限制。");
    const attributes: Record<string, string> = Object.create(null);
    for (const item of Object.values(tag.attributes)) {
      if (item.uri === "" || item.uri.endsWith("/relationships"))
        attributes[item.local] = item.value;
    }
    const node: XmlNode = {
      name: tag.local,
      attributes,
      children: [],
      text: "",
    };
    if (stack.length) stack.at(-1)!.children.push(node);
    else root = node;
    stack.push(node);
  });
  function append(text: string) {
    if (stack.length) stack.at(-1)!.text += text;
  }
  parser.on("text", append);
  parser.on("cdata", append);
  parser.on("closetag", () => {
    stack.pop();
  });
  parser.write(input).close();
  if (!root) throw new Error("Excel 文件包含空白 XML 部件。");
  return root;
}

export const child = (node: XmlNode | undefined, name: string) =>
  node?.children.find((item) => item.name === name);
export const children = (node: XmlNode | undefined, name: string) =>
  node?.children.filter((item) => item.name === name) ?? [];
export const truth = (value?: string) => value === "1" || value === "true";
export const escaped = (value: string | number) =>
  String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replace(
      /[&<>"'\r]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
          "\r": "&#13;",
        })[character]!,
    );
export const documentXml = (contents: string) =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + contents;
export const excelText = (text: string) =>
  text.replace(/_x([\da-f]{4})_/gi, (_, code: string) =>
    String.fromCharCode(parseInt(code, 16)),
  );
export const xmlText = (text: string) =>
  escaped(
    text.replace(
      /_x[\da-f]{4}_|[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/gi,
      (match) =>
        match.length === 1
          ? `_x${match.charCodeAt(0).toString(16).padStart(4, "0")}_`
          : "_x005f_" + match.slice(1),
    ),
  );

export function richText(node?: XmlNode) {
  return excelText(
    node?.children
      .map((part) =>
        part.name === "t"
          ? part.text
          : part.name === "r"
            ? (child(part, "t")?.text ?? "")
            : "",
      )
      .join("") ?? "",
  );
}

export function openXlsxArchive(input: ArrayBuffer | Uint8Array) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength > maxXlsxBytes)
    throw new Error("Excel 文件不能超过 32 MiB。");
  let expanded = 0;
  let entries = 0;
  const files = unzipSync(bytes, {
    filter({ name, size, originalSize }) {
      if (
        ++entries > 4096 ||
        size > bytes.byteLength ||
        originalSize > maxExpandedBytes
      )
        throw new Error("Excel 文件的压缩部件超出限制。");
      if (!/\.(xml|rels)$/i.test(name)) return false;
      expanded += originalSize;
      if (expanded > maxExpandedBytes)
        throw new Error("Excel 文件解压后超过 128 MiB。");
      return true;
    },
  });
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return {
    has(path: string) {
      return Object.hasOwn(files, path);
    },
    read(path: string) {
      if (!Object.hasOwn(files, path))
        throw new Error(`Excel 文件缺少部件 ${path}。`);
      const data = files[path];
      const encoding =
        data[0] === 0xff && data[1] === 0xfe
          ? "utf-16le"
          : data[0] === 0xfe && data[1] === 0xff
            ? "utf-16be"
            : undefined;
      return xml(
        (encoding
          ? new TextDecoder(encoding, { fatal: true })
          : decoder
        ).decode(data),
      );
    },
  };
}

export type XlsxArchive = ReturnType<typeof openXlsxArchive>;
export type XlsxRelationship = {
  id: string;
  type: string;
  target: string;
  external?: boolean;
};

export function readRelationships(
  archive: XlsxArchive,
  source = "",
): XlsxRelationship[] {
  const slash = source.lastIndexOf("/");
  const folder = source.slice(0, slash + 1);
  const path = folder + "_rels/" + source.slice(slash + 1) + ".rels";
  if (!archive.has(path)) return [];
  return children(archive.read(path), "Relationship").flatMap(
    ({ attributes }) => {
      const { Id, Type, Target, TargetMode } = attributes;
      if (!Id || !Type || !Target) return [];
      if (TargetMode === "External")
        return [
          {
            id: Id,
            type: Type.split("/").at(-1)!,
            target: Target,
            external: true,
          },
        ];
      const parts: string[] = [];
      for (const part of (Target.startsWith("/")
        ? Target.slice(1)
        : folder + Target
      ).split("/")) {
        if (part === "..") {
          if (!parts.length) throw new Error("Excel 文件的部件路径无效。");
          parts.pop();
        } else if (part && part !== ".") parts.push(part);
      }
      const target = decodeURI(parts.join("/"));
      return [{ id: Id, type: Type.split("/").at(-1)!, target }];
    },
  );
}

export function relationshipXml(relationships: readonly XlsxRelationship[]) {
  return documentXml(
    `<Relationships xmlns="${packageRelationships}">${relationships
      .map(
        (item) =>
          `<Relationship Id="${escaped(item.id)}" Type="${officeRelationships}/${escaped(item.type)}" Target="${escaped(item.target)}"${item.external ? ' TargetMode="External"' : ""}/>`,
      )
      .join("")}</Relationships>`,
  );
}

export function packXlsx(parts: Record<string, string>) {
  const files = Object.fromEntries(
    Object.entries(parts).map(([name, content]) => [name, strToU8(content)]),
  );
  return zipSync(files, { level: 3 });
}
