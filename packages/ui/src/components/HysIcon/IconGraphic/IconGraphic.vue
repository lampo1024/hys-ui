<script lang="ts">
import { computed, defineComponent, h, type PropType, type VNode } from "vue";
import { useSvgInstanceId } from "../../../composables/useSvgInstanceId";
import {
  iconAssetUrl,
  iconPaint,
  iconSrcset,
  iconViewBox,
  sanitizeIconNodes,
} from "../iconSafety";
import type { HysIconSource, HysIconSvgNode } from "../iconTypes";
const drawable = new Set([
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
]);
const variantStroke: Record<string, number> = {
  bold: 2.8,
  thin: 1,
  round: 2.1,
};

export default defineComponent({
  name: "HysIconGraphic",
  props: {
    source: { type: Object as PropType<HysIconSource>, required: true },
    variant: String,
    fill: String,
    stroke: String,
    strokeWidth: Number,
    fit: String,
    gradient: Array as PropType<readonly string[]>,
    allowedOrigins: Array as PropType<readonly string[]>,
    morphTo: String,
    draw: Boolean,
  },
  emits: { load: (_event: Event) => true, error: (_event: Event) => true },
  setup(props, { emit }) {
    const id = useSvgInstanceId("icon");
    const nodes = computed(() =>
      props.source.type === "svg"
        ? sanitizeIconNodes(props.source.nodes, id.value + "-node-")
        : [],
    );
    const aspect = computed(() =>
      props.fit === "fill"
        ? "none"
        : props.fit === "cover"
          ? "xMidYMid slice"
          : "xMidYMid meet",
    );
    function render(
      node: HysIconSvgNode,
      index: number,
      morph: { available: boolean },
    ): VNode {
      const attrs = {
        ...node.attrs,
        key: index,
        ...(props.draw && drawable.has(node.tag)
          ? { pathLength: 1, "data-hys-icon-draw": "" }
          : {}),
      };
      let style: Record<string, string> | undefined;
      if (
        morph.available &&
        node.tag === "path" &&
        typeof node.attrs?.d === "string"
      ) {
        style = { "--hys-icon-morph-path": 'path("' + props.morphTo + '")' };
        morph.available = false;
      }
      return h(
        node.tag,
        { ...attrs, style, "data-hys-icon-morph-path": style ? "" : undefined },
        (node.children ?? []).map((child, index) =>
          render(child, index, morph),
        ),
      );
    }
    return () => {
      const source = props.source;
      const common = {
        class: "hys-icon-graphic",
        "aria-hidden": "true",
        focusable: "false",
      };
      const gradients =
        props.gradient
          ?.map((color) => iconPaint(color))
          .filter((color) => color !== undefined) ?? [];
      const toneId = id.value + "-tone";
      const paint = gradients.length ? "url(#" + toneId + ")" : undefined;
      const stroke =
        (props.stroke && iconPaint(props.stroke)) || paint || "currentColor";
      const fill = (props.fill && iconPaint(props.fill)) || "none";
      const strokeWidth =
        props.strokeWidth ??
        (props.variant && Object.hasOwn(variantStroke, props.variant)
          ? variantStroke[props.variant]
          : 1.8);
      if (source.type === "svg") {
        const morph = {
          available:
            !!props.morphTo &&
            /^[MmLlHhVvCcSsQqTtAaZz0-9+eE.,\s-]{1,16000}$/.test(props.morphTo),
        };
        const defs = gradients.length
          ? h("defs", [
              h(
                "linearGradient",
                { id: toneId, x2: "1", y2: "1" },
                gradients.map((color, index) =>
                  h("stop", {
                    key: index,
                    offset:
                      gradients.length === 1
                        ? 0
                        : index / (gradients.length - 1),
                    "stop-color": color,
                  }),
                ),
              ),
            ])
          : null;
        return h(
          "svg",
          {
            ...common,
            viewBox: iconViewBox(source.viewBox),
            preserveAspectRatio: aspect.value,
            fill,
            stroke,
            "stroke-width": strokeWidth,
            "stroke-linecap": props.variant === "sharp" ? "square" : "round",
            "stroke-linejoin": props.variant === "sharp" ? "miter" : "round",
          },
          [
            defs,
            ...nodes.value.map((node, index) => render(node, index, morph)),
          ],
        );
      }
      if (source.type === "sprite") {
        const href = iconAssetUrl(source.href, props.allowedOrigins, true);
        return h(
          "svg",
          {
            ...common,
            viewBox: iconViewBox(source.viewBox),
            preserveAspectRatio: aspect.value,
            fill: props.fill ?? "currentColor",
            stroke: props.stroke,
          },
          href ? [h("use", { href })] : [],
        );
      }
      if (source.type === "image") {
        const src = iconAssetUrl(source.src, props.allowedOrigins);
        return h("img", {
          ...common,
          alt: "",
          src,
          srcset: iconSrcset(source.srcset, props.allowedOrigins),
          referrerpolicy: "no-referrer",
          decoding: "async",
          draggable: false,
          style: { objectFit: props.fit ?? "contain" },
          onLoad: (event) => emit("load", event),
          onError: (event) => emit("error", event),
        });
      }
      if (source.type === "component")
        return h(source.component, {
          ...source.props,
          ...common,
          ...(props.fill ? { fill } : {}),
          ...(props.stroke ? { stroke } : {}),
          ...(props.strokeWidth !== undefined ||
          ["bold", "thin"].includes(props.variant ?? "")
            ? { "stroke-width": strokeWidth }
            : {}),
        });
      if (source.type === "font")
        return h(
          "span",
          {
            ...common,
            class: [common.class, "hys-icon-character", source.className],
            style: { fontFamily: source.family },
          },
          source.glyph,
        );
      return h(
        "span",
        { ...common, class: [common.class, "hys-icon-character"] },
        source.text,
      );
    };
  },
});
</script>
