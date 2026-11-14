import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  watch,
  type Ref,
} from "vue";

export const sheetTransitionOptions = [
  ["slide", "方向滑动"],
  ["fade", "原位交叉淡化"],
  ["wipe", "纵向揭示"],
  ["scale", "轻微缩放"],
  ["off", "无动画"],
] as const;

type SheetTransition = (typeof sheetTransitionOptions)[number][0];
const scrollSelector = ".hys-ui-pf-grid-scroll";
const liveGrid = (surface: HTMLElement) =>
  surface.querySelector<HTMLElement>(":scope > .hys-ui-pro-grid");

function capture(grid: HTMLElement) {
  const scroll = grid.querySelector<HTMLElement>(scrollSelector);
  if (!scroll || !grid.offsetHeight) return;

  const children = grid.ownerDocument.createTreeWalker(grid, 1);
  let count = 0;
  while (children.nextNode()) {
    const node = children.currentNode as HTMLElement;
    // Large sheets and embedded content still use the incoming animation.
    if (
      ++count > 2500 ||
      /^(IFRAME|VIDEO|AUDIO|OBJECT|EMBED|CANVAS|SCRIPT)$/.test(node.tagName) ||
      node.localName.includes("-")
    )
      return;
  }

  const layer = grid.ownerDocument.createElement("div");
  layer.className = "hys-ui-spreadsheet-outgoing-sheet";
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("inert", "");
  layer.style.blockSize = `${grid.offsetHeight}px`;
  const clone = grid.cloneNode(true) as HTMLElement;
  // Keep the snapshot out of document ID lookups and form submissions.
  for (const element of clone.querySelectorAll(
    "[id], [name], [form], [autofocus]",
  )) {
    for (const attribute of ["id", "name", "form", "autofocus"])
      element.removeAttribute(attribute);
  }
  layer.append(clone);
  return { layer, top: scroll.scrollTop, left: scroll.scrollLeft };
}

export function useSpreadsheetSheetTransition(
  surface: Readonly<Ref<HTMLElement | null>>,
  effect: Readonly<Ref<SheetTransition>>,
  motion: Readonly<Ref<string>>,
  sheetId: () => string,
  order: () => readonly string[],
) {
  let generation = 0;
  let active = true;
  let animations: Animation[] = [];
  let outgoing: HTMLElement | undefined;
  let container: HTMLElement | undefined;

  function cancel() {
    generation++;
    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations = [];
    outgoing?.remove();
    outgoing = undefined;
    container?.removeAttribute("data-sheet-transition");
    container = undefined;
  }

  watch(sheetId, async (id, previousId) => {
    cancel();
    const target = surface.value;
    if (!active || !target || motion.value === "off" || effect.value === "off")
      return;
    const previous = liveGrid(target);
    if (!previous?.animate) return;
    const ids = order();
    const from = ids.indexOf(previousId);
    const to = ids.indexOf(id);
    const rtl = getComputedStyle(target).direction === "rtl";
    const direction = from < 0 || to < 0 ? 0 : Math.sign(to - from) * (rtl ? -1 : 1);
    const choice =
      effect.value === "slide" && !direction ? "fade" : effect.value;
    const snapshot = capture(previous);
    const currentGeneration = generation;

    await nextTick();
    if (
      currentGeneration !== generation ||
      target !== surface.value ||
      !target.isConnected
    )
      return;
    const grid = liveGrid(target);
    if (!grid?.animate || grid === previous) return;
    const full = motion.value === "full";
    const hasOutgoing = !!snapshot;
    const distance = direction * (full ? 32 : 24);
    const durations = {
      slide: full ? 240 : 200,
      fade: 180,
      wipe: 260,
      scale: 220,
    };
    const stationary = { opacity: 1, transform: "none" };
    const incoming = {
      slide: [
        { opacity: 0.64, transform: `translateX(${distance}px)` },
        stationary,
      ],
      fade: [{ opacity: hasOutgoing ? 0.68 : 0.46 }, { opacity: 1 }],
      wipe: [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
      scale: [
        { opacity: hasOutgoing ? 0 : 0.46, transform: "scale(.97)" },
        stationary,
      ],
    }[choice];
    const options = {
      duration: durations[choice],
      easing: "cubic-bezier(.2,.7,.25,1)",
    };
    container = target;
    target.dataset.sheetTransition = choice;
    if (snapshot) {
      outgoing = snapshot.layer;
      target.append(outgoing);
      const scroll = outgoing.querySelector<HTMLElement>(scrollSelector)!;
      scroll.scrollTop = snapshot.top;
      scroll.scrollLeft = snapshot.left;
      if (choice !== "wipe") {
        const exit =
          choice === "slide"
            ? { opacity: 0, transform: `translateX(${-distance * 0.7}px)` }
            : { opacity: 0 };
        animations.push(outgoing.animate([stationary, exit], options));
      }
    }
    const entry = grid.animate(incoming, options);
    animations.push(entry);
    entry.onfinish = () => {
      if (currentGeneration === generation) cancel();
    };
  });

  watch(effect, cancel, { flush: "sync" });
  watch(
    motion,
    (value) => {
      if (value === "off") cancel();
    },
    { flush: "sync" },
  );
  onActivated(() => {
    active = true;
  });
  onDeactivated(() => {
    active = false;
    cancel();
  });
  onBeforeUnmount(cancel);
  return cancel;
}
