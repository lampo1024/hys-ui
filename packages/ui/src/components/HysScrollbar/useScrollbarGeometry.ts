import { onActivated, onDeactivated, ref, shallowRef, watch } from "vue";
import { readScrollbarGeometry, type ScrollbarAxis, type ScrollbarGeometry } from "./scrollbarGeometry";

export function useScrollbarGeometry(
  viewport: () => HTMLElement | null | undefined,
  content: () => HTMLElement | null | undefined,
  options: {
    direction?: () => ScrollbarAxis | "both";
    enabled?: () => boolean;
    autoResize?: () => boolean;
    observeMutations?: boolean;
    listenScroll?: boolean;
  } = {},
) {
  const active = ref(true);
  const geometry = shallowRef<ScrollbarGeometry>();

  function update() {
    const target = viewport();
    if (target) return (geometry.value = readScrollbarGeometry(target, options.direction?.() ?? "both"));
  }

  watch([viewport, content, active, options.direction ?? (() => "both"), options.enabled ?? (() => true), options.autoResize ?? (() => true)],
    ([target, body, live, , enabled, autoResize], _, onCleanup) => {
      if (!target || !live || !enabled) {
        geometry.value = undefined;
        return;
      }

      update();
      const owner = target.ownerDocument.defaultView;
      if (!owner) return;
      let frame: number | undefined;
      function schedule() {
        if (!owner?.requestAnimationFrame) {
          update();
          return;
        }
        frame ??= owner.requestAnimationFrame(() => {
          frame = undefined;
          update();
        });
      }

      if (options.listenScroll !== false) target.addEventListener("scroll", schedule, { passive: true });
      const resize = autoResize && typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : undefined;
      resize?.observe(target);
      if (body) resize?.observe(body);
      const mutation = autoResize && options.observeMutations && body && typeof MutationObserver !== "undefined"
        ? new MutationObserver(schedule)
        : undefined;
      if (body) mutation?.observe(body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "hidden", "dir"] });
      if (autoResize) owner.addEventListener("resize", schedule);
      if (autoResize && options.observeMutations) {
        body?.addEventListener("load", schedule, true);
        body?.addEventListener("transitionend", schedule);
        body?.addEventListener("animationend", schedule);
      }
      onCleanup(() => {
        if (frame !== undefined) owner.cancelAnimationFrame(frame);
        target.removeEventListener("scroll", schedule);
        resize?.disconnect();
        mutation?.disconnect();
        owner.removeEventListener("resize", schedule);
        body?.removeEventListener("load", schedule, true);
        body?.removeEventListener("transitionend", schedule);
        body?.removeEventListener("animationend", schedule);
      });
    }, { flush: "post" });

  onActivated(() => { active.value = true; });
  onDeactivated(() => { active.value = false; });
  return { geometry, update };
}
