import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import type { HysTableStickyOptions } from "./table";

const scrollbarHeight = 16;
const offset = (value?: number) =>
  value !== undefined && Number.isFinite(value) ? Math.max(0, value) : 0;

export function useTableSticky(
  viewport: Ref<HTMLElement | undefined>,
  header: Readonly<Ref<HTMLTableSectionElement | undefined>>,
  options: () => boolean | HysTableStickyOptions | undefined,
) {
  const headerTop = ref(0);
  const scrollbar = ref<HTMLElement>();
  const bar = shallowRef<{
    top: number;
    left: number;
    width: number;
    contentWidth: number;
    direction: "ltr" | "rtl";
  }>();
  let frame = 0;
  let active = false;
  let listening = false;
  let mirroredLeft: number | undefined;
  let observer: ResizeObserver | undefined;

  function syncScrollbar() {
    const bar = scrollbar.value;
    const el = viewport.value;
    if (!bar || !el || bar.scrollLeft === el.scrollLeft) return;
    bar.scrollLeft = el.scrollLeft;
    mirroredLeft = bar.scrollLeft;
  }
  function scrollViewport(event: Event) {
    if (!listening || !viewport.value) return;
    const next = (event.currentTarget as HTMLElement).scrollLeft;
    const mirrored = next === mirroredLeft;
    mirroredLeft = undefined;
    if (mirrored) return;
    if (next !== viewport.value.scrollLeft) viewport.value.scrollLeft = next;
  }
  function measure() {
    frame = 0;
    const el = viewport.value;
    if (!listening || !el?.isConnected) return;
    const config = options();
    const settings = typeof config === "object" ? config : undefined;
    const owner = settings?.getContainer?.();
    const winWidth = document.documentElement.clientWidth;
    const winHeight = document.documentElement.clientHeight;
    const bounds =
      owner instanceof HTMLElement ? owner.getBoundingClientRect() : undefined;
    const top = Math.max(0, bounds?.top ?? 0);
    const bottom = Math.min(winHeight, bounds?.bottom ?? winHeight);
    const viewportRect = el.getBoundingClientRect();
    const headerHeight = header.value?.getBoundingClientRect().height ?? 0;
    const space = Math.max(0, el.clientHeight - headerHeight);
    headerTop.value = Math.min(
      space,
      Math.max(0, top + offset(settings?.offsetHeader) - viewportRect.top),
    );

    const maxScroll = el.scrollWidth - el.clientWidth;
    const barTop = bottom - offset(settings?.offsetScroll) - scrollbarHeight;
    const left = Math.max(
      0,
      bounds?.left ?? 0,
      viewportRect.left + el.clientLeft,
    );
    const right = Math.min(
      winWidth,
      bounds?.right ?? winWidth,
      viewportRect.left + el.clientLeft + el.clientWidth,
    );
    const width = right - left;
    if (
      maxScroll <= 1 ||
      width <= 0 ||
      viewportRect.bottom <= barTop + scrollbarHeight ||
      barTop <= viewportRect.top ||
      barTop <= top + offset(settings?.offsetHeader) + headerHeight
    ) {
      bar.value = undefined;
      return;
    }
    const direction = getComputedStyle(el).direction === "rtl" ? "rtl" : "ltr";
    const current = bar.value;
    if (
      current?.top !== barTop ||
      current.left !== left ||
      current.width !== width ||
      current.contentWidth !== maxScroll + width ||
      current.direction !== direction
    )
      bar.value = {
        top: barTop,
        left,
        width,
        contentWidth: maxScroll + width,
        direction,
      };
  }
  function schedule() {
    if (listening && !frame) frame = requestAnimationFrame(measure);
  }
  function stop() {
    if (!listening) return;
    listening = false;
    cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    observer?.disconnect();
    headerTop.value = 0;
    bar.value = undefined;
  }
  function start() {
    if (!active || !options() || listening || !viewport.value) return;
    listening = true;
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      observer.observe(viewport.value);
    }
    schedule();
  }
  function activate() {
    active = true;
    start();
  }
  function deactivate() {
    active = false;
    stop();
  }
  onMounted(activate);
  onActivated(activate);
  onDeactivated(deactivate);
  onBeforeUnmount(deactivate);
  onUpdated(schedule);
  watch(options, (value) => (value ? start() : stop()), { flush: "post" });
  watch(
    scrollbar,
    () => {
      mirroredLeft = undefined;
      syncScrollbar();
    },
    { flush: "post" },
  );
  return {
    headerTop,
    bar,
    scrollbar,
    syncScrollbar,
    scrollViewport,
    scrollbarHeight,
  };
}
