const entries: {
  close: (event: KeyboardEvent) => void;
  element: () => HTMLElement | undefined;
}[] = [];
function key(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const focused = document.activeElement;
  let entry = entries.at(-1);
  for (let index = entries.length - 1; index >= 0; index--) {
    if (!entries[index].element()?.contains(focused)) continue;
    entry = entries[index];
    break;
  }
  if (entry) {
    event.preventDefault();
    entry.close(event);
  }
}
export function registerToastEscape(
  close: (event: KeyboardEvent) => void,
  element: () => HTMLElement | undefined,
) {
  if (typeof document === "undefined") return;
  const entry = { close, element };
  if (!entries.length) document.addEventListener("keydown", key);
  entries.push(entry);
  return () => {
    const index = entries.indexOf(entry);
    if (index >= 0) entries.splice(index, 1);
    if (!entries.length) document.removeEventListener("keydown", key);
  };
}
