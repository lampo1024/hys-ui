import { computed, onBeforeUnmount, onDeactivated, type Ref } from "vue";
import type { FloatingAnchor } from "./useFloating";

export function useMentionCaret(
  input: Readonly<Ref<HTMLElement | undefined>>,
  value: Readonly<Ref<string>>,
  start: () => number,
) {
  let mirror: HTMLDivElement | undefined;
  function removeMirror() {
    mirror?.remove();
    mirror = undefined;
  }
  function mentionRect(): DOMRect {
    const element = input.value!;
    const box = element.getBoundingClientRect();
    if (!box.width && !box.height) return box;
    const css = getComputedStyle(element);
    if (!mirror) {
      mirror = document.createElement("div");
      mirror.setAttribute("aria-hidden", "true");
      document.body.append(mirror);
    }
    for (const property of [
      "direction",
      "font",
      "font-family",
      "font-size",
      "font-weight",
      "font-style",
      "font-variant",
      "letter-spacing",
      "word-spacing",
      "text-transform",
      "text-indent",
      "text-align",
      "line-height",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "border-top-width",
      "border-right-width",
      "border-bottom-width",
      "border-left-width",
      "border-style",
      "box-sizing",
      "tab-size",
    ])
      mirror.style.setProperty(property, css.getPropertyValue(property));
    const borderLeft = parseFloat(css.borderLeftWidth) || 0;
    const borderRight = parseFloat(css.borderRightWidth) || 0;
    const borderTop = parseFloat(css.borderTopWidth) || 0;
    const unwrapped =
      element instanceof HTMLInputElement ||
      (element instanceof HTMLTextAreaElement && element.wrap === "off");
    Object.assign(mirror.style, {
      position: "fixed",
      top: "0px",
      left: "-10000px",
      visibility: "hidden",
      pointerEvents: "none",
      height: "auto",
      overflow: "hidden",
      whiteSpace: unwrapped ? "pre" : "pre-wrap",
      overflowWrap: "break-word",
      wordBreak: css.wordBreak,
      width:
        (element.clientWidth
          ? element.clientWidth + borderLeft + borderRight
          : box.width) + "px",
    });
    const offset = start();
    mirror.textContent = value.value.slice(0, offset);
    const marker = document.createElement("span");
    marker.textContent = value.value.slice(offset) || "\u200b";
    mirror.append(marker);
    const height =
      parseFloat(css.lineHeight) || (parseFloat(css.fontSize) || 14) * 1.6;
    const left = box.left + marker.offsetLeft + borderLeft - element.scrollLeft;
    const top = box.top + marker.offsetTop + borderTop - element.scrollTop;
    return new window.DOMRect(left, top, 1, height);
  }
  const anchor = computed<FloatingAnchor | undefined>(() =>
    input.value
      ? {
          getBoundingClientRect: mentionRect,
          contains: (node) => !!input.value?.contains(node),
          focus: () => input.value?.focus(),
          get isConnected() {
            return !!input.value?.isConnected;
          },
        }
      : undefined,
  );
  onBeforeUnmount(removeMirror);
  onDeactivated(removeMirror);
  return { anchor, removeMirror };
}
