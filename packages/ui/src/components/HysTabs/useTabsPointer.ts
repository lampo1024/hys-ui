import { onBeforeUnmount, onDeactivated, ref } from "vue";
import { bounded } from "./tabsItems";
import type { HysTabItem, HysTabsProps, HysTabValue } from "./tabsTypes";
import type { useTabsNav } from "./useTabsNav";
import { useTabsDragGhost } from "./useTabsDragGhost";

const edgeSize = 24;
const dragMargin = 12;
const maxScrollSpeed = 560;

export function useTabsPointer(
  props: () => HysTabsProps,
  nav: ReturnType<typeof useTabsNav>,
  itemByToken: (token: string) => HysTabItem | undefined,
  canMove: (item: HysTabItem) => boolean,
  move: (
    value: HysTabValue,
    target: HysTabValue,
    after: boolean,
  ) => Promise<boolean>,
  isVertical: () => boolean,
  longpress: (item: HysTabItem, event: PointerEvent) => void,
  swipe: (step: number) => void,
  animated: () => boolean,
) {
  const ghost = useTabsDragGhost();
  const dragging = ref<HysTabValue>(),
    drop = ref<{ value: HysTabValue; after: boolean }>();
  const scrollControls = ref<{ before: boolean; after: boolean }>();
  let start:
    | {
        id: number;
        x: number;
        y: number;
        last: number;
        item?: HysTabItem;
        reorder: boolean;
        scroll: boolean;
      }
    | undefined;
  let gesture: { id: number; x: number; y: number } | undefined;
  let longTimer: ReturnType<typeof setTimeout> | undefined,
    clickTimer: ReturnType<typeof setTimeout> | undefined;
  let suppress = false,
    scrolling = false;
  let dragPoint: { x: number; y: number } | undefined;
  let scrollFrame = 0;
  let lastScrollTime: number | undefined;
  function clearLong() {
    clearTimeout(longTimer);
    longTimer = undefined;
  }
  function clearClick() {
    clearTimeout(clickTimer);
    suppress = false;
  }
  function preventClick() {
    clearClick();
    suppress = true;
    clickTimer = setTimeout(() => {
      suppress = false;
    }, 450);
  }
  function clickCapture(event: MouseEvent) {
    if (!suppress) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    clearClick();
  }
  function down(event: PointerEvent) {
    if (props().disabled || !event.isPrimary || event.button !== 0) return;
    clearClick();
    const target = event.target as Element,
      group = target.closest<HTMLElement>(".hys-ui-tab-item");
    if (target.closest(".hys-ui-tab-close")) return;
    const item = group?.dataset.tabGroup
      ? itemByToken(group.dataset.tabGroup)
      : undefined;
    const reorder = !!(
      item &&
      props().draggable &&
      canMove(item) &&
      (!props().dragHandle || target.closest(".hys-tab-drag-handle"))
    );
    const scroll = !!props().dragScroll && event.pointerType !== "touch";
    start = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      last: isVertical() ? event.clientY : event.clientX,
      item,
      reorder,
      scroll,
    };
    const delay = bounded(
      props().longPress,
      props().workbench || props().contextMenu ? 550 : 0,
      5000,
    );
    if (
      item &&
      delay &&
      event.pointerType !== "mouse" &&
      !target.closest(".hys-tab-drag-handle")
    )
      longTimer = setTimeout(() => {
        if (start?.id !== event.pointerId) return;
        start = undefined;
        preventClick();
        longpress(item, event);
      }, delay);
  }
  function motion(event: PointerEvent) {
    const current = start,
      viewport = nav.nav.value;
    if (!current || current.id !== event.pointerId || !viewport) return;
    const x = event.clientX,
      y = event.clientY,
      vertical = isVertical(),
      point = vertical ? y : x;
    if (dragging.value === undefined && !scrolling) {
      if (Math.hypot(x - current.x, y - current.y) < 7) return;
      clearLong();
      if (!current.reorder && !current.scroll) return;
      viewport.setPointerCapture?.(event.pointerId);
      if (current.reorder) {
        const item = current.item!;
        // Keep the viewport edges steady when an arrow reaches its limit.
        scrollControls.value = {
          before: nav.before.value,
          after: nav.after.value,
        };
        dragging.value = item.value;
        const box = nav
          .button(item.value)
          ?.closest(".hys-ui-tab-item")
          ?.getBoundingClientRect();
        if (box) ghost.show(item, box, { x: current.x, y: current.y });
      } else scrolling = true;
    }
    event.preventDefault();
    if (scrolling) {
      nav.scrollPixels(current.last - point);
      current.last = point;
      return;
    }
    ghost.move(x, y);
    dragPoint = { x, y };
    updateDragTarget();
  }

  function stopEdgeScroll() {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    lastScrollTime = undefined;
  }

  function updateDragTarget(timestamp?: number) {
    const viewport = nav.nav.value;
    if (!dragPoint || dragging.value === undefined || !viewport) {
      stopEdgeScroll();
      return;
    }
    if (props().disabled || props().readonly || !props().draggable) {
      finish(undefined, true);
      return;
    }
    const { x, y } = dragPoint;
    const bounds = viewport.getBoundingClientRect();
    if (
      x < bounds.left - dragMargin ||
      x > bounds.right + dragMargin ||
      y < bounds.top - dragMargin ||
      y > bounds.bottom + dragMargin ||
      !bounds.width ||
      !bounds.height
    ) {
      drop.value = undefined;
      stopEdgeScroll();
      return;
    }
    const vertical = isVertical();
    const point = vertical ? y : x;
    const min = vertical ? bounds.top : bounds.left;
    const max = vertical ? bounds.bottom : bounds.right;
    const edge = Math.min(edgeSize, (max - min) / 2);
    const proximity = (distance: number) =>
      Math.min(1, Math.max(0, 1 - distance / edge));
    const inLane = vertical
      ? x >= bounds.left && x < bounds.right
      : y >= bounds.top && y < bounds.bottom;
    const speed =
      props().overflow === "wrap" || !inLane
        ? 0
        : (proximity(max - point) - proximity(point - min)) * maxScrollSpeed;
    let keepScrolling = speed !== 0;
    if (keepScrolling && timestamp !== undefined) {
      const elapsed = Math.min(
        32,
        timestamp - (lastScrollTime ?? timestamp - 16),
      );
      lastScrollTime = timestamp;
      const delta =
        Math.sign(speed) *
        Math.max(1, Math.round((Math.abs(speed) * elapsed) / 1000));
      keepScrolling = nav.scrollPixels(delta);
    }
    if (keepScrolling && !scrollFrame) {
      scrollFrame = requestAnimationFrame((time) => {
        scrollFrame = 0;
        updateDragTarget(time);
      });
    } else if (!keepScrolling) stopEdgeScroll();

    const clamp = (value: number, start: number, end: number) =>
      Math.max(start, Math.min(end - 1, value));
    const hit = viewport.ownerDocument
      .elementFromPoint(
        clamp(x, bounds.left, bounds.right),
        clamp(y, bounds.top, bounds.bottom),
      )
      ?.closest<HTMLElement>(".hys-ui-tab-item");
    const rtl = !vertical && nav.rtl();
    const targetElement =
      hit && viewport.contains(hit)
        ? hit
        : speed
          ? edgeTab(vertical, min, max, speed > 0, rtl)
          : undefined;
    const token = targetElement?.dataset.tabGroup;
    const target = token ? itemByToken(token) : undefined;
    if (
      targetElement &&
      target &&
      canMove(target) &&
      target.value !== dragging.value
    ) {
      const rect = targetElement.getBoundingClientRect(),
        mid = vertical
          ? (rect.top + rect.bottom) / 2
          : (rect.left + rect.right) / 2;
      const after = rtl ? point < mid : point > mid;
      if (
        drop.value?.value !== target.value ||
        (drop.value.after !== after && Math.abs(point - mid) > 4)
      )
        drop.value = { value: target.value, after };
    } else drop.value = undefined;
  }

  function edgeTab(
    vertical: boolean,
    min: number,
    max: number,
    endEdge: boolean,
    rtl: boolean,
  ) {
    const items = nav.track.value?.firstElementChild?.children;
    if (!items) return;
    const reverse = endEdge !== rtl;
    // Tabs form a single row while scrolling. Find the nearest edge item
    // in a gap without measuring every offscreen tab.
    let start = 0;
    let end = items.length;
    while (start < end) {
      const middle = Math.floor((start + end) / 2);
      const item = items[
        reverse ? items.length - 1 - middle : middle
      ] as HTMLElement;
      const rect = item.getBoundingClientRect();
      const before = (vertical ? rect.bottom : rect.right) <= min;
      const after = (vertical ? rect.top : rect.left) >= max;
      if (!before && !after) {
        end = middle;
      } else {
        const searchBackward = endEdge ? before : after;
        if (searchBackward) end = middle;
        else start = middle + 1;
      }
    }
    const item = items[reverse ? items.length - 1 - start : start] as
      HTMLElement | undefined;
    const bounds = item?.getBoundingClientRect();
    if (
      bounds &&
      (vertical ? bounds.bottom : bounds.right) > min &&
      (vertical ? bounds.top : bounds.left) < max
    )
      return item;
  }
  function finish(event?: PointerEvent, cancelled = false) {
    if (!start || (event && start.id !== event.pointerId)) return;
    clearLong();
    stopEdgeScroll();
    dragPoint = undefined;
    const value = dragging.value,
      target = drop.value;
    if (value !== undefined || scrolling) preventClick();
    start = undefined;
    dragging.value = undefined;
    scrollControls.value = undefined;
    drop.value = undefined;
    scrolling = false;
    if (value !== undefined) {
      const commit =
        !cancelled && target
          ? move(value, target.value, target.after)
          : undefined;
      void ghost.land(
        commit,
        () => nav.button(value)?.closest<HTMLElement>(".hys-ui-tab-item"),
        animated() ? bounded(props().duration, 160, 5000) : 0,
        props().easing ?? "ease-out",
      );
    }
  }
  function swipeDown(event: PointerEvent) {
    if (
      props().swipe &&
      !props().disabled &&
      event.pointerType === "touch" &&
      event.isPrimary &&
      !(event.target as Element).closest(
        "button,input,a,select,textarea,[contenteditable]",
      )
    )
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function swipeUp(event: PointerEvent) {
    const origin = gesture;
    gesture = undefined;
    if (
      !origin ||
      event.pointerId !== origin.id ||
      !props().swipe ||
      props().disabled
    )
      return;
    const x = event.clientX - origin.x,
      y = event.clientY - origin.y;
    if (Math.abs(x) >= 45 && Math.abs(x) > Math.abs(y) * 1.35)
      swipe(Math.sign(x) * (nav.rtl() ? 1 : -1));
  }
  function clean() {
    finish(undefined, true);
    clearLong();
    clearClick();
    gesture = undefined;
    ghost.clear();
  }
  onDeactivated(clean);
  onBeforeUnmount(clean);
  return {
    dragging,
    drop,
    scrollControls,
    ghost: ghost.ghost,
    ghostElement: ghost.element,
    down,
    motion,
    finish,
    cancel: (event: PointerEvent) => finish(event, true),
    clickCapture,
    swipeDown,
    swipeUp,
    cancelSwipe: () => {
      gesture = undefined;
    },
  };
}
