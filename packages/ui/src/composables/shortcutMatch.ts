/** Match a scoped keyboard shortcut such as Alt+S or Mod+Enter. */
export function shortcutMatches(event: KeyboardEvent, shortcut?: string) {
  if (!shortcut || event.defaultPrevented || event.repeat || event.isComposing) return false;
  const [key, ...modifiers] = shortcut.toLowerCase().split("+").map(part => part.trim()).reverse();
  if (!key || key !== event.key.toLowerCase()) return false;
  const mod = modifiers.includes("mod");
  return event.altKey === modifiers.includes("alt") &&
    event.shiftKey === modifiers.includes("shift") &&
    (mod ? event.ctrlKey !== event.metaKey : event.ctrlKey === modifiers.includes("ctrl") && event.metaKey === modifiers.includes("meta"));
}
