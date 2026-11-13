import type { HysIconSvg, HysIconSvgNode } from "./iconTypes";

const tags = new Set([
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
]);
const attributes = new Set([
  "id",
  "d",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "fx",
  "fy",
  "width",
  "height",
  "points",
  "transform",
  "opacity",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "vector-effect",
  "clip-path",
  "clip-rule",
  "mask",
  "gradientUnits",
  "gradientTransform",
  "spreadMethod",
  "offset",
  "stop-color",
  "stop-opacity",
  "maskUnits",
  "maskContentUnits",
  "clipPathUnits",
  "pathLength",
]);
const idPattern = /^[A-Za-z_][\w.-]*$/;
const localPaint = /^url\(#([A-Za-z_][\w.-]*)\)$/;
const token = /^[^<>\\\x00-\x1f]{0,16000}$/;
const SVG_NS = "http://www.w3.org/2000/svg";
export function iconViewBox(value?: string) {
  const parts = value?.trim().split(/[ ,]+/).map(Number);
  return parts?.length === 4 &&
    parts.every(Number.isFinite) &&
    parts[2] > 0 &&
    parts[3] > 0
    ? parts.join(" ")
    : "0 0 24 24";
}
export function iconPaint(value: string) {
  if (!token.test(value)) return undefined;
  if (/url\s*\(/i.test(value))
    return localPaint.test(value) ? value : undefined;
  return value;
}
function safeAttributes(values: HysIconSvgNode["attrs"], prefix: string) {
  const result: Record<string, string> = {};
  for (const [name, raw] of Object.entries(values ?? {})) {
    if (
      !attributes.has(name) ||
      (typeof raw !== "string" && typeof raw !== "number")
    )
      continue;
    const value = String(raw).trim();
    if (!token.test(value)) continue;
    if (name === "id") {
      if (idPattern.test(value)) result[name] = prefix + value;
      continue;
    }
    if (/url\s*\(/i.test(value)) {
      const match = localPaint.exec(value);
      if (match && ["fill", "stroke", "clip-path", "mask"].includes(name))
        result[name] = "url(#" + prefix + match[1] + ")";
      continue;
    }
    if ((name === "clip-path" || name === "mask") && value !== "none") continue;
    result[name] = value;
  }
  return result;
}
export function sanitizeIconNodes(
  nodes: readonly HysIconSvgNode[],
  prefix = "",
): HysIconSvgNode[] {
  let remaining = 500;
  function visit(
    items: readonly HysIconSvgNode[] | undefined,
    depth: number,
  ): HysIconSvgNode[] {
    if (!Array.isArray(items) || depth > 15) return [];
    const result: HysIconSvgNode[] = [];
    for (const item of items) {
      if (--remaining < 0) break;
      if (!item || !tags.has(item.tag)) continue;
      result.push({
        tag: item.tag,
        attrs: safeAttributes(item.attrs, prefix),
        children: visit(item.children, depth + 1),
      });
    }
    return result;
  }
  return visit(nodes, 0);
}
export function importHysIconSvg(markup: string): HysIconSvg {
  if (typeof DOMParser === "undefined")
    throw new Error("SVG import requires DOMParser");
  if (markup.length > 250000 || /<!\s*(?:doctype|entity)/i.test(markup))
    throw new Error("SVG document is too large or contains a document type");
  const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
  const root = parsed.documentElement;
  if (
    root.localName !== "svg" ||
    (root.namespaceURI && root.namespaceURI !== SVG_NS) ||
    parsed.querySelector("parsererror")
  )
    throw new Error("Invalid SVG document");
  let count = 0;
  function read(element: Element, depth: number): HysIconSvgNode | undefined {
    if (depth > 15 || ++count > 500) return;
    if (
      !tags.has(element.localName) ||
      (element.namespaceURI && element.namespaceURI !== SVG_NS)
    )
      return;
    return {
      tag: element.localName,
      attrs: Object.fromEntries(
        [...element.attributes].map((attribute) => [
          attribute.name,
          attribute.value,
        ]),
      ),
      children: [...element.children]
        .map((child) => read(child, depth + 1))
        .filter((node) => node !== undefined),
    };
  }
  const childNodes = [...root.children]
    .map((child) => read(child, 1))
    .filter((node) => node !== undefined);
  const nodes = sanitizeIconNodes([
    {
      tag: "g",
      attrs: Object.fromEntries(
        [...root.attributes].map((attribute) => [
          attribute.name,
          attribute.value,
        ]),
      ),
      children: childNodes,
    },
  ]);
  if (!nodes[0]?.children?.some((node) => node.tag !== "defs"))
    throw new Error("SVG contains no supported graphics");
  return {
    type: "svg",
    viewBox: iconViewBox(root.getAttribute("viewBox") ?? undefined),
    nodes,
  };
}
export function iconAssetUrl(
  value: string,
  allowedOrigins?: readonly string[],
  fragment = false,
): string | undefined {
  const input = value?.trim();
  if (!input || /[\\\x00-\x1f]/.test(input)) return;
  if (input.startsWith("#"))
    return fragment && idPattern.test(input.slice(1)) ? input : undefined;
  try {
    const base =
      typeof document === "undefined"
        ? "https://hys-ui.invalid/"
        : document.baseURI;
    const url = new URL(input, base);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return;
    if (
      allowedOrigins &&
      url.origin !== new URL(base).origin &&
      !allowedOrigins.includes(url.origin)
    )
      return;
    if (fragment && !idPattern.test(url.hash.slice(1))) return;
    return input;
  } catch {
    return undefined;
  }
}
export function iconSrcset(
  value: string | undefined,
  allowedOrigins?: readonly string[],
) {
  if (!value) return;
  const result = [];
  for (const candidate of value.split(",")) {
    const [url, descriptor, extra] = candidate.trim().split(/\s+/);
    const safe = iconAssetUrl(url, allowedOrigins);
    if (
      !safe ||
      extra ||
      (descriptor && !/^\d+(?:\.\d+)?[wx]$/.test(descriptor))
    )
      return;
    result.push(descriptor ? safe + " " + descriptor : safe);
  }
  return result.join(", ");
}
export function serializeHysIconSvg(source: HysIconSvg) {
  const escape = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const render = (node: HysIconSvgNode): string => {
    const attrs = Object.entries(node.attrs ?? {})
      .map(([name, value]) => " " + name + '="' + escape(String(value)) + '"')
      .join("");
    return (
      "<" +
      node.tag +
      attrs +
      ">" +
      (node.children ?? []).map(render).join("") +
      "</" +
      node.tag +
      ">"
    );
  };
  return (
    '<svg xmlns="' +
    SVG_NS +
    '" viewBox="' +
    iconViewBox(source.viewBox) +
    '" fill="none" stroke="currentColor">' +
    sanitizeIconNodes(source.nodes).map(render).join("") +
    "</svg>"
  );
}
