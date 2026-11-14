<script lang="ts">
import { defineComponent, h, shallowRef, type PropType, type VNodeChild } from "vue";
import type { Element, RootContent } from "hast";
import { Copy } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import { htmlText, taskMarker, type MarkdownPreview } from "./markdownPreview";

const tags = new Set("a blockquote br code del em h1 h2 h3 h4 h5 h6 hr img li ol p pre section strong table tbody td th thead tr ul sup".split(" "));
const attributes = { className: "class", htmlFor: "for", ariaDescribedBy: "aria-describedby", ariaLabel: "aria-label",
  dataFootnoteRef: "data-footnote-ref", dataFootnoteBackref: "data-footnote-backref" } as const;

export default defineComponent({
  props: {
    content: { type: Object as PropType<MarkdownPreview>, required: true },
    source: { type: String, required: true },
    current: Boolean,
    editable: Boolean,
    disabled: Boolean,
  },
  emits: {
    task: (_offset: number, _checked: boolean) => true,
    copy: (_text: string) => true,
    anchor: (_id: string) => true,
  },
  setup(props, { emit }) {
    const broken = shallowRef(new Set<string>());
    function render(node: RootContent, listItem?: Element["position"]): VNodeChild {
      if (node.type === "text") return node.value;
      if (node.type !== "element") return null;
      const item = node.tagName === "li" ? node.position : listItem;
      if (node.tagName === "input" && node.properties.type === "checkbox") {
        const marker = taskMarker(props.source, item?.start.offset, item?.end.offset);
        return h(HysCheckbox, {
          modelValue: !!node.properties.checked, disabled: props.disabled || !props.current || !marker,
          readonly: !props.editable, ariaLabel: "任务完成状态",
          "onUpdate:modelValue": value => { if (marker) emit("task", marker.offset, value === true); },
        });
      }
      if (!tags.has(node.tagName)) return node.children.map(child => render(child, item));
      const attrs: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(node.properties)) {
        if (!["id", "href", "src", "alt", "title", "start", "align", ...Object.keys(attributes)].includes(name)) continue;
        attrs[attributes[name as keyof typeof attributes] ?? name] = Array.isArray(value) ? value.join(" ") : value;
      }
      if (node.position?.start.line) attrs["data-md-line"] = node.position.start.line;
      if (node.tagName === "a") {
        const href = String(attrs.href ?? "");
        if (props.disabled || !href) delete attrs.href;
        else if (href.startsWith("#")) attrs.onClick = (event: MouseEvent) => {
          event.preventDefault();
          let slug = href.slice(1);
          try { slug = decodeURIComponent(slug); } catch { /* leave malformed anchors as written */ }
          emit("anchor", props.content.anchors.get(slug) ?? slug);
        };
        else if (/^https?:\/\//i.test(href)) Object.assign(attrs, { target: "_blank", rel: "noopener noreferrer" });
      }
      if (node.tagName === "img") {
        const src = String(attrs.src ?? "");
        return src && !broken.value.has(src)
          ? h("img", { ...attrs, loading: "lazy", decoding: "async", referrerpolicy: "no-referrer",
            onError: () => { broken.value = new Set([...broken.value, src]); } })
          : (attrs.alt ? String(attrs.alt) : src ? "图片加载失败" : null);
      }
      const children = node.children.map(child => render(child, item));
      const element = h(node.tagName, attrs, children);
      if (node.tagName === "table") return h(HysScrollbar, { wrapClass: "hys-md-table-scroll", direction: "horizontal", ariaLabel: "表格" }, () => element);
      if (node.tagName === "pre") {
        const code = node.children.find((child): child is Element => child.type === "element" && child.tagName === "code");
        const language = (code?.properties.className as string[] | undefined)?.find(name => name.startsWith("language-"))?.slice(9);
        return h("div", { class: "hys-md-code" }, [
          h("div", { class: "hys-md-code-head" }, [
            h("span", language || "代码"),
            h(HysButton, { size: "sm", variant: "ghost", icon: Copy, disabled: props.disabled,
              onClick: () => emit("copy", code ? htmlText(code) : htmlText(node)) }, () => "复制代码"),
          ]),
          h(HysScrollbar, { direction: "horizontal", ariaLabel: language ? `${language} 代码` : "代码" }, () => element),
        ]);
      }
      return element;
    }
    return () => props.content.root.children.length
      ? h("article", { class: "hys-md-prose", "aria-label": "Markdown 预览" }, props.content.root.children.map(node => render(node)))
      : h("p", { class: "hys-md-empty" }, "暂无预览内容");
  },
});
</script>
