<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, ref, useAttrs, useSlots, watch } from 'vue'
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, X } from 'lucide-vue-next'
import { useHysRootAttrs } from '../../config'
import { registerToastEscape } from '../../composables/toastEscape'

export type HysToastType = 'success' | 'error' | 'info' | 'warning' | 'loading'
export type HysToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center' | 'top' | 'bottom'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  message?: string
  type?: HysToastType
  duration?: number
  closable?: boolean
  position?: HysToastPosition
  offset?: number
  zIndex?: number
  showIcon?: boolean
  pauseOnHover?: boolean
  closeOnEscape?: boolean
  repeat?: number
  plain?: boolean
  teleport?: boolean
  appendTo?: string | HTMLElement
}>(), { message: '', type: 'success', closable: true, position: 'top-center', offset: 24, zIndex: 2000, showIcon: true, pauseOnHover: true, repeat: 1, teleport: true, appendTo: 'body' })
const emit = defineEmits<{ close: []; afterClose: [] }>()
const attrs = useAttrs(), slots = useSlots(), hysRootAttrs = useHysRootAttrs()
const element = ref<HTMLElement>(), active = ref(true), visible = ref(false), hovered = ref(false), focusWithin = ref(false)
const placement = computed(() => props.position === 'top' ? 'top-center' : props.position === 'bottom' ? 'bottom-center' : props.position)
const duration = computed(() => Math.max(0, Number.isFinite(props.duration ?? 3000) ? props.duration ?? (props.type === 'loading' ? 0 : 3000) : 0))
const hasContent = computed(() => !!props.message || !!slots.default)
const icon = computed(() => ({ success: CircleCheck, error: CircleAlert, info: Info, warning: TriangleAlert, loading: LoaderCircle })[props.type])
let timer: ReturnType<typeof setTimeout> | undefined, unregisterEscape: (() => void) | undefined
let remaining = 0, started = 0, notified = false, mounted = true
function clearTimer() { clearTimeout(timer); timer = undefined }
function pause() {
  if (timer) remaining = Math.max(0, remaining - (Date.now() - started))
  clearTimer()
}
function resume() {
  clearTimer()
  if (!active.value || !visible.value || hovered.value || focusWithin.value || duration.value <= 0) return
  if (remaining <= 0) { close(); return }
  started = Date.now()
  timer = setTimeout(close, remaining)
}
function restart() { remaining = duration.value; resume() }
function close() {
  if (!visible.value) return
  pause(); visible.value = false
  if (!notified) { notified = true; emit('close') }
}
function afterClose() { if (!visible.value && active.value) emit('afterClose') }
watch(() => [props.message, duration.value, props.repeat] as const, (current, previous) => {
  if (current[0] || (!previous && slots.default)) { visible.value = true; notified = false; restart() }
  else if (!hasContent.value || previous?.[0]) close()
  else if (visible.value) restart()
}, { immediate: true })
watch(() => visible.value && active.value && props.closeOnEscape, enabled => {
  unregisterEscape?.(); unregisterEscape = enabled ? registerToastEscape(close) : undefined
}, { immediate: true })
onDeactivated(() => { active.value = false; pause() })
onActivated(() => { active.value = true; void nextTick(() => mounted && resume()) })
onBeforeUnmount(() => { mounted = false; pause(); unregisterEscape?.() })
defineExpose({ close, pause, resume, restart, element })
</script>

<template>
  <Teleport :to="appendTo" :disabled="!teleport">
    <Transition name="hys-ui-toast-motion" appear @after-leave="afterClose">
      <div v-if="visible && active" ref="element" v-bind="{ ...hysRootAttrs, ...attrs }" class="hys-ui-toast"
        :class="['hys-ui-toast-' + type, 'hys-ui-toast-position-' + placement, { 'hys-ui-toast-inline': !teleport, 'hys-ui-toast-plain': plain }]"
        :style="{ '--hys-ui-toast-offset': Math.max(0, offset) + 'px', zIndex }"
        :role="type === 'error' ? 'alert' : 'status'" :aria-live="type === 'error' ? 'assertive' : 'polite'" aria-atomic="true"
        @mouseenter="pauseOnHover && (hovered = true, pause())" @mouseleave="hovered = false; resume()"
        @focusin="focusWithin = true; pause()" @focusout="!element?.contains($event.relatedTarget as Node) && (focusWithin = false, resume())">
        <span v-if="showIcon" class="hys-ui-toast-icon" aria-hidden="true"><slot name="icon"><component :is="icon" :size="18" :class="{ 'hys-ui-toast-spinner': type === 'loading' }" /></slot></span>
        <div class="hys-ui-toast-message"><slot>{{ message }}</slot></div>
        <span v-if="repeat > 1" class="hys-ui-toast-repeat" :aria-label="'重复 ' + repeat + ' 次'">×{{ repeat }}</span>
        <span v-if="$slots.action" class="hys-ui-toast-action"><slot name="action" :close="close" /></span>
        <button v-if="closable" class="hys-ui-toast-close" type="button" aria-label="关闭提示" @click="close"><X :size="14" /></button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.hys-ui-toast{--hys-ui-toast-x:0px;--hys-ui-toast-y:0px;--hys-ui-toast-shift:-8px;inset:auto;width:max-content;max-width:calc(100vw - max(32px,calc(var(--hys-ui-toast-offset) + var(--hys-ui-toast-offset))));transform:translate(var(--hys-ui-toast-x),var(--hys-ui-toast-y));pointer-events:auto}
.hys-ui-toast-position-top-left,.hys-ui-toast-position-top-center,.hys-ui-toast-position-top-right{top:max(var(--hys-ui-toast-offset),env(safe-area-inset-top))}
.hys-ui-toast-position-bottom-left,.hys-ui-toast-position-bottom-center,.hys-ui-toast-position-bottom-right{bottom:max(var(--hys-ui-toast-offset),env(safe-area-inset-bottom));--hys-ui-toast-shift:8px}
.hys-ui-toast-position-top-left,.hys-ui-toast-position-bottom-left{left:max(var(--hys-ui-toast-offset),env(safe-area-inset-left))}
.hys-ui-toast-position-top-right,.hys-ui-toast-position-bottom-right{right:max(var(--hys-ui-toast-offset),env(safe-area-inset-right))}
.hys-ui-toast-position-top-center,.hys-ui-toast-position-bottom-center,.hys-ui-toast-position-center{left:50%;--hys-ui-toast-x:-50%}
.hys-ui-toast-position-center{top:50%;--hys-ui-toast-y:-50%;--hys-ui-toast-shift:0px}
.hys-ui-toast.hys-ui-toast-inline{position:relative;inset:auto;--hys-ui-toast-x:0px;--hys-ui-toast-y:0px;max-width:100%}
.hys-ui-toast-message{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}
.hys-ui-toast-icon{display:inline-flex;flex:none;color:var(--hys-ui-green,var(--hys-ui-theme-green))}
.hys-ui-toast-error .hys-ui-toast-icon{color:var(--hys-ui-red,var(--hys-ui-theme-red))}
.hys-ui-toast-warning .hys-ui-toast-icon{color:var(--hys-ui-orange,var(--hys-ui-theme-orange))}
.hys-ui-toast-info .hys-ui-toast-icon,.hys-ui-toast-loading .hys-ui-toast-icon{color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-toast-close{flex:none;align-self:center;border-radius:5px}.hys-ui-toast-close:hover{background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}.hys-ui-toast-close:focus-visible{outline:2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary));outline-offset:2px}
.hys-ui-toast-repeat{flex:none;border-radius:10px;background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-primary,var(--hys-ui-theme-primary));padding:1px 6px;font-size:11px}
.hys-ui-toast-action{display:inline-flex;flex:none;gap:6px}.hys-ui-toast-plain{background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}
.hys-ui-toast.hys-ui-toast-motion-enter-from,.hys-ui-toast.hys-ui-toast-motion-leave-to{opacity:0;transform:translate(var(--hys-ui-toast-x),var(--hys-ui-toast-y)) translateY(var(--hys-ui-toast-shift)) scale(.97)}
.hys-ui-toast-spinner{animation:hys-ui-toast-spin 1s linear infinite}@keyframes hys-ui-toast-spin{to{transform:rotate(360deg)}}
.hys-ui-toast[data-hys-motion="off"] .hys-ui-toast-spinner{animation:none}@media(prefers-reduced-motion:reduce){.hys-ui-toast-spinner{animation:none}}
</style>
