import { nextTick } from "vue";
import { candidateAt, keyStep } from "./geometry";
import {
  linkedPorts,
  type SortCandidate,
  type SortPort,
  type SortProposal,
} from "./model";
import type { HysSortDrag, HysSortFeedback, HysSortKey } from "./sortableList";

export const sortInteractive =
  "button,input,select,textarea,a[href],label,[contenteditable=true],[role=button],[data-sort-ignore]";
const activationKeys = new Set([" ", "Enter"]);

export function keyboardPreviewLabel<T extends object>(
  source: SortPort<T>,
  item: T,
  result?: SortProposal<T> | HysSortFeedback<T>,
) {
  if (!result) return "";
  if ("reason" in result) return result.message;
  const index =
    result.target === source
      ? result.changes[0].next.indexOf(item)
      : result.proposal.index;
  return `${result.target.props.ariaLabel ?? "目标列表"}，第 ${index + 1} 项`;
}

interface KeyboardSort<T extends object> {
  current: () => { drag: HysSortDrag<T>; candidate?: SortCandidate<T> } | null;
  begin: (key: HysSortKey) => void;
  update: (candidate: SortCandidate<T>) => void;
  finish: () => Promise<boolean>;
  cancel: () => void;
  relative: (key: HysSortKey, step: number) => Promise<boolean>;
}

function orderedPorts<T extends object>(port: SortPort<T>) {
  return linkedPorts(port).sort((a, b) => {
    const left = a.root();
    const right = b.root();
    if (!left || !right || left === right) return 0;
    return left.compareDocumentPosition(right) &
      Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1;
  });
}

export function useSortKeyboard<T extends object>(
  port: SortPort<T>,
  actions: KeyboardSort<T>,
) {
  return (event: KeyboardEvent, key: HysSortKey, rowDisabled: boolean) => {
    if (port.props.keyboard === false || event.defaultPrevented || rowDisabled)
      return;
    const target = event.target;
    const row = event.currentTarget;
    if (
      !(target instanceof Element) ||
      target.closest("[data-sort-root]") !== port.root()
    )
      return;
    const handle =
      target.closest("[data-sort-handle]") ||
      (typeof port.props.handle === "string" &&
        target.closest(port.props.handle));
    if (target !== row && !handle && target.closest(sortInteractive)) return;
    const current = actions.current();

    if (event.altKey) {
      const step = keyStep(port, event.key);
      if (step && !current) {
        event.preventDefault();
        void actions.relative(key, step);
      }
      return;
    }
    if (activationKeys.has(event.key) && (handle || target === row)) {
      event.preventDefault();
      if (event.repeat) return;
      if (current?.drag.source === "keyboard") void actions.finish();
      else actions.begin(key);
      return;
    }
    if (current?.drag.source !== "keyboard") return;
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      actions.cancel();
      return;
    }

    let destination = current.candidate?.port ?? port;
    let index = current.candidate?.index ?? current.drag.indices[0];
    const step = keyStep(destination, event.key);
    if (event.ctrlKey && event.key.startsWith("Arrow")) {
      const direction =
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const ports = orderedPorts(port);
      const next = ports[ports.indexOf(destination) + direction];
      if (!next) return;
      destination = next;
      index = next.data().items.length;
    } else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = destination.data().items.length;
    else if (step) {
      index += step;
      if (!current.candidate && step > 0 && destination.props.mode !== "swap")
        index++;
    } else return;

    const swap = destination === port && port.props.mode === "swap";
    const max = Math.max(0, destination.data().items.length - (swap ? 1 : 0));
    const candidate = candidateAt(
      port,
      destination,
      Math.min(max, Math.max(0, index)),
    );
    event.preventDefault();
    const focused = target instanceof HTMLElement ? target : undefined;
    actions.update(candidate);
    const anchor = candidate.anchor;
    if (anchor !== undefined)
      void nextTick(() => {
        if (
          actions.current() &&
          focused?.isConnected &&
          focused.ownerDocument.activeElement === focused.ownerDocument.body
        )
          focused.focus({ preventScroll: true });
        if (destination !== port || !destination.props.virtual)
          void destination.scroll(anchor);
      });
  };
}
