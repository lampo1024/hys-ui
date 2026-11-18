interface StackItem {
  corner: string;
  offset: number;
  height: number;
  triggerHeight: number;
  setOffset(offset: number, reserve: number): void;
}
const stacks = new WeakMap<HTMLElement | Document, StackItem[]>();

export function registerFloatButton(
  scope: HTMLElement | Document,
  element: HTMLElement,
  corner: string,
  offset: number,
  measureTrigger: () => number,
  setOffset: StackItem["setOffset"],
) {
  const group = stacks.get(scope) ?? [];
  stacks.set(scope, group);
  const item: StackItem = { corner, offset, setOffset, height: element.offsetHeight, triggerHeight: measureTrigger() };
  group.push(item);
  const layout = () => {
    const remaining = new Map<string, number>();
    for (const entry of group) {
      if (entry.height) remaining.set(entry.corner, (remaining.get(entry.corner) ?? 0) + entry.triggerHeight + 8);
    }
    const offsets = new Map<string, number>();
    for (const entry of group) {
      const offset = Math.max(entry.offset, offsets.get(entry.corner) ?? 0);
      const reserve = (remaining.get(entry.corner) ?? 0) - (entry.height ? entry.triggerHeight + 8 : 0);
      remaining.set(entry.corner, reserve);
      entry.setOffset(offset, reserve);
      if (entry.height) offsets.set(entry.corner, offset + entry.height + 8);
    }
  };
  const measure = () => {
    item.height = element.offsetHeight;
    item.triggerHeight = measureTrigger();
    layout();
  };
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
  observer?.observe(element);
  layout();
  return () => {
    observer?.disconnect();
    const at = group.indexOf(item);
    if (at >= 0) group.splice(at, 1);
    layout();
  };
}
