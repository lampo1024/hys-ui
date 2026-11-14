import { nextTick, onBeforeUnmount, onDeactivated, watch } from "vue";
import { useMotion } from "../../motion/useMotion";

const maxAnimatedCells = 160;

export function useGridColumnMotion(
  container: () => HTMLElement | null | undefined,
) {
  const { effectiveMotion } = useMotion();
  const animations = new Set<Animation>();
  let generation = 0;

  function cancel() {
    generation++;
    for (const animation of animations) animation.cancel();
    animations.clear();
  }

  function headers(scroll: HTMLElement) {
    return scroll.querySelectorAll<HTMLElement>(
      ":scope > table > thead th[data-column-key]",
    );
  }

  function capture() {
    cancel();
    const scroll = container();
    if (
      !scroll ||
      effectiveMotion.value === "off" ||
      typeof scroll.animate !== "function"
    )
      return;
    const positions = new Map<string, number>();
    for (const header of headers(scroll))
      positions.set(
        header.dataset.columnKey!,
        header.getBoundingClientRect().left,
      );
    return { scroll, positions, generation };
  }

  async function play(
    before: ReturnType<typeof capture>,
    formerKey: (key: string) => string = (key) => key,
    accepted: () => boolean = () => true,
    revealed?: (key: string) => boolean,
  ) {
    if (!before) return;
    await nextTick();
    const { scroll, positions } = before;
    const viewport = scroll.ownerDocument.defaultView;
    if (
      before.generation !== generation ||
      effectiveMotion.value === "off" ||
      !viewport ||
      scroll !== container() ||
      !accepted()
    )
      return;

    const bounds = scroll.getBoundingClientRect();
    const top = Math.max(0, bounds.top);
    const bottom = Math.min(viewport.innerHeight, bounds.bottom);
    const left = Math.max(0, bounds.left);
    const right = Math.min(viewport.innerWidth, bounds.right);
    if (top >= bottom || left >= right) return;
    const scale = scroll.currentCSSZoom || 1;
    const deltas = new Map<string, { offset: number; fade: boolean }>();
    for (const header of headers(scroll)) {
      const key = header.dataset.columnKey!;
      const previous = positions.get(formerKey(key));
      const fade = revealed?.(key) ?? false;
      if (previous === undefined && !fade) continue;
      const current = header.getBoundingClientRect();
      const delta = previous === undefined ? 0 : previous - current.left;
      if (
        current.right > left &&
        current.left < right &&
        (Math.abs(delta) > 0.5 || fade)
      )
        deltas.set(key, { offset: delta / scale, fade });
    }
    if (!deltas.size) return;

    const table = scroll.querySelector<HTMLTableElement>(":scope > table");
    if (!table) return;
    const cells: HTMLElement[] = [];
    function collect(rows: HTMLCollectionOf<HTMLTableRowElement>, start = 0) {
      for (let index = start; index < rows.length; index++) {
        const row = rows[index];
        const rect = row.getBoundingClientRect();
        if (rect.top >= bottom || cells.length >= maxAnimatedCells) break;
        if (rect.bottom <= top) continue;
        for (const cell of row.cells) {
          if (deltas.has(cell.dataset.columnKey ?? "")) cells.push(cell);
          if (cells.length >= maxAnimatedCells) break;
        }
      }
    }
    if (table.tHead) collect(table.tHead.rows);
    for (const { rows } of table.tBodies) {
      if (cells.length >= maxAnimatedCells) break;
      let start = 0;
      let end = rows.length;
      // A non-virtual table may have thousands of rows above the viewport.
      while (start < end) {
        const middle = Math.floor((start + end) / 2);
        if (rows[middle].getBoundingClientRect().bottom <= top)
          start = middle + 1;
        else end = middle;
      }
      collect(rows, start);
    }
    if (table.tFoot) collect(table.tFoot.rows);
    for (const cell of cells) {
      const { offset, fade } = deltas.get(cell.dataset.columnKey!)!;
      const animation = cell.animate(
        [
          { transform: `translateX(${offset}px)`, ...(fade && { opacity: 0 }) },
          { transform: "translateX(0)", ...(fade && { opacity: 1 }) },
        ],
        {
          duration: effectiveMotion.value === "full" ? 280 : 180,
          easing: "cubic-bezier(.2,.8,.2,1)",
        },
      );
      animations.add(animation);
      animation.onfinish = animation.oncancel = () =>
        animations.delete(animation);
    }
  }

  watch(effectiveMotion, (mode) => {
    if (mode === "off") cancel();
  });
  onDeactivated(cancel);
  onBeforeUnmount(cancel);
  return { cancel, capture, play };
}
