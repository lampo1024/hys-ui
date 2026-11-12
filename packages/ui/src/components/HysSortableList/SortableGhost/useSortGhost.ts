import { ref, shallowRef, watch, type Ref } from "vue";
import type { SortPoint } from "../geometry";
import type { HysSortDrag } from "../sortableList";

export interface SortGhost<T extends object> {
  drag: HysSortDrag<T>;
  position: Ref<SortPoint>;
  returning: Ref<boolean>;
  landing: Ref<{ duration: number; easing: string } | null>;
  allowed: Ref<boolean>;
  width: number;
}

let landingId = 0;

export function useSortGhost<T extends object>(
  animate: () => boolean,
  timing: () => { duration: number; easing: string },
) {
  const ghost = shallowRef<SortGhost<T> | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let origin: DOMRect | undefined;
  let restoreRow: (() => void) | undefined;

  function show(drag: HysSortDrag<T>, row: HTMLElement, point: SortPoint) {
    clear(false);
    origin = row.getBoundingClientRect();
    ghost.value = {
      drag,
      width: Math.max(96, Math.min(origin.width || 200, 360)),
      position: ref(point),
      returning: ref(false),
      landing: ref(null),
      allowed: ref(true),
    };
  }

  function clear(rebound: boolean, row?: HTMLElement) {
    clearTimeout(timer);
    restoreRow?.();
    restoreRow = undefined;
    const current = ghost.value;
    if (!rebound || !current || !origin || !animate()) {
      ghost.value = null;
      return;
    }
    const rect = row?.isConnected ? row.getBoundingClientRect() : origin;
    current.landing.value = null;
    current.returning.value = true;
    current.position.value = { x: rect.left, y: rect.top };
    timer = setTimeout(() => {
      if (ghost.value === current) ghost.value = null;
    }, 200);
  }

  function land(row?: HTMLElement) {
    const current = ghost.value;
    const { duration, easing } = timing();
    if (
      !current ||
      !animate() ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !row?.isConnected
    )
      return clear(false);

    const marker = String(++landingId);
    row.style.setProperty("--hys-sort-landing-duration", `${duration}ms`);
    row.dataset.sortLanding = marker;
    restoreRow = () => {
      if (row.dataset.sortLanding !== marker) return;
      delete row.dataset.sortLanding;
      row.style.removeProperty("--hys-sort-landing-duration");
    };
    const rect = row.getBoundingClientRect();
    const view = row.ownerDocument.defaultView;
    if (
      !rect.width ||
      !rect.height ||
      !view ||
      rect.right <= 0 ||
      rect.bottom <= 0 ||
      rect.left >= view.innerWidth ||
      rect.top >= view.innerHeight
    )
      return clear(false);

    current.landing.value = { duration, easing };
    current.position.value = { x: rect.left, y: rect.top };
    timer = setTimeout(() => clear(false), duration);
  }

  function release(
    commit: (onLanding?: (row?: HTMLElement) => void) => Promise<boolean>,
    sourceRow: () => HTMLElement | undefined,
  ) {
    const track = ghost.value;
    if (!track || !animate() || timing().duration <= 0) {
      clear(false);
      return commit();
    }
    return commit((row) => {
      if (ghost.value === track) land(row);
    }).then((accepted) => {
      if (!accepted && ghost.value === track) clear(true, sourceRow());
      return accepted;
    });
  }

  watch(animate, (enabled) => {
    const current = ghost.value;
    if (!enabled && (current?.landing.value || current?.returning.value))
      clear(false);
  });

  return { ghost, show, clear, release };
}
