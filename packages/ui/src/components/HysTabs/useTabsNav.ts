import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
  type CSSProperties,
} from "vue";
import type { HysTabItem, HysTabsProps, HysTabValue } from "./tabsTypes";
import { tabToken } from "./tabsItems";

export function useTabsNav(
  props: () => HysTabsProps,
  items: () => readonly HysTabItem[],
  active: () => HysTabValue,
  vertical: () => boolean,
  motion: () => boolean,
  switchTab: (step: number, source: "wheel") => void,
) {
  const nav = ref<HTMLElement>(),
    track = ref<HTMLElement>();
  const before = ref(false),
    after = ref(false),
    overflowed = shallowRef<HysTabValue[]>([]);
  const indicator = shallowRef<CSSProperties>({});
  const buttons = new Map<string, HTMLButtonElement>();
  const button = (value: HysTabValue) => buttons.get(tabToken(value));
  const tabItem = (value: HysTabValue) =>
    button(value)?.closest<HTMLElement>(".hys-ui-tab-item");
  function setButton(value: HysTabValue, element: HTMLButtonElement | null) {
    const token = tabToken(value);
    if (element) buttons.set(token, element);
    else buttons.delete(token);
  }
  const rtl = () =>
    !!nav.value && getComputedStyle(nav.value).direction === "rtl";
  const hasOverflow = computed(() => before.value || after.value);
  let frame = 0,
    observer: ResizeObserver | undefined,
    running = false,
    lastWheel = 0;
  function measure() {
    const viewport = nav.value,
      content = track.value;
    if (!viewport || !content) return;
    const box = viewport.getBoundingClientRect(),
      trackBox = content.getBoundingClientRect();
    const isVertical = vertical(),
      reverse = !isVertical && rtl();
    const canScroll = props().overflow !== "wrap";
    const start = isVertical ? box.top : box.left,
      end = isVertical ? box.bottom : box.right;
    const min = isVertical ? trackBox.top : trackBox.left,
      max = isVertical ? trackBox.bottom : trackBox.right;
    before.value = canScroll && (reverse ? max > end + 2 : min < start - 2);
    after.value = canScroll && (reverse ? min < start - 2 : max > end + 2);
    const needsMenu =
      props().workbench ||
      props().overflow === "menu" ||
      props().overflow === "clip";
    const clipped =
      hasOverflow.value && needsMenu
        ? items()
            .filter((item) => {
              const rect = tabItem(item.value)?.getBoundingClientRect();
              return (
                rect &&
                (isVertical
                  ? rect.top < start - 2 || rect.bottom > end + 2
                  : rect.left < start - 2 || rect.right > end + 2)
              );
            })
            .map((item) => item.value)
        : [];
    if (
      clipped.length !== overflowed.value.length ||
      clipped.some((key, index) => key !== overflowed.value[index])
    )
      overflowed.value = clipped;
    const selected = tabItem(active());
    if (!selected || !selected.offsetWidth || !selected.offsetHeight) {
      indicator.value = { opacity: 0 };
      return;
    }
    // TransitionGroup temporarily transforms reordered tabs. The underline
    // needs their final layout coordinates even while they are still moving.
    indicator.value = isVertical
      ? {
          height: selected.offsetHeight + "px",
          transform: `translateY(${selected.offsetTop}px)`,
        }
      : {
          width: selected.offsetWidth + "px",
          transform: `translateX(${selected.offsetLeft}px)`,
        };
  }
  function schedule() {
    if (!running || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  }
  function scrollPixels(distance: number, smooth = false) {
    const element = nav.value;
    if (!element || !distance || props().overflow === "wrap") return false;
    const axis = vertical() ? "scrollTop" : "scrollLeft";
    if (!smooth || typeof element.scrollBy !== "function") {
      const previous = element[axis];
      element[axis] += distance;
      if (element[axis] === previous) return false;
    } else
      element.scrollBy({
        [axis === "scrollTop" ? "top" : "left"]: distance,
        behavior: motion() ? "smooth" : "auto",
      });
    schedule();
    return true;
  }
  function scroll(direction: number) {
    const element = nav.value;
    if (!element) return;
    scrollPixels(
      direction *
        (vertical() ? element.clientHeight : element.clientWidth) *
        0.8 *
        (vertical() || !rtl() ? 1 : -1),
      true,
    );
  }
  function scrollTo(value = active()) {
    const viewport = nav.value,
      target = button(value)?.closest(".hys-ui-tab-item");
    if (!viewport || !target || props().overflow === "wrap") {
      schedule();
      return;
    }
    const outer = viewport.getBoundingClientRect(),
      inner = target.getBoundingClientRect();
    const [start, end, from, to] = vertical()
      ? [outer.top, outer.bottom, inner.top, inner.bottom]
      : [outer.left, outer.right, inner.left, inner.right];
    const delta =
      props().scrollAlign === "center"
        ? (from + to - start - end) / 2
        : from < start
          ? from - start
          : to > end
            ? to - end
            : 0;
    scrollPixels(delta);
    schedule();
  }
  function focus(value: HysTabValue) {
    button(value)?.focus({ preventScroll: true });
    scrollTo(value);
  }
  function wheel(event: WheelEvent) {
    const mode = props().wheel;
    if (mode !== "scroll" && mode !== "switch") return;
    const direction = event.deltaY || event.deltaX;
    if (!direction || event.ctrlKey) return;
    if (mode === "switch") {
      event.preventDefault();
      if (Date.now() - lastWheel < 140) return;
      lastWheel = Date.now();
      switchTab(Math.sign(direction), "wheel");
    } else if (hasOverflow.value) {
      const normalized =
        direction * (vertical() || !rtl() || event.deltaX ? 1 : -1);
      const forward = Math.sign(normalized) * (vertical() || !rtl() ? 1 : -1);
      if (forward > 0 ? !after.value : !before.value) return;
      event.preventDefault();
      scrollPixels(
        normalized *
          (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1),
      );
    }
  }
  function stop() {
    running = false;
    observer?.disconnect();
    observer = undefined;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("resize", schedule);
  }
  function start() {
    stop();
    running = true;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      if (nav.value) observer.observe(nav.value);
      if (track.value) observer.observe(track.value);
    } else window.addEventListener("resize", schedule);
    void nextTick(() => scrollTo());
  }
  watch(
    () => [active(), vertical(), props().overflow],
    () => void nextTick(() => scrollTo()),
    { flush: "post" },
  );
  watch(
    () =>
      items().map((item) => [
        item.value,
        item.label,
        item.width,
        item.badge,
        item.dirty,
      ]),
    schedule,
    { flush: "post" },
  );
  onMounted(start);
  onActivated(start);
  onDeactivated(stop);
  onBeforeUnmount(stop);
  return {
    nav,
    track,
    before,
    after,
    hasOverflow,
    overflowed,
    indicator,
    setButton,
    button,
    rtl,
    scroll,
    scrollTo,
    scrollPixels,
    focus,
    wheel,
    schedule,
  };
}
