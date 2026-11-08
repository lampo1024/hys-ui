import { createApp, defineComponent, Fragment, getCurrentInstance, h, nextTick, onActivated, onDeactivated, onScopeDispose, render, shallowReactive, type CSSProperties, type VNodeChild } from 'vue'
import HysToast from '../components/HysToast/HysToast.vue'
import type { HysToastPosition, HysToastType } from '../components/HysToast/HysToast.vue'
import { provideHysConfig, useHysRootAttrs, type HysConfig, type HysMotion, type HysTheme } from '../config'

export interface HysToastOptions {
  id?: string
  message?: string
  content?: VNodeChild | (() => VNodeChild)
  type?: HysToastType
  duration?: number
  closable?: boolean
  position?: HysToastPosition
  offset?: number
  zIndex?: number
  showIcon?: boolean
  icon?: VNodeChild | (() => VNodeChild)
  plain?: boolean
  pauseOnHover?: boolean
  closeOnEscape?: boolean
  grouping?: boolean
  onClose?: () => void
  onAfterClose?: () => void
}
export interface HysToastConfig extends Omit<HysToastOptions, 'id' | 'message' | 'content' | 'icon' | 'onClose' | 'onAfterClose'> {
  maxCount?: number
  appendTo?: string | HTMLElement | ShadowRoot
}
export interface HysToastHandle {
  readonly id: string
  readonly closed: Promise<void>
  close(): void
  update(value: string | Omit<Partial<HysToastOptions>, 'id'>): void
}
export interface HysToastApi {
  show(value: string | HysToastOptions): HysToastHandle
  success(value: string | Omit<HysToastOptions, 'type'>): HysToastHandle
  info(value: string | Omit<HysToastOptions, 'type'>): HysToastHandle
  warning(value: string | Omit<HysToastOptions, 'type'>): HysToastHandle
  error(value: string | Omit<HysToastOptions, 'type'>): HysToastHandle
  loading(value: string | Omit<HysToastOptions, 'type'>): HysToastHandle
  closeAll(): void
}
export interface HysToastServiceConfig extends HysToastConfig, HysConfig {}
export interface HysToastService extends HysToastApi { dispose(): void }
type Instance = { close(): void; restart(): void }
interface Entry extends HysToastOptions {
  token: string
  id: string
  repeat: number
  closing: boolean
  finished: boolean
  resolve(): void
  handle: HysToastHandle
}
let sequence = 0
const normalize = (position: HysToastPosition = 'top-center') => position === 'top' ? 'top-center' : position === 'bottom' ? 'bottom-center' : position

/** Call during setup. Messages inherit the owner's theme and are removed when its scope leaves. */
export function useHysToast(config: HysToastConfig = {}): HysToastApi {
  const owner = getCurrentInstance()
  if (!owner) throw new Error('useHysToast must be called during component setup')
  const themeAttrs = useHysRootAttrs()
  const entries = shallowReactive<Entry[]>([]), instances = new Map<string, Instance>()
  let host: HTMLDivElement | undefined, active = true, destroyed = false
  const limit = Number.isFinite(config.maxCount) ? Math.max(1, Math.floor(config.maxCount!)) : 5
  const toOptions = (value: string | HysToastOptions): HysToastOptions => typeof value === 'string' ? { message: value } : value
  function notify(callback?: () => void) {
    try { callback?.() }
    catch (error) { try { if (owner!.appContext.config.errorHandler) owner!.appContext.config.errorHandler(error, owner!.proxy, 'HysToast callback'); else console.error(error) } catch (handlerError) { console.error(handlerError) } }
  }
  function finish(entry: Entry) {
    if (entry.finished) return
    entry.finished = true
    const index = entries.indexOf(entry)
    if (index >= 0) entries.splice(index, 1)
    instances.delete(entry.token)
    entry.resolve()
    notify(entry.onAfterClose)
    const current = host
    void nextTick(() => { if (current && current === host && !entries.length) { render(null, current); current.remove(); host = undefined } })
  }
  function close(entry: Entry) {
    if (entry.closing || entry.finished) return
    entry.closing = true
    try { notify(entry.onClose) }
    finally { const instance = instances.get(entry.token); if (instance) instance.close(); else finish(entry) }
  }
  function update(entry: Entry, value: string | Omit<Partial<HysToastOptions>, 'id'>) {
    if (entry.closing || entry.finished || destroyed) return
    const patch = toOptions(value)
    const oldType = entry.type
    Object.assign(entry, patch, { id: entry.id })
    if (patch.type && patch.type !== oldType && patch.duration === undefined) entry.duration = patch.type === 'loading' ? 0 : config.duration
    void nextTick(() => { if (!entry.closing) instances.get(entry.token)?.restart() })
  }
  function stackStyle(entry: Entry): CSSProperties {
    const position = normalize(entry.position), offset = Math.max(0, entry.offset ?? 24) + 'px'
    const style: CSSProperties = { position: 'fixed', width: 'max-content', display: 'flex', flexDirection: position.startsWith('bottom') ? 'column-reverse' : 'column', gap: '10px', alignItems: position.endsWith('left') ? 'flex-start' : position.endsWith('right') ? 'flex-end' : 'center', maxWidth: `calc(100vw - ${Math.max(16, entry.offset ?? 24) * 2}px)`, pointerEvents: 'none', zIndex: entry.zIndex ?? 2000 }
    if (position === 'center') Object.assign(style, { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' })
    else {
      if (position.startsWith('bottom')) style.bottom = `max(${offset},env(safe-area-inset-bottom))`
      else style.top = `max(${offset},env(safe-area-inset-top))`
      if (position.endsWith('left')) style.left = `max(${offset},env(safe-area-inset-left))`
      else if (position.endsWith('right')) style.right = `max(${offset},env(safe-area-inset-right))`
      else Object.assign(style, { left: '50%', transform: 'translateX(-50%)' })
    }
    return style
  }
  const Queue = defineComponent({
    name: 'HysToastQueue',
    setup() {
      provideHysConfig({ theme: () => themeAttrs.value['data-hys-theme'] as HysTheme, motion: () => themeAttrs.value['data-hys-motion'] as HysMotion })
      return () => {
        const groups = new Map<string, Entry[]>()
        for (const entry of entries) { const key = `${normalize(entry.position)}:${entry.offset ?? 24}:${entry.zIndex ?? 2000}`; const group = groups.get(key) || []; group.push(entry); groups.set(key, group) }
        return h(Fragment, [...groups].map(([key, group]) => h('div', { key, ...themeAttrs.value, class: 'hys-ui-toast-stack', style: stackStyle(group[0]) }, group.map(entry => h(HysToast, {
          key: entry.token, ref: (instance: unknown) => { if (instance) instances.set(entry.token, instance as Instance); else instances.delete(entry.token) },
          'data-toast-id': entry.id, message: entry.message, type: entry.type, duration: entry.duration, closable: entry.closable ?? true,
          showIcon: entry.showIcon ?? true, pauseOnHover: entry.pauseOnHover ?? true, closeOnEscape: entry.closeOnEscape,
          position: entry.position, offset: entry.offset, zIndex: entry.zIndex, plain: entry.plain, repeat: entry.repeat, teleport: false,
          onClose: () => close(entry), onAfterClose: () => finish(entry)
        }, {
          ...(entry.content !== undefined ? { default: () => typeof entry.content === 'function' ? entry.content() : entry.content } : {}),
          ...(entry.icon !== undefined ? { icon: () => typeof entry.icon === 'function' ? entry.icon() : entry.icon } : {})
        })))))
      }
    }
  })
  function ensureHost() {
    if (host) return
    const target = typeof config.appendTo === 'string' ? document.querySelector(config.appendTo) : config.appendTo ?? document.body
    if (!target) throw new Error('Toast appendTo target was not found')
    host = document.createElement('div'); host.dataset.hysToastHost = ''; target.appendChild(host)
    const vnode = h(Queue); vnode.appContext = owner!.appContext; render(vnode, host)
  }
  function show(value: string | HysToastOptions) {
    const requested = toOptions(value), options = { type: 'info' as HysToastType, ...config, ...requested }
    if (options.type === 'loading' && requested.duration === undefined) options.duration = 0
    const existing = entries.find(entry => !entry.closing && ((requested.id && entry.id === requested.id) || (options.grouping && requested.message && requested.content === undefined && entry.message === requested.message && entry.type === options.type && normalize(entry.position) === normalize(options.position))))
    if (existing) { if (!requested.id) existing.repeat++; update(existing, requested); return existing.handle }
    const token = 'hys-toast-' + ++sequence, id = requested.id ?? token
    let resolve!: () => void
    const closed = new Promise<void>(done => { resolve = done })
    const entry = shallowReactive({ ...options, token, id, repeat: 1, closing: false, finished: false, resolve } as Entry)
    entry.handle = { id, closed, close: () => close(entry), update: patch => update(entry, patch) }
    if (destroyed || !active || (!entry.message && (entry.content == null || entry.content === false || entry.content === ''))) { entry.finished = true; resolve(); return entry.handle }
    while (entries.filter(item => !item.closing).length >= limit) close(entries.find(item => !item.closing)!)
    ensureHost(); entries.push(entry)
    return entry.handle
  }
  function dispose() {
    for (const entry of [...entries]) { if (!entry.closing) { entry.closing = true; notify(entry.onClose) } finish(entry) }
    if (host) { render(null, host); host.remove(); host = undefined }
  }
  onDeactivated(() => { active = false; dispose() }); onActivated(() => { active = true })
  onScopeDispose(() => { destroyed = true; dispose() })
  const typed = (type: HysToastType) => (value: string | Omit<HysToastOptions, 'type'>) => show({ ...toOptions(value), type })
  return { show, success: typed('success'), info: typed('info'), warning: typed('warning'), error: typed('error'), loading: typed('loading'), closeAll: () => { for (const entry of [...entries]) close(entry) } }
}

/** Create a shared service for callers outside setup; dispose it when the owning application ends. */
export function createHysToast(config: HysToastServiceConfig = {}): HysToastService {
  let api!: HysToastApi, disposed = false
  const Bridge = defineComponent({ setup() { api = useHysToast(config); return () => null } })
  const app = createApp(defineComponent({ setup() { provideHysConfig(config); return () => h(Bridge) } }))
  app.mount(document.createElement('div'))
  return { ...api, dispose() { if (!disposed) { disposed = true; app.unmount() } } }
}
