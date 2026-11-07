/** Shared, deterministic overlay stack. Only the topmost layer responds to Escape. */
import { ref } from 'vue'
export type OverlayKind = 'floating' | 'dialog'
type Entry = { id: symbol; kind: OverlayKind; dismiss: () => void }
const stack: Entry[] = []
export const overlayCount = ref(0)
export function registerOverlay(kind: OverlayKind, dismiss: () => void) {
  const id = Symbol(kind)
  stack.push({ id, kind, dismiss }); overlayCount.value = stack.length
  return { id, isTop: () => stack.at(-1)?.id === id, unregister: () => {
    const i = stack.findIndex(item => item.id === id)
    if (i >= 0) stack.splice(i, 1)
    overlayCount.value = stack.length
  }}
}
let lockCount = 0
let originalOverflow = ''
export function lockBodyScroll() {
  if (lockCount++ === 0) { originalOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
  let released = false
  return () => { if (released) return; released = true; if (--lockCount === 0) document.body.style.overflow = originalOverflow }
}
