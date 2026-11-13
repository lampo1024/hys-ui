import { nextTick, ref, shallowRef } from "vue";
import type { HysTabItem } from "./tabsTypes";

interface Point {
  x: number;
  y: number;
}
const transform = ({ x, y }: Point) => `translate3d(${x}px,${y}px,0)`;
export function useTabsDragGhost() {
  const ghost = shallowRef<{ label: string; width: number; height: number }>();
  const element = ref<HTMLElement>();
  let origin: Point | undefined,
    last: Point | undefined,
    animation: Animation | undefined,
    ticket = 0;
  function clear() {
    ticket++;
    animation?.cancel();
    animation = undefined;
    origin = last = undefined;
    ghost.value = undefined;
  }
  function move(x: number, y: number) {
    if (!origin) return;
    last = { x: origin.x + x, y: origin.y + y };
    if (element.value) element.value.style.transform = transform(last);
  }
  function show(item: HysTabItem, box: DOMRect, pointer: Point) {
    clear();
    origin = { x: box.left - pointer.x, y: box.top - pointer.y };
    ghost.value = { label: item.label, width: box.width, height: box.height };
    move(pointer.x, pointer.y);
    void nextTick(() => {
      if (element.value && last)
        element.value.style.transform = transform(last);
    });
  }
  async function land(
    commit: Promise<boolean> | undefined,
    target: () => HTMLElement | null | undefined,
    duration: number,
    easing: string,
  ) {
    const version = ticket;
    if (commit) await commit;
    await nextTick();
    if (version !== ticket) return;
    const destination = target(),
      node = element.value;
    if (duration && last && destination && node?.animate) {
      const rect = destination.offsetParent?.getBoundingClientRect();
      const box = rect
        ? {
            x: rect.left + destination.offsetLeft,
            y: rect.top + destination.offsetTop,
          }
        : {
            x: destination.getBoundingClientRect().left,
            y: destination.getBoundingClientRect().top,
          };
      try {
        animation = node.animate(
          [
            { transform: transform(last), opacity: 0.95 },
            { transform: transform(box), opacity: 0 },
          ],
          { duration, easing, fill: "forwards" },
        );
        await animation.finished;
      } catch {
        /* A new drag or unmount can replace the current animation. */
      }
    }
    if (version === ticket) clear();
  }
  return { ghost, element, show, move, land, clear };
}
