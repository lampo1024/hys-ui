import { h, type FunctionalComponent, type SVGAttributes } from "vue";

export interface SvgIconProps extends SVGAttributes {
  size?: string | number;
  color?: string;
  strokeWidth?: string | number;
  "stroke-width"?: string | number;
}

type SvgIconNode = readonly [tag: string, attributes: Readonly<Record<string, string | number>>];

export function createSvgIcon(
  iconClass: string,
  nodes: readonly SvgIconNode[],
): FunctionalComponent<SvgIconProps> {
  const icon: FunctionalComponent<SvgIconProps> = (props, { slots }) => {
    const {
      size = 24,
      color = "currentColor",
      strokeWidth,
      "stroke-width": strokeWidthAttribute,
      class: classes,
      ...attributes
    } = props;
    const label = attributes["aria-label"] || attributes["aria-labelledby"];
    return h("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      "stroke-width": strokeWidth ?? strokeWidthAttribute ?? 2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      focusable: "false",
      "aria-hidden": label ? undefined : "true",
      ...attributes,
      class: ["lucide", iconClass, classes],
    }, [
      ...nodes.map(([tag, nodeAttributes], index) => h(tag, { ...nodeAttributes, key: index })),
      ...(slots.default?.() ?? []),
    ]);
  };
  icon.inheritAttrs = false;
  return icon;
}
