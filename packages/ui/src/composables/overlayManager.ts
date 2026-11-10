/** Shared, deterministic overlay stack. Only the topmost layer responds to Escape. */
import { computed, ref, type InjectionKey, type Ref } from "vue";
export const overlayOwnerKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol(
  "hys-ui-overlay-owner",
);
export type OverlayKind = "floating" | "dialog";
type Entry = {
  id: symbol;
  kind: OverlayKind;
  dismiss: () => void;
  base?: () => number | undefined;
};
const stack: Entry[] = [];
export const overlayCount = ref(0);
export function registerOverlay(
  kind: OverlayKind,
  dismiss: () => void,
  base?: () => number | undefined,
) {
  const id = Symbol(kind);
  stack.push({ id, kind, dismiss, base });
  overlayCount.value = stack.length;
  const zIndex = computed(() => {
    void overlayCount.value;
    let previous = -2;
    for (const entry of stack) {
      const requested = entry.base?.();
      previous = Math.max(
        previous + 2,
        Number.isFinite(requested)
          ? Math.max(0, requested!)
          : entry.kind === "floating"
            ? 1200
            : 100,
      );
      if (entry.id === id) return previous;
    }
    return kind === "floating" ? 1200 : 100;
  });
  return {
    id,
    zIndex,
    isTop: () => stack.at(-1)?.id === id,
    unregister: () => {
      const i = stack.findIndex((item) => item.id === id);
      if (i >= 0) stack.splice(i, 1);
      overlayCount.value = stack.length;
    },
  };
}
let lockCount = 0;
let originalOverflow = "";
let originalPadding = "",
  originalPaddingPriority = "";
export function lockBodyScroll() {
  if (lockCount++ === 0) {
    originalOverflow = document.body.style.overflow;
    originalPadding = document.body.style.paddingRight;
    originalPaddingPriority =
      document.body.style.getPropertyPriority("padding-right");
    const width =
      document.documentElement.clientWidth > 0
        ? Math.max(0, window.innerWidth - document.documentElement.clientWidth)
        : 0;
    if (width)
      document.body.style.paddingRight =
        (parseFloat(getComputedStyle(document.body).paddingRight) || 0) +
        width +
        "px";
    document.body.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lockCount === 0) {
      document.body.style.overflow = originalOverflow;
      document.body.style.setProperty(
        "padding-right",
        originalPadding,
        originalPaddingPriority,
      );
    }
  };
}
