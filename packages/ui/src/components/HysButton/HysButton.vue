<script setup lang="ts">
import {
  computed, Fragment, h, inject, onActivated, onBeforeUnmount, onDeactivated,
  onMounted, ref, shallowRef, Text, toValue, watch,
  type Component, type ComponentPublicInstance, type FunctionalComponent, type VNode,
} from 'vue'
import {LoaderCircle} from 'lucide-vue-next'
import {useHysConfig, useHysRootAttrs} from '../../config'
import {useHysControlState} from '../../composables/formContext'
import { useChoiceModel } from '../../composables/choiceModel'
import { buttonGroupKey, buttonSize, buttonVariant } from '../../composables/buttonGroup'
import { colorRgb, parseColor } from '../../composables/color'

export type HysButtonPaletteColor =
  'slate' | 'blue' | 'indigo' | 'purple' | 'cyan' | 'teal' |
  'green' | 'lime' | 'amber' | 'orange' | 'red' | 'pink'
export type HysButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'info' |
  'text' | 'link' | HysButtonPaletteColor
export type HysButtonAppearance = HysButtonVariant | 'default' | ''
export type HysButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'default' | 'large' | ''
export interface HysButtonActionContext {
  signal: AbortSignal
  event: MouseEvent
  pressed: boolean
}
export type HysButtonAction = (context: HysButtonActionContext) => unknown
export type HysButtonActionGuard = (context: HysButtonActionContext) => boolean | void | Promise<boolean | void>
export interface HysButtonInstance {
  readonly element?: HTMLElement
  readonly ref?: HTMLElement
  readonly busy: boolean
  readonly disabled: boolean
  readonly size: 'sm' | 'md' | 'lg'
  readonly type: HysButtonVariant
  readonly shouldAddSpace: boolean
  focus: () => void
  blur: () => void
  cancelAction: () => void
}
export interface HysButtonProps {
  /** 语义外观或内置配色，例如 teal、indigo 和 amber。 */
  variant?: HysButtonVariant
  size?: HysButtonSize
  disabled?: boolean
  /** 延迟显示加载图标时，按钮仍会立即阻止重复操作。 */
  loading?: boolean | { delay: number }
  loadingIcon?: string | Component
  loadingText?: string
  /** 执行期间锁定按钮并接管默认点击行为，组件停用或销毁时取消。 */
  action?: HysButtonAction
  /** 返回 false 时取消操作，支持异步检查。 */
  beforeAction?: HysButtonActionGuard
  actionLoadingDelay?: number
  toggle?: boolean
  /** 受控按下状态，配合 v-model:pressed 使用。 */
  pressed?: boolean
  defaultPressed?: boolean
  plain?: boolean
  round?: boolean
  circle?: boolean
  shape?: 'default' | 'round' | 'circle'
  block?: boolean
  dashed?: boolean
  color?: string
  /** 使用深色背景下的配色计算。默认跟随当前主题。 */
  dark?: boolean
  danger?: boolean
  ghost?: boolean
  text?: boolean
  link?: boolean
  /** 为文字按钮显示背景。 */
  bg?: boolean
  /** 文案恰好是两个汉字时显示字间距。 */
  autoInsertSpace?: boolean
  /** 自定义根标签或组件，href 默认使用原生链接。 */
  tag?: string | Component
  icon?: string | Component
  iconPosition?: 'left' | 'right'
  /** 外观类型，也兼容原有 button、submit、reset 原生类型。 */
  type?: HysButtonAppearance | 'button' | 'submit' | 'reset'
  nativeType?: 'button' | 'submit' | 'reset'
  href?: string
  target?: string
  rel?: string
  autofocus?: boolean
  focusable?: boolean
  ariaLabel?: string
}
const props = withDefaults(defineProps<HysButtonProps>(), {
  iconPosition: 'left', focusable: true, autoInsertSpace: undefined, pressed: undefined, dark: undefined,
})
const slots = defineSlots<{
  default?: () => VNode[]
  icon?: () => VNode[]
  loading?: () => VNode[]
  suffix?: () => VNode[]
}>()
const emit = defineEmits<{
  click: [event: MouseEvent]
  'update:pressed': [value: boolean]
  pressedChange: [value: boolean]
  actionSuccess: [result: unknown, context: HysButtonActionContext]
  actionError: [error: unknown, context: HysButtonActionContext]
}>()
const group = inject(buttonGroupKey, undefined)
const { disabled: controlDisabled, size: controlSize } = useHysControlState({
  get disabled() { return props.disabled || group?.disabled.value },
  get size() { return buttonSize(props.size) ?? group?.size.value },
})
const variant = computed(() => props.variant ?? buttonVariant(props.type) ?? group?.variant.value ?? 'primary')
const appearance = computed(() => props.link ? 'link' : props.text ? 'text' : variant.value)
const htmlType = computed(() => props.nativeType ?? (props.type === 'submit' || props.type === 'reset' ? props.type : 'button'))
const config = useHysConfig()
const dark = computed(() => props.dark ?? (toValue(config.theme) === 'dark'))
const hysRootAttrs = useHysRootAttrs()
const buttonTag = computed(() => props.tag ?? (props.href ? 'a' : 'button'))
const nativeButton = computed(() => buttonTag.value === 'button')
const isLinkTag = computed(() => buttonTag.value === 'a' || (!!props.href && typeof buttonTag.value !== 'string'))
const root = shallowRef<HTMLElement | ComponentPublicInstance>()
const element = computed<HTMLElement | undefined>(() => {
  const node = root.value
  const dom = node && '$el' in node ? node.$el : node
  return typeof HTMLElement !== 'undefined' && dom instanceof HTMLElement ? dom : undefined
})
const activeAction = shallowRef<AbortController>()
const press = useChoiceModel({ get modelValue() { return props.pressed } }, () => !!props.defaultPressed)
const pressable = computed(() => props.toggle || props.pressed !== undefined)
const busy = computed(() => !!props.loading || !!activeAction.value)
const locked = computed(() => controlDisabled.value || busy.value)
const delay = computed(() => {
  const value = typeof props.loading === 'object' ? props.loading.delay :
    props.loading ? 0 : props.actionLoadingDelay
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(30000, value)) : 0
})
const spinner = ref(busy.value && delay.value === 0)
let timer: ReturnType<typeof setTimeout> | undefined
let mounted = false
function stop() {
  clearTimeout(timer)
  timer = undefined
}
function syncSpinner() {
  stop()
  if (!busy.value || delay.value === 0) {
    spinner.value = busy.value
  } else if (mounted && !spinner.value) {
    timer = setTimeout(() => { spinner.value = true }, delay.value)
  }
}
watch([busy, delay], syncSpinner, { flush: 'sync' })
onMounted(() => { mounted = true; syncSpinner() })
onActivated(() => { mounted = true; syncSpinner() })
function cancelAction() {
  const controller = activeAction.value
  activeAction.value = undefined
  controller?.abort()
}
function detach() { mounted = false; cancelAction(); stop() }
onBeforeUnmount(detach)
onDeactivated(detach)

const colors: Partial<Record<HysButtonVariant, string>> = {
  danger: '#ed4556', success: '#16a46e', warning: '#d9860c', info: '#697b97',
}
const palette = {
  slate:  { light: '#475569', dark: '#a5b4c7' },
  blue:   { light: '#1d4ed8', dark: '#7cb2ff' },
  indigo: { light: '#4338ca', dark: '#a5aaff' },
  purple: { light: '#7e22ce', dark: '#c4a1ff' },
  cyan:   { light: '#0e7490', dark: '#67d7ee' },
  teal:   { light: '#0f766e', dark: '#5eead4' },
  green:  { light: '#15803d', dark: '#86efac' },
  lime:   { light: '#4d7c0f', dark: '#b5df59' },
  amber:  { light: '#b45309', dark: '#ffca68' },
  orange: { light: '#c2410c', dark: '#ffab79' },
  red:    { light: '#b91c1c', dark: '#ff9090' },
  pink:   { light: '#be185d', dark: '#f6a1cf' },
} satisfies Record<HysButtonPaletteColor, { light: string; dark: string }>
const paletteTone = computed(() => {
  if (props.color || props.danger || !Object.hasOwn(palette, variant.value)) return
  return palette[variant.value as HysButtonPaletteColor][dark.value ? 'dark' : 'light']
})
const tone = computed(() => props.color || paletteTone.value
  || (props.danger ? colors.danger : colors[variant.value])
  || 'var(--hys-ui-primary,var(--hys-ui-theme-primary))')
const foreground = computed(() => {
  const color = parseColor(props.color || paletteTone.value)
  if (!color) return
  const [r, g, b] = colorRgb(color).map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.179 ? '#141414' : '#fff'
})
const autoSpace = computed(() => (props.autoInsertSpace ?? toValue(config.buttonAutoInsertSpace) ?? false)
  && appearance.value !== 'text' && appearance.value !== 'link')
const shouldAddSpace = ref(false)

function textContent(nodes: VNode[]): string | undefined {
  let text = ''
  for (const node of nodes) {
    if (node.type === Text && typeof node.children === 'string') text += node.children
    else if (node.type === Fragment && Array.isArray(node.children)) {
      const fragment = textContent(node.children as VNode[])
      if (fragment === undefined) return
      text += fragment
    } else return
  }
  return text
}
const ButtonLabel: FunctionalComponent<{ hidden?: boolean }> = ({ hidden }) => {
  const nodes = slots.default?.() ?? []
  const label = autoSpace.value ? textContent(nodes)?.trim() : undefined
  const spaced = !!label && /^\p{Unified_Ideograph}{2}$/u.test(label)
  shouldAddSpace.value = spaced
  if (hidden) return null
  return spaced ? h('span', { class: 'hys-ui-button-spaced' }, label) : nodes
}

function togglePressed() {
  if (pressable.value) {
    return press.commit(!press.current.value, (value) => emit('update:pressed', value), (value) => emit('pressedChange', value))
  }
}
async function execute(action: HysButtonAction, event: MouseEvent) {
  const controller = new AbortController()
  const context = { signal: controller.signal, event, pressed: press.current.value }
  activeAction.value = controller
  try {
    if (props.beforeAction && (await props.beforeAction(context)) === false) return
    if (controller.signal.aborted) return
    const result = await action(context)
    if (controller.signal.aborted) return
    await togglePressed()
    if (!controller.signal.aborted) emit('actionSuccess', result, context)
  } catch (error) {
    if (!controller.signal.aborted) emit('actionError', error, context)
  } finally {
    if (activeAction.value === controller) activeAction.value = undefined
  }
}
watch(controlDisabled, (value) => { if (value) cancelAction() }, { flush: 'sync' })
function click(event: MouseEvent) {
  if (locked.value) {
    event.preventDefault()
    event.stopImmediatePropagation()
    return
  }
  emit('click', event)
  if (event.defaultPrevented) return
  if (props.action) {
    event.preventDefault()
    void execute(props.action, event)
  } else void togglePressed()
}
function key(event: KeyboardEvent, release: boolean) {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement) || event.target !== target || event.isComposing
    || event.defaultPrevented || target.localName === 'button'
    || (target.localName === 'a' && target.hasAttribute('href'))) return
  const space = event.key === ' ' && !isLinkTag.value
  if (!space && event.key !== 'Enter') return
  event.preventDefault()
  if (!locked.value && !event.repeat && (space ? release : !release)) target.click()
}
defineExpose({
  element, ref: element, busy, disabled: locked, size: controlSize, type: variant, shouldAddSpace, cancelAction,
  focus: () => element.value?.focus(), blur: () => element.value?.blur(),
})
</script>
<template>
 <component
  :is="buttonTag"
  ref="root"
  v-bind="hysRootAttrs"
  class="hys-ui-btn"
  :class="['hys-ui-btn-'+controlSize, 'hys-ui-button-'+appearance, {
    'hys-ui-button-plain': plain, 'hys-ui-button-round': round || shape === 'round',
    'hys-ui-button-circle': circle || shape === 'circle', 'hys-ui-button-block': block,
    'hys-ui-button-dashed': dashed, 'hys-ui-button-locked': locked,
    'hys-ui-button-danger-tone': danger, 'hys-ui-button-outline-ghost': ghost,
    'hys-ui-button-text-bg': bg && appearance === 'text',
    'hys-ui-button-palette': paletteTone,
    'hys-ui-button-palette-dark': paletteTone && dark,
    'hys-ui-button-custom-color': color, 'hys-ui-button-custom-dark': color && dark,
  }]"
  :style="{
    '--hys-ui-button-color': tone,
    '--hys-ui-button-foreground': foreground,
    '--hys-ui-button-palette-shade': paletteTone && foreground === '#141414' ? '#fff' : undefined,
  }"
  :type="nativeButton ? htmlType : undefined"
  :href="isLinkTag && !locked ? href : undefined"
  :role="isLinkTag ? 'link' : nativeButton ? undefined : 'button'"
  :target="isLinkTag && href ? target : undefined"
  :rel="isLinkTag && href ? (rel || (target === '_blank' ? 'noopener noreferrer' : undefined)) : undefined"
  :disabled="nativeButton ? locked : undefined"
  :aria-disabled="locked || undefined"
  :aria-busy="busy || undefined"
  :aria-pressed="pressable ? press.current.value : undefined"
  :aria-label="ariaLabel"
  :tabindex="locked || !focusable ? -1 : !nativeButton && (!isLinkTag || !href) ? 0 : undefined"
  :autofocus="autofocus"
  @click="click"
  @keydown="key($event, false)"
  @keyup="key($event, true)"
 >
  <span v-if="spinner" class="hys-ui-button-icon">
    <slot name="loading">
      <component v-if="loadingIcon" :is="loadingIcon" :size="16" aria-hidden="true" />
      <LoaderCircle v-else class="hys-ui-button-spinner" :size="16" aria-hidden="true" />
    </slot>
  </span>
  <span v-else-if="(icon||$slots.icon)&&iconPosition==='left'" class="hys-ui-button-icon"><slot name="icon"><component :is="icon" :size="16" aria-hidden="true"/></slot></span>
  <span v-if="spinner && loadingText">{{ loadingText }}</span>
  <ButtonLabel :hidden="spinner && !!loadingText" />
  <span v-if="!spinner&&(icon||$slots.icon)&&iconPosition==='right'" class="hys-ui-button-icon"><slot name="icon"><component :is="icon" :size="16" aria-hidden="true"/></slot></span><slot name="suffix"/>
 </component>
</template>
<style scoped>
.hys-ui-btn{position:relative;display:inline-flex;gap:7px;align-items:center;justify-content:center;vertical-align:middle;text-decoration:none;line-height:1.4;border:1px solid var(--hys-ui-button-color);background:var(--hys-ui-button-color);color:var(--hys-ui-button-foreground,#fff);border-radius:8px;font-weight:550;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s}
.hys-ui-btn{--hys-ui-button-hover:color-mix(in srgb,var(--hys-ui-button-color) 85%,#fff);--hys-ui-button-active:color-mix(in srgb,var(--hys-ui-button-color) 85%,#141414)}
.hys-ui-button-custom-dark{--hys-ui-button-hover:color-mix(in srgb,var(--hys-ui-button-color) 78%,#141414);--hys-ui-button-active:color-mix(in srgb,var(--hys-ui-button-color) 80%,#fff);--hys-ui-button-soft-surface:#141414}
.hys-ui-btn:not(.hys-ui-button-locked):hover{background:var(--hys-ui-button-hover);border-color:var(--hys-ui-button-hover)}.hys-ui-btn:not(.hys-ui-button-locked):active{background:var(--hys-ui-button-active)}.hys-ui-btn:focus-visible{outline:2px solid color-mix(in srgb,var(--hys-ui-button-color) 45%,transparent);outline-offset:3px}
.hys-ui-btn-sm{min-height:30px;padding:6px 11px;font-size:12px}.hys-ui-btn-md{min-height:38px;padding:9px 16px;font-size:13px}.hys-ui-btn-lg{min-height:44px;padding:11px 20px;font-size:15px}
.hys-ui-button-secondary{background:var(--hys-ui-surface,var(--hys-ui-theme-surface));border-color:var(--hys-ui-border,var(--hys-ui-theme-border));color:var(--hys-ui-text,var(--hys-ui-theme-text))}.hys-ui-button-ghost,.hys-ui-button-text,.hys-ui-button-link{background:transparent;border-color:transparent;color:var(--hys-ui-button-color)}.hys-ui-button-plain{background:color-mix(in srgb,var(--hys-ui-button-color) 8%,var(--hys-ui-surface,var(--hys-ui-theme-surface)));color:var(--hys-ui-button-color);border-color:color-mix(in srgb,var(--hys-ui-button-color) 40%,transparent)}
.hys-ui-button-secondary:not(.hys-ui-button-locked):hover,.hys-ui-button-ghost:not(.hys-ui-button-locked):hover,.hys-ui-button-text:not(.hys-ui-button-locked):hover,.hys-ui-button-link:not(.hys-ui-button-locked):hover,.hys-ui-button-plain:not(.hys-ui-button-locked):hover{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-button-color)}
.hys-ui-button-link{padding-inline:0;min-height:unset}.hys-ui-button-link:hover{text-decoration:underline}.hys-ui-button-round{border-radius:999px}.hys-ui-button-circle{border-radius:50%;aspect-ratio:1;padding:8px}.hys-ui-button-block{display:flex;width:100%}.hys-ui-button-dashed{border-style:dashed}.hys-ui-button-locked{cursor:not-allowed;opacity:.55}.hys-ui-button-icon{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}.hys-ui-button-spinner{animation:hys-ui-button-spin .9s linear infinite}@keyframes hys-ui-button-spin{to{transform:rotate(360deg)}}
.hys-ui-button-secondary:is(.hys-ui-button-danger-tone,.hys-ui-button-custom-color) { color: var(--hys-ui-button-color); border-color: var(--hys-ui-button-color); }
.hys-ui-button-text-bg { background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt)); }
.hys-ui-button-custom-color.hys-ui-button-text-bg,
.hys-ui-button-custom-color.hys-ui-button-plain {
  background: color-mix(in srgb, var(--hys-ui-button-color) 10%, var(--hys-ui-button-soft-surface, var(--hys-ui-surface, var(--hys-ui-theme-surface))));
}
.hys-ui-button-custom-color:is(.hys-ui-button-text,.hys-ui-button-link):not(.hys-ui-button-locked):hover {
  color: var(--hys-ui-button-hover);
  background: transparent;
  border-color: transparent;
}
.hys-ui-button-custom-color.hys-ui-button-text-bg:not(.hys-ui-button-locked):hover {
  background: color-mix(in srgb, var(--hys-ui-button-color) 17%, var(--hys-ui-button-soft-surface, var(--hys-ui-surface, var(--hys-ui-theme-surface))));
}
.hys-ui-button-custom-color.hys-ui-button-plain:not(.hys-ui-button-locked):hover {
  background: var(--hys-ui-button-color);
  border-color: var(--hys-ui-button-color);
  color: var(--hys-ui-button-foreground,#fff);
}
.hys-ui-button-outline-ghost { background: transparent; border-color: var(--hys-ui-button-color); color: var(--hys-ui-button-color); }
.hys-ui-button-outline-ghost:not(.hys-ui-button-locked):is(:hover,:active) {
  background: color-mix(in srgb, var(--hys-ui-button-color) 12%, transparent);
  border-color: var(--hys-ui-button-color);
}
.hys-ui-button-spaced { letter-spacing: 0.22em; text-indent: 0.22em; }
.hys-ui-btn[aria-pressed="true"]:is(.hys-ui-button-secondary,.hys-ui-button-ghost,.hys-ui-button-text) {
  background: color-mix(in srgb, var(--hys-ui-button-color) 12%, var(--hys-ui-surface, var(--hys-ui-theme-surface)));
  color: var(--hys-ui-button-color);
  border-color: color-mix(in srgb, var(--hys-ui-button-color) 40%, transparent);
}
.hys-ui-button-palette {
  --hys-ui-palette-surface: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  --hys-ui-palette-text: var(--hys-ui-text, var(--hys-ui-theme-text, #27344b));
  --hys-ui-palette-ink: color-mix(in srgb, var(--hys-ui-button-color) 82%, var(--hys-ui-palette-text));
  --hys-ui-palette-tint: color-mix(in srgb, var(--hys-ui-button-color) 10%, var(--hys-ui-palette-surface));
  --hys-ui-palette-tint-hover: color-mix(in srgb, var(--hys-ui-button-color) 17%, var(--hys-ui-palette-surface));
  --hys-ui-button-hover: color-mix(in srgb, var(--hys-ui-button-color) 89%, var(--hys-ui-button-palette-shade, #141414));
  --hys-ui-button-active: color-mix(in srgb, var(--hys-ui-button-color) 78%, var(--hys-ui-button-palette-shade, #141414));
}
.hys-ui-button-palette-dark {
  --hys-ui-palette-surface: #141414;
  --hys-ui-palette-text: #e2e8f0;
}
.hys-ui-button-palette:is(.hys-ui-button-plain,.hys-ui-button-text,.hys-ui-button-link,.hys-ui-button-outline-ghost) {
  color: var(--hys-ui-palette-ink);
}
.hys-ui-button-palette:is(.hys-ui-button-plain,.hys-ui-button-text-bg) {
  background: var(--hys-ui-palette-tint);
}
.hys-ui-button-palette:is(.hys-ui-button-plain,.hys-ui-button-text,.hys-ui-button-outline-ghost):not(.hys-ui-button-locked):is(:hover,:active) {
  background: var(--hys-ui-palette-tint-hover);
  color: var(--hys-ui-palette-ink);
}
.hys-ui-button-palette.hys-ui-button-link:not(.hys-ui-button-locked):is(:hover,:active) {
  background: transparent;
  border-color: transparent;
  color: var(--hys-ui-palette-ink);
}
.hys-ui-btn[data-hys-motion="off"] .hys-ui-button-spinner { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .hys-ui-btn { transition: none; }
  .hys-ui-button-spinner { animation: none; }
}
</style>
