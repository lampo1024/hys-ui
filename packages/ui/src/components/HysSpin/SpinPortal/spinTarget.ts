interface Hold {
  count: number;
  restore(): void;
}
const positions = new WeakMap<HTMLElement, Hold>();
const inert = new WeakMap<Element, Hold>();
const scrolling = new WeakMap<HTMLElement, Hold>();

function hold<K extends object>(
  entries: WeakMap<K, Hold>,
  key: K,
  acquire: () => () => void,
) {
  let entry = entries.get(key);
  if (!entry) {
    entry = { count: 0, restore: acquire() };
    entries.set(key, entry);
  }
  entry.count++;
  return () => {
    if (--entry.count) return;
    entry.restore();
    entries.delete(key);
  };
}

export function positionSpinTarget(target: HTMLElement | ShadowRoot) {
  const element = target instanceof HTMLElement ? target : target.host;
  if (!(element instanceof HTMLElement)) return () => {};
  return hold(positions, element, () => {
    const computedPosition = getComputedStyle(element).position;
    if (computedPosition && computedPosition !== "static") return () => {};
    const position = element.style.getPropertyValue("position");
    const priority = element.style.getPropertyPriority("position");
    element.style.setProperty("position", "relative");
    return () => {
      if (element.style.position === "relative")
        element.style.setProperty("position", position, priority);
    };
  });
}
export function lockSpinTargetScroll(target: HTMLElement | ShadowRoot) {
  const element = target instanceof HTMLElement ? target : target.host;
  if (!(element instanceof HTMLElement)) return () => {};
  return hold(scrolling, element, () => {
    const overflow = element.style.getPropertyValue("overflow");
    const priority = element.style.getPropertyPriority("overflow");
    element.style.setProperty("overflow", "hidden");
    return () => {
      if (element.style.overflow === "hidden")
        element.style.setProperty("overflow", overflow, priority);
    };
  });
}

export function blockSpinTarget(target: HTMLElement | ShadowRoot) {
  const children = new Map<Element, () => void>();
  const sync = () => {
    for (const [element, release] of children)
      if (element.parentNode !== target) {
        release();
        children.delete(element);
      }
    for (const element of target.children) {
      if (element.hasAttribute("data-hys-spin-portal") || children.has(element))
        continue;
      children.set(
        element,
        hold(inert, element, () => {
          const original = element.getAttribute("inert");
          element.setAttribute("inert", "");
          return () => {
            if (original === null) element.removeAttribute("inert");
            else element.setAttribute("inert", original);
          };
        }),
      );
    }
  };
  sync();
  const observer =
    typeof MutationObserver === "undefined"
      ? undefined
      : new MutationObserver(sync);
  observer?.observe(target, { childList: true });
  return () => {
    observer?.disconnect();
    for (const release of children.values()) release();
  };
}
