import { computed, type CSSProperties, type Ref } from "vue";
import type { HysPopupSurfaceProps } from "./popupSurface";

function length(value: number | string | undefined) {
  if (typeof value !== "number") return value;
  return Number.isFinite(value) ? Math.max(0, value) + "px" : undefined;
}

export function popupMaximumWidth(
  props: HysPopupSurfaceProps,
  kind: "tooltip" | "popover",
) {
  return length(props.maxWidth) ?? (kind === "tooltip" ? "320px" : "360px");
}

export function usePopupSurfaceStyle(
  props: HysPopupSurfaceProps,
  kind: "tooltip" | "popover",
  floatingStyle: Readonly<Ref<CSSProperties>>,
) {
  const style = computed<CSSProperties>(() => {
    const dark =
      (props.effect ?? (kind === "tooltip" ? "dark" : "light")) === "dark";
    return {
      ...props.overlayStyle,
      ...floatingStyle.value,
      "--hys-ui-popup-surface":
        props.color ||
        (dark
          ? "#172744"
          : "var(--hys-ui-surface,var(--hys-ui-theme-surface))"),
      "--hys-ui-popup-color":
        props.textColor ||
        (dark ? "#fff" : "var(--hys-ui-text,var(--hys-ui-theme-text))"),
      "--hys-ui-popup-border":
        props.color ||
        (dark ? "#172744" : "var(--hys-ui-border,var(--hys-ui-theme-border))"),
      overflow: "visible",
      maxWidth: `min(${popupMaximumWidth(props, kind)},calc(100vw - 20px))`,
      minWidth: props.width !== undefined ? "0" : undefined,
    };
  });
  const contentStyle = computed<CSSProperties>(() => ({
    ...props.contentStyle,
    maxHeight:
      props.maxHeight !== undefined
        ? `min(${length(props.maxHeight)},calc(100vh - 20px))`
        : "calc(100vh - 20px)",
  }));
  return { style, contentStyle };
}
