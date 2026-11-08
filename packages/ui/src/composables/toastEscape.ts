const entries: { close: () => void }[] = []
function key(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  const last = entries.at(-1)
  if (last) { event.preventDefault(); last.close() }
}
export function registerToastEscape(close: () => void) {
  const entry = { close }
  if (!entries.length) document.addEventListener('keydown', key)
  entries.push(entry)
  return () => {
    const index = entries.indexOf(entry)
    if (index >= 0) entries.splice(index, 1)
    if (!entries.length) document.removeEventListener('keydown', key)
  }
}
