import { computed, shallowRef } from "vue";
import {
  autoScrollSort,
  dropMarkerFor,
  findSortHit,
  hitsSelectableText,
  keepSortCandidate,
  relativeCandidate,
  sameCandidate,
  tokenOf,
  withinDragBounds,
  wholeRowDrag,
  type SortPoint,
} from "./geometry";
import {
  feedback,
  makeDrag,
  proposeSort,
  type SortCandidate,
  type SortPort,
  type SortProposal,
} from "./model";
import { abortSort, busySort, commitSort } from "./transactions";
import {
  keyboardPreviewLabel,
  sortInteractive,
  useSortKeyboard,
} from "./useSortKeyboard";
import { useSortGhost } from "./SortableGhost/useSortGhost";
import type {
  HysSortDrag,
  HysSortFeedback,
  HysSortKey,
  HysSortReason,
  HysSortSource,
} from "./sortableList";

interface ActiveSort<T extends object> {
  source: SortPort<T>;
  drag: HysSortDrag<T>;
  candidate?: SortCandidate<T>;
  result?: SortProposal<T> | HysSortFeedback<T>;
}

const active = shallowRef<ActiveSort<object> | null>(null);
const state = <T extends object>() =>
  active.value as unknown as ActiveSort<T> | null;
const setState = <T extends object>(value: ActiveSort<T> | null) => {
  active.value = value as unknown as ActiveSort<object> | null;
};

export function useSortDrag<T extends object>(
  port: SortPort<T>,
  pickedKeys: (key: HysSortKey) => readonly HysSortKey[],
  animate: () => boolean,
) {
  const own = computed(() => (state<T>()?.source === port ? state<T>() : null));
  const over = computed(() =>
    state<T>()?.candidate?.port === port ? state<T>() : null,
  );
  const {
    ghost,
    show: showGhost,
    clear: clearGhost,
    release: releaseGhost,
  } = useSortGhost<T>(animate, () => ({
    duration: port.props.animationDuration ?? 180,
    easing: port.props.animationEasing ?? "ease",
  }));
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  let sampled: SortPoint | undefined;
  let lastScroll = -Infinity;
  let scrollingLastFrame = false;
  let view: Window | null | undefined;
  let document: Document | undefined;
  let pending:
    | {
        id: number;
        key: HysSortKey;
        origin: SortPoint;
        latest: SortPoint;
        offset: SortPoint;
        threshold: number;
        delay: number;
        row: HTMLElement;
      }
    | undefined;
  let lastPreview = "";

  function make(keys: readonly HysSortKey[], source: HysSortSource) {
    if (busySort(port)) return undefined;
    try {
      const attempt = makeDrag(port, keys, source);
      if (!("reason" in attempt)) return attempt;
      port.reject(attempt);
    } catch (error) {
      port.reject(
        feedback(
          "rule",
          undefined,
          error instanceof Error ? error.message : undefined,
          error,
        ),
      );
    }
  }

  function begin(key: HysSortKey, source: HysSortSource) {
    if (active.value) return false;
    const drag = make(pickedKeys(key), source);
    if (!drag) return false;
    setState({ source: port, drag });
    port.start(drag);
    port.announce(
      drag.items.length > 1
        ? `已拾起 ${drag.items.length} 项`
        : `已拾起${port.label(drag.items[0])}`,
    );
    lastPreview = "";
    return true;
  }

  function update(candidate?: SortCandidate<T>) {
    const current = state<T>();
    if (current?.source !== port || sameCandidate(current.candidate, candidate))
      return;
    let result: ActiveSort<T>["result"];
    try {
      result = candidate
        ? proposeSort(port, current.drag, candidate)
        : undefined;
    } catch (error) {
      result = feedback(
        "rule",
        undefined,
        error instanceof Error ? error.message : undefined,
        error,
      );
    }
    const previous = current.candidate?.port;
    const next = candidate?.port;
    setState({ ...current, candidate, result });
    if (ghost.value)
      ghost.value.allowed.value =
        !!result && (!("reason" in result) || result.reason === "noop");
    if (previous && previous !== port && previous !== next)
      previous.preview(null);
    const preview =
      result && !("reason" in result)
        ? {
            proposal: result.proposal,
            lists: result.changes.map((change) => ({
              id: change.port.id(),
              previous: change.previous.slice(),
              next: change.next.slice(),
            })),
          }
        : null;
    port.preview(preview);
    if (next && next !== port) next.preview(preview);
    if (current.drag.source === "keyboard") {
      const message = keyboardPreviewLabel(port, current.drag.items[0], result);
      if (message && message !== lastPreview) port.announce(message);
      lastPreview = message;
    }
  }

  function clearSession() {
    const current = state<T>();
    if (current?.source !== port) return;
    setState<T>(null);
    port.preview(null);
    if (current.candidate && current.candidate.port !== port)
      current.candidate.port.preview(null);
    return current;
  }

  function unbind() {
    clearTimeout(holdTimer);
    view?.cancelAnimationFrame(frame);
    frame = 0;
    sampled = undefined;
    if (pending && port.root()?.hasPointerCapture?.(pending.id))
      port.root()?.releasePointerCapture(pending.id);
    pending = undefined;
    view?.removeEventListener("pointermove", pointerMove);
    view?.removeEventListener("pointerup", pointerUp);
    view?.removeEventListener("pointercancel", pointerCancel);
    view?.removeEventListener("keydown", escape);
    view?.removeEventListener("blur", pointerCancel);
    view?.removeEventListener("resize", requestFrame);
    view?.removeEventListener("scroll", requestFrame, true);
    document?.removeEventListener("selectstart", preventSelection, true);
    document?.removeEventListener("visibilitychange", onVisibility);
  }

  function preventSelection(event: Event) {
    event.preventDefault();
  }

  function cancel(reason: HysSortReason = "cancelled", rebound = true) {
    const current = clearSession();
    clearGhost(rebound, pending?.row);
    unbind();
    if (current) port.reject(feedback(reason, current.result?.proposal));
    abortSort(port);
  }

  function detach() {
    const current = state<T>();
    if (current?.candidate?.port === port && current.source !== port) {
      current.source.preview(null);
      setState({ ...current, candidate: undefined, result: undefined });
    }
    cancel("cancelled", false);
    clearTimeout(clickTimer);
    view?.removeEventListener("click", swallowClick, true);
  }

  function onVisibility() {
    if (document?.hidden) cancel();
  }
  function escape(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    if (own.value) event.preventDefault();
    cancel();
  }
  function pointerCancel(event: Event) {
    if ("pointerId" in event && event.pointerId !== pending?.id) return;
    cancel();
  }

  function requestFrame() {
    if (frame || !pending || !own.value || !view) return;
    frame = view.requestAnimationFrame(renderFrame);
  }
  function evaluatePointer(timestamp: number, scrolling = true) {
    if (!pending || !own.value) return;
    sampled = pending.latest;
    const { point, inside } = withinDragBounds(
      port,
      pending.latest,
      pending.origin,
    );
    if (ghost.value)
      ghost.value.position.value = {
        x: point.x - pending.offset.x,
        y: point.y - pending.offset.y,
      };
    const hit = inside ? findSortHit(port, point) : undefined;
    const rendered = hit?.rowKey;
    const current = own.value;
    const inPlaceholder =
      port.props.livePreview !== false &&
      hit?.candidate?.port === port &&
      current.result &&
      !("reason" in current.result) &&
      rendered !== undefined &&
      current.drag.keys.some((key) => tokenOf(key) === rendered);
    if (!inPlaceholder && !keepSortCandidate(port, current.candidate, hit))
      update(hit?.candidate);
    if (!scrolling) return;
    if (timestamp - lastScroll >= 14) {
      lastScroll = timestamp;
      scrollingLastFrame = autoScrollSort(
        hit?.element ?? null,
        point,
        port.props.autoScroll,
      );
    }
    if (scrollingLastFrame) requestFrame();
  }
  function renderFrame(timestamp: number) {
    frame = 0;
    evaluatePointer(timestamp);
  }
  function activatePointer() {
    if (!pending || !begin(pending.key, "pointer")) return unbind();
    showGhost(own.value!.drag, pending.row, {
      x: pending.latest.x - pending.offset.x,
      y: pending.latest.y - pending.offset.y,
    });
    try {
      port.root()?.setPointerCapture?.(pending.id);
    } catch {
      /* Pointer may have been released. */
    }
    lastScroll = -Infinity;
    scrollingLastFrame = false;
    requestFrame();
  }

  function pointerDown(
    event: PointerEvent,
    key: HysSortKey,
    rowDisabled: boolean,
  ) {
    if (
      rowDisabled ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.isPrimary === false ||
      pending ||
      active.value ||
      busySort(port)
    )
      return;
    const target = event.target;
    if (
      !(target instanceof Element) ||
      target.closest("[data-sort-root]") !== port.root()
    )
      return;
    const row = event.currentTarget as HTMLElement;
    const selector =
      typeof port.props.handle === "string"
        ? port.props.handle
        : "[data-sort-handle]";
    const handle =
      target.closest(selector) ?? target.closest("[data-sort-handle]");
    if (
      wholeRowDrag(port.props)
        ? !handle &&
          (target.closest(sortInteractive) ||
            hitsSelectableText(target, event.clientX, event.clientY))
        : !handle || !row.contains(handle)
    )
      return;
    const box = row.getBoundingClientRect();
    const point = { x: event.clientX, y: event.clientY };
    const delay = Math.max(
      0,
      event.pointerType === "touch"
        ? (port.props.touchDelay ?? 180)
        : (port.props.dragDelay ?? 0),
    );
    const threshold = Math.max(1, port.props.dragThreshold ?? 5);
    pending = {
      key,
      origin: point,
      latest: point,
      threshold,
      delay,
      row,
      id: event.pointerId,
      offset: {
        x: Math.min(28, Math.max(0, point.x - box.left)),
        y: Math.min(24, Math.max(0, point.y - box.top)),
      },
    };
    document = row.ownerDocument;
    view = document.defaultView;
    view?.addEventListener("pointermove", pointerMove, { passive: false });
    view?.addEventListener("pointerup", pointerUp);
    view?.addEventListener("pointercancel", pointerCancel);
    view?.addEventListener("keydown", escape);
    view?.addEventListener("blur", pointerCancel);
    view?.addEventListener("resize", requestFrame);
    view?.addEventListener("scroll", requestFrame, {
      capture: true,
      passive: true,
    });
    document.addEventListener("selectstart", preventSelection, true);
    document.addEventListener("visibilitychange", onVisibility);
    if (delay) holdTimer = setTimeout(activatePointer, delay);
    if (event.pointerType !== "touch") {
      // Text selection can begin on the compatibility mousedown before the drag threshold.
      event.preventDefault();
      target
        .closest<HTMLElement>(
          "button, a[href], input, textarea, select, summary, [contenteditable=true], [tabindex]",
        )
        ?.focus({ preventScroll: true });
    }
  }
  function pointerMove(event: PointerEvent) {
    if (pending?.id !== event.pointerId) return;
    pending.latest = { x: event.clientX, y: event.clientY };
    if (
      !own.value &&
      Math.hypot(
        event.clientX - pending.origin.x,
        event.clientY - pending.origin.y,
      ) >= pending.threshold
    ) {
      if (pending.delay) return unbind();
      activatePointer();
    }
    if (own.value) {
      event.preventDefault();
      requestFrame();
    }
  }
  function swallowClick(event: MouseEvent) {
    event.stopImmediatePropagation();
    event.preventDefault();
    view?.removeEventListener("click", swallowClick, true);
    clearTimeout(clickTimer);
  }
  function pointerUp(event: PointerEvent) {
    if (pending?.id !== event.pointerId) return;
    if (!own.value) return unbind();
    event.preventDefault();
    view?.addEventListener("click", swallowClick, true);
    clearTimeout(clickTimer);
    clickTimer = setTimeout(
      () => view?.removeEventListener("click", swallowClick, true),
      0,
    );
    pending.latest = { x: event.clientX, y: event.clientY };
    // A moving row can still be passing under the same point during its transition.
    if (sampled?.x !== event.clientX || sampled.y !== event.clientY)
      evaluatePointer(0, false);
    void finish();
  }

  async function finish() {
    const current = clearSession();
    if (!current) return false;
    const { result, candidate, drag } = current;
    const valid = !!candidate && !!result && !("reason" in result);
    if (!valid) clearGhost(true, pending?.row);
    unbind();
    if (!valid) {
      const problem =
        result && "reason" in result ? result : feedback<T>("outside");
      if (problem.reason !== "noop") port.reject(problem);
      else port.announce(problem.message);
      return false;
    }
    return releaseGhost(
      (onLanding) => commitSort(port, drag, candidate, onLanding),
      () => port.row(drag.keys[0]),
    );
  }

  async function move(
    keys: readonly HysSortKey[],
    candidate: SortCandidate<T>,
    source: HysSortSource,
  ) {
    if (active.value || busySort(port)) return false;
    const drag = make(keys, source);
    return drag ? commitSort(port, drag, candidate) : false;
  }
  function relative(key: HysSortKey, step: number, source: HysSortSource) {
    const candidate = relativeCandidate(port, key, step);
    return candidate
      ? move(pickedKeys(key), candidate, source)
      : Promise.resolve(false);
  }

  const keyboard = useSortKeyboard(port, {
    current: () => own.value,
    begin: (key) => {
      if (!begin(key, "keyboard")) return;
      view = port.root()?.ownerDocument.defaultView;
      view?.addEventListener("keydown", escape);
      view?.addEventListener("blur", pointerCancel);
    },
    update,
    finish,
    cancel,
    relative: (key, step) => relative(key, step, "keyboard"),
  });
  function dataChanged() {
    const current = state<T>();
    if (current?.source === port) cancel("conflict");
    else if (current?.candidate?.port === port) {
      setState({ ...current, candidate: undefined, result: undefined });
      current.source.preview(null);
      current.source.announce(feedback<T>("conflict").message);
    }
  }
  const anchorForDisplay = computed(() => {
    const current = over.value;
    if (!current?.candidate) return undefined;
    return dropMarkerFor(port, current.candidate, current.drag, current.result);
  });
  return {
    own,
    over,
    ghost,
    anchorForDisplay,
    pointerDown,
    keyboard,
    move,
    relative,
    cancel,
    detach,
    dataChanged,
  };
}
