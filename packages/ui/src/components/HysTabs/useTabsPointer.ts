import { onBeforeUnmount, onDeactivated, ref } from "vue";
import { bounded, tabToken } from "./tabsItems";
import type { HysTabItem, HysTabsProps, HysTabValue } from "./tabsTypes";
import type { useTabsNav } from "./useTabsNav";
import { useTabsDragGhost } from "./useTabsDragGhost";

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
    const bounds = viewport.getBoundingClientRect();
    if (
      x < bounds.left - 12 ||
      x > bounds.right + 12 ||
      y < bounds.top - 12 ||
      y > bounds.bottom + 12
    ) {
      drop.value = undefined;
      return;
    }
    const hit = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>(".hys-ui-tab-item");
    const token = hit?.dataset.tabGroup;
    const target = token ? itemByToken(token) : undefined;
    if (
      hit &&
      viewport.contains(hit) &&
      target &&
      canMove(target) &&
      target.value !== current.item!.value
    ) {
      const rect = hit.getBoundingClientRect(),
        mid = vertical
          ? (rect.top + rect.bottom) / 2
          : (rect.left + rect.right) / 2;
      if (drop.value?.value !== target.value || Math.abs(point - mid) > 4)
        drop.value = {
          value: target.value,
          after: vertical || !nav.rtl() ? point > mid : point < mid,
        };
    } else if (token !== tabToken(current.item!.value)) drop.value = undefined;
    const min = vertical ? bounds.top : bounds.left,
      max = vertical ? bounds.bottom : bounds.right;
    if (point < min + 16) nav.scrollPixels(-8);
    else if (point > max - 16) nav.scrollPixels(8);
  }
  function finish(event?: PointerEvent, cancelled = false) {
    if (!start || (event && start.id !== event.pointerId)) return;
    clearLong();
    const value = dragging.value,
      target = drop.value;
    if (value !== undefined || scrolling) preventClick();
    start = undefined;
    dragging.value = undefined;
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
