import {
  computed, onActivated, onBeforeUnmount, onDeactivated, onMounted,
  ref, shallowRef, watch, type Ref,
} from "vue";
import { popupSize } from "../motion/popup";
import { positionFloating } from "./floatingPosition";
import type { HysTourAppearance, HysTourTarget } from "./tour";

function resolveTarget(target: HysTourTarget | undefined) {
  try {
    const element = typeof target === "function" ? target() :
      typeof target === "string" ? document.querySelector(target) : target;
    return element instanceof HTMLElement && element.isConnected ? element : undefined;
  } catch {
    return undefined;
  }
}

function viewport() {
  return {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: document.documentElement.clientHeight || window.innerHeight,
  };
}

function visibleBounds(element: HTMLElement, view: ReturnType<typeof viewport>) {
  const bounds = element.getBoundingClientRect();
  let left = Math.max(0, bounds.left);
  let top = Math.max(0, bounds.top);
  let right = Math.min(view.width, bounds.right);
  let bottom = Math.min(view.height, bounds.bottom);
  if (!element.getClientRects().length || getComputedStyle(element).visibility !== "visible")
    return;
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(parent);
    const clipX = /^(auto|scroll|hidden|clip|overlay)$/.test(overflowX);
    const clipY = /^(auto|scroll|hidden|clip|overlay)$/.test(overflowY);
    if (!clipX && !clipY) continue;
    const rect = parent.getBoundingClientRect();
    if (clipX) {
      left = Math.max(left, rect.left + parent.clientLeft);
      right = Math.min(right, rect.left + parent.clientLeft + parent.clientWidth);
    }
    if (clipY) {
      top = Math.max(top, rect.top + parent.clientTop);
      bottom = Math.min(bottom, rect.top + parent.clientTop + parent.clientHeight);
    }
  }
  return right > left && bottom > top
    ? new window.DOMRect(left, top, right - left, bottom - top)
    : undefined;
}

const nonnegative = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, value!) : fallback;

function expand(bounds: DOMRect, view: ReturnType<typeof viewport>, offset: number | [number, number] | undefined) {
  const [x, y] = Array.isArray(offset) ? offset : [offset, offset];
  const horizontal = nonnegative(x, 6);
  const vertical = nonnegative(y, 6);
  const left = Math.max(0, bounds.left - horizontal);
  const top = Math.max(0, bounds.top - vertical);
  return new window.DOMRect(
    left, top,
    Math.min(view.width, bounds.right + horizontal) - left,
    Math.min(view.height, bounds.bottom + vertical) - top,
  );
}

function roundedHole(bounds: DOMRect, radius: number) {
  const { left, top, right, bottom } = bounds;
  const r = Math.min(radius, bounds.width / 2, bounds.height / 2);
  return [
    `M ${left + r} ${top} H ${right - r} Q ${right} ${top} ${right} ${top + r}`,
    `V ${bottom - r} Q ${right} ${bottom} ${right - r} ${bottom}`,
    `H ${left + r} Q ${left} ${bottom} ${left} ${bottom - r}`,
    `V ${top + r} Q ${left} ${top} ${left + r} ${top} Z`,
  ].join(" ");
}

export function useTourLayout(
  shown: Readonly<Ref<boolean>>,
  panel: Readonly<Ref<HTMLElement | undefined>>,
  settings: Readonly<Ref<HysTourAppearance>>,
  targetInput: Readonly<Ref<HysTourTarget | undefined>>,
) {
  const active = ref(false);
  const target = shallowRef<HTMLElement>();
  const bounds = shallowRef<DOMRect>();
  const view = shallowRef({ width: 0, height: 0 });
  const card = shallowRef<ReturnType<typeof positionFloating>>();
  const arrow = shallowRef<{ x: number; y: number }>();
  let frame: number | undefined;
  let resize: ResizeObserver | undefined;
  const targetFromProps = computed(() => active.value && shown.value
    ? resolveTarget(targetInput.value)
    : undefined);
  const path = computed(() => {
    const { width, height } = view.value;
    if (!width || !height) return "";
    const outer = `M 0 0 H ${width} V ${height} H 0 Z`;
    return bounds.value
      ? outer + " " + roundedHole(bounds.value, nonnegative(settings.value.gap?.radius, 4))
      : outer;
  });

  function update() {
    const screen = viewport();
    view.value = screen;
    const visible = target.value && visibleBounds(target.value, screen);
    const element = panel.value;
    if (!visible || !element) {
      bounds.value = undefined;
      card.value = undefined;
      arrow.value = undefined;
      return;
    }
    const options = settings.value;
    const highlight = expand(visible, screen, options.gap?.offset);
    bounds.value = highlight;
    const placed = positionFloating(
      options.mask === false ? visible : highlight,
      popupSize(element), screen, options.placement ?? "bottom", 9, 12, true,
    );
    card.value = placed;
    const arrowOptions = options.arrow;
    const align = typeof arrowOptions === "object" && arrowOptions.pointAtCenter === false;
    const fraction = align && placed.placement.endsWith("start") ? 0 :
      align && placed.placement.endsWith("end") ? 1 : 0.5;
    const clampArrow = (offset: number, length: number) =>
      Math.max(12, Math.min(offset, length - 12));
    arrow.value = {
      x: clampArrow(visible.left + visible.width * fraction - placed.x, placed.width),
      y: clampArrow(visible.top + visible.height * fraction - placed.y, placed.height),
    };
  }

  function schedule() {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      update();
    });
  }

  function follow(element: HTMLElement | undefined) {
    if (target.value === element) return;
    if (target.value) resize?.unobserve(target.value);
    target.value = element;
    if (element) {
      resize?.observe(element);
      const scroll = settings.value.scrollIntoViewOptions;
      const rect = element.getBoundingClientRect();
      const screen = viewport();
      const visible = visibleBounds(element, screen);
      if (scroll !== false && (!visible || visible.width < rect.width || visible.height < rect.height)) {
        element.scrollIntoView?.(typeof scroll === "object"
          ? { block: "center", inline: "nearest", ...scroll }
          : { block: "center", inline: "nearest" });
      }
    }
    schedule();
  }

  watch(targetFromProps, follow, { flush: "post" });
  watch(settings, () => {
    if (active.value && shown.value) schedule();
  }, { flush: "post" });
  watch([active, shown, panel], ([enabled, visible, element], _, onCleanup) => {
    if (!enabled || !visible || !element) return;
    resize = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : undefined;
    resize?.observe(element);
    if (target.value) resize?.observe(target.value);
    follow(resolveTarget(targetInput.value));
    update();
    const mutations = new MutationObserver((records) => {
      if (!targetInput.value) return;
      if (!target.value?.isConnected) follow(resolveTarget(targetInput.value));
      else if (records.some((record) => !element.contains(record.target))) schedule();
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    onCleanup(() => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      resize?.disconnect();
      resize = undefined;
      mutations.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      target.value = undefined;
      card.value = undefined;
      bounds.value = undefined;
    });
  }, { flush: "post" });
  onMounted(() => { active.value = true; });
  onActivated(() => { active.value = true; });
  onDeactivated(() => { active.value = false; });
  onBeforeUnmount(() => {
    if (frame !== undefined) cancelAnimationFrame(frame);
  });
  return { view, bounds, card, arrow, path };
}
