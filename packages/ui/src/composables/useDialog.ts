import { computed, ref, nextTick, watch, onActivated, onDeactivated, onBeforeUnmount, type Ref } from 'vue'
import { lockBodyScroll, registerOverlay } from './overlayManager'
const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
export function useDialog(open: Ref<boolean>, dialog: Ref<HTMLElement | undefined>, close: () => void) {
  const active=ref(true)
  const visible=computed(()=>open.value&&active.value)
  onActivated(()=>{active.value=true})
  onDeactivated(()=>{active.value=false;generation++;cleanup()})
  let previous: HTMLElement | null = null
  let dispose: (() => void) | undefined
  let top: (() => boolean) | undefined
  let generation = 0
  function candidates() {
    return Array.from(dialog.value?.querySelectorAll<HTMLElement>(focusable) ?? [])
      .filter(el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')
  }
  function key(e: KeyboardEvent) {
    if (!visible.value || !top?.() || !dialog.value) return
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return }
    if (e.key !== 'Tab') return
    const items = candidates()
    if (!items.length) { e.preventDefault(); dialog.value.focus(); return }
    const first = items[0], last = items[items.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.value || !dialog.value.contains(document.activeElement))) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && (document.activeElement === last || !dialog.value.contains(document.activeElement))) { e.preventDefault(); first.focus() }
  }
  function focusInside(e: FocusEvent) {
    if (!visible.value || !top?.() || !dialog.value) return
    if (e.target instanceof Node && !dialog.value.contains(e.target)) (candidates()[0] ?? dialog.value).focus()
  }
  function cleanup() { dispose?.(); dispose = undefined; top = undefined; document.removeEventListener('keydown', key, true); document.removeEventListener('focusin', focusInside, true) }
  watch(visible, async value => {
    const token = ++generation
    if (value) {
      cleanup()
      previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
      const unlock = lockBodyScroll()
      const entry = registerOverlay('dialog', close)
      top = entry.isTop
      dispose = () => { entry.unregister(); unlock() }
      document.addEventListener('keydown', key, true)
      document.addEventListener('focusin', focusInside, true)
      await nextTick()
      if (token === generation && visible.value) (dialog.value?.querySelector<HTMLElement>('[autofocus]') ?? candidates()[0] ?? dialog.value)?.focus()
    } else {
      const target = previous
      cleanup()
      await nextTick()
      if (token === generation && active.value && target?.isConnected) target.focus()
    }
  }, { immediate: true, flush: 'post' })
  onBeforeUnmount(() => { generation++; cleanup() })
  return {active}
}
