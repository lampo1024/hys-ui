import GithubSlugger from "github-slugger";
import type { Element, Root as HtmlRoot } from "hast";
import type { Definition, Image, ImageReference, Link, LinkReference, Nodes } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import { markdownUrl, type MarkdownRange } from "./markdownSource";

const parser = unified().use(remarkParse).use(remarkGfm);
const renderer = parser().use(remarkRehype, {
  handlers: {
    html(state, node) {
      const text = { type: "text" as const, value: node.value };
      state.patch(node, text);
      return text;
    },
  },
}).use(rehypeSanitize).freeze();

export interface MarkdownHeading { title: string; line: number; level: number; id: string }
export interface MarkdownPreview {
  root: HtmlRoot;
  headings: MarkdownHeading[];
  anchors: Map<string, string>;
}

export function parseMarkdown(source: string, idPrefix: string): MarkdownPreview {
  const root = renderer.runSync(renderer.parse(source)) as HtmlRoot;
  const headings: MarkdownHeading[] = [];
  const anchors = new Map<string, string>();
  const slugger = new GithubSlugger();
  function visit(node: HtmlRoot | HtmlRoot["children"][number] | Element["children"][number]) {
    if (node.type === "element") {
      if (/^h[1-6]$/.test(node.tagName)) {
        const title = htmlText(node).trim();
        const slug = slugger.slug(title);
        const id = `${idPrefix}-heading-${headings.length}`;
        node.properties.id = id;
        anchors.set(slug, id);
        headings.push({ title: title || "空标题", line: node.position?.start.line ?? 1, level: Number(node.tagName[1]), id });
      }
      const existingId = String(node.properties.id ?? "");
      if (existingId.startsWith("user-content-")) {
        const next = `${idPrefix}-${existingId}`;
        node.properties.id = next;
        anchors.set(existingId, next);
        anchors.set(existingId.slice("user-content-".length), next);
      }
      if (node.tagName === "a") {
        const href = markdownUrl(String(node.properties.href ?? ""));
        if (href) node.properties.href = href;
        else delete node.properties.href;
      } else if (node.tagName === "img") {
        const src = markdownUrl(String(node.properties.src ?? ""), true);
        if (src) node.properties.src = src;
        else delete node.properties.src;
      }
    }
    if ("children" in node) for (const child of node.children) visit(child);
  }
  visit(root);
  return { root, headings, anchors };
}

export function htmlText(node: Element): string {
  if (node.tagName === "img") return String(node.properties.alt ?? "");
  return node.children.map(child => child.type === "text" ? child.value : child.type === "element" ? htmlText(child) : "").join("");
}

type LinkNode = Link | Image | LinkReference | ImageReference;
function linkText(node: Nodes): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("alt" in node) return node.alt ?? "";
  return "children" in node ? node.children.map(linkText).join("") : "";
}

export function findMarkdownLink(source: string, range: MarkdownRange, image: boolean) {
  const tree = parser.parse(source);
  const definitions = new Map<string, Definition>();
  const candidates: LinkNode[] = [];
  function visit(node: Nodes) {
    if (node.type === "definition" && !definitions.has(node.identifier)) definitions.set(node.identifier, node);
    const kinds = image ? ["image", "imageReference"] : ["link", "linkReference"];
    if (kinds.includes(node.type)) candidates.push(node as LinkNode);
    if ("children" in node) for (const child of node.children) visit(child);
  }
  visit(tree);
  for (const node of candidates.reverse()) {
    const from = node.position?.start.offset;
    const to = node.position?.end.offset;
    if (from == null || to == null || range.from < from || range.to > to) continue;
    const target = "url" in node ? node : definitions.get(node.identifier);
    if (!target) continue;
    const children = "children" in node ? node.children : [];
    const start = children[0]?.position?.start.offset;
    const end = children.at(-1)?.position?.end.offset;
    return { range: { from, to }, url: target.url, title: target.title ?? "", text: linkText(node),
      labelSource: start == null || end == null ? undefined : source.slice(start, end) };
  }
}

export function taskMarker(source: string, itemOffset?: number, itemEnd?: number) {
  if (itemOffset == null) return;
  const match = /^(?:[-+*]|\d+[.)])(?:[ \t]+|[ \t]*\r?\n[ \t>\r\n]*)\[([ xX])\]/.exec(source.slice(itemOffset, itemEnd));
  if (match) return { offset: itemOffset + match[0].lastIndexOf("[") + 1, checked: match[1] !== " " };
}
