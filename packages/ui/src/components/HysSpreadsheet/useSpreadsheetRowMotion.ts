import { nextTick, onBeforeUnmount, onDeactivated, watch } from "vue";
import { useMotion } from "../../motion/useMotion";

const maxAnimatedRows = 60;

function visibleRows(scroll: HTMLElement, start: number, end: number) {
  const table = scroll.querySelector<HTMLTableElement>(":scope > table");
  const viewport = scroll.ownerDocument.defaultView;
  const rows = table?.tBodies[0]?.rows;
  if (!table || !rows?.length || !viewport) return [];

  const bounds = scroll.getBoundingClientRect();
  const header = table.tHead?.getBoundingClientRect();
  const top = Math.max(0, bounds.top, header?.bottom ?? 0);
  const bottom = Math.min(viewport.innerHeight, bounds.bottom);
  if (bottom <= top) return [];

  let first = 0;
  let last = rows.length;
  while (first < last) {
    const middle = Math.floor((first + last) / 2);
    if (rows[middle].getBoundingClientRect().bottom <= top) first = middle + 1;
    else last = middle;
  }

  const visible: { index: number; row: HTMLTableRowElement; top: number }[] =
    [];
  for (let position = first; position < rows.length; position++) {
    const row = rows[position];
    const rect = row.getBoundingClientRect();
    if (rect.top >= bottom || visible.length >= maxAnimatedRows) break;
    const index = Number(
      row.querySelector<HTMLElement>("[data-sheet-row]")?.dataset.sheetRow,
    );
    if (index >= start && index <= end)
      visible.push({ index, row, top: rect.top });
  }
  return visible;
}

export function useSpreadsheetRowMotion(
  container: () => HTMLElement | null | undefined,
) {
  const { effectiveMotion } = useMotion();
  const animations = new Map<Animation, HTMLTableRowElement>();
  let generation = 0;
  let emphasized: HTMLTableRowElement | undefined;

  function clearEmphasis() {
    emphasized?.removeEventListener("animationend", endEmphasis);
    emphasized?.removeAttribute("data-row-emphasized");
    emphasized = undefined;
  }

  function endEmphasis(event: AnimationEvent) {
    if (
      event.pseudoElement === "::before" &&
      event.target instanceof HTMLElement &&
      event.target.parentElement === emphasized &&
      event.target.matches("td[data-column-key]")
    )
      clearEmphasis();
  }

  function emphasize(row: HTMLTableRowElement) {
    clearEmphasis();
    emphasized = row;
    row.setAttribute("data-row-emphasized", "");
    row.addEventListener("animationend", endEmphasis);
  }

  function cancel() {
    generation++;
    clearEmphasis();
    for (const [animation, row] of animations) {
      row.removeAttribute("data-row-inserting");
      animation.cancel();
    }
    animations.clear();
  }

  function capture(from: number, to: number) {
    cancel();
    const scroll = container();
    if (!scroll?.animate || effectiveMotion.value === "off") return;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    const positions = new Map(
      visibleRows(scroll, start, end).map(({ index, top }) => [index, top]),
    );
    return { scroll, from, to, start, end, positions, generation };
  }

  async function play(
    before: ReturnType<typeof capture>,
    accepted: () => boolean,
  ) {
    if (!before) return;
    await nextTick();
    const { scroll, from, to, start, end, positions } = before;
    const motion = effectiveMotion.value;
    if (
      before.generation !== generation ||
      motion === "off" ||
      scroll !== container() ||
      !accepted()
    )
      return;

    const scale = scroll.currentCSSZoom || 1;
    const direction = Math.sign(to - from);
    for (const { index, row, top } of visibleRows(scroll, start, end)) {
      const inserted = index === to;
      const previous = positions.get(inserted ? from : index + direction);
      const offset =
        previous === undefined
          ? inserted
            ? direction * -Math.min(24, row.offsetHeight)
            : 0
          : (previous - top) / scale;
      if (Math.abs(offset) <= 0.5) {
        if (inserted) emphasize(row);
        continue;
      }
      if (inserted) row.setAttribute("data-row-inserting", "");
      const animation = row.animate(
        [
          { transform: `translateY(${offset}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: inserted ? (motion === "full" ? 400 : 340) : 260,
          easing: "cubic-bezier(.25,.55,.35,1)",
        },
      );
      animations.set(animation, row);
      const finish = () => {
        if (!animations.delete(animation)) return false;
        row.removeAttribute("data-row-inserting");
        return true;
      };
      animation.oncancel = finish;
      animation.onfinish = () => {
        if (finish() && inserted && accepted() && row.isConnected)
          emphasize(row);
      };
    }
  }

  async function playVisibility(
    before: ReturnType<typeof capture>,
    revealed: (index: number) => boolean,
    accepted: () => boolean,
  ) {
    if (!before) return;
    await nextTick();
    const { scroll, positions } = before;
    const motion = effectiveMotion.value;
    if (
      before.generation !== generation ||
      motion === "off" ||
      scroll !== container() ||
      !accepted()
    )
      return;
    const scale = scroll.currentCSSZoom || 1;
    for (const { index, row, top } of visibleRows(scroll, 0, Infinity)) {
      const previous = positions.get(index);
      const fade = revealed(index);
      const offset = previous === undefined ? 0 : (previous - top) / scale;
      if (!fade && Math.abs(offset) <= 0.5) continue;
      const animation = row.animate(
        [
          { transform: `translateY(${offset}px)`, ...(fade && { opacity: 0 }) },
          { transform: "translateY(0)", ...(fade && { opacity: 1 }) },
        ],
        { duration: motion === "full" ? 230 : 170, easing: "ease-out" },
      );
      animations.set(animation, row);
      animation.oncancel = animation.onfinish = () =>
        animations.delete(animation);
    }
  }

  watch(effectiveMotion, (mode) => {
    if (mode === "off") cancel();
  });
  onDeactivated(cancel);
  onBeforeUnmount(cancel);
  return { cancel, capture, play, playVisibility };
}
