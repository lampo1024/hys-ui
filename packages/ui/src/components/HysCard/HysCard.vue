<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useId,
  type CSSProperties,
} from "vue";
import { Maximize2, Minimize2 } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysSkeleton from "../HysSkeleton/HysSkeleton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import { useCardFullscreen } from "./useCardFullscreen";
export interface HysCardTab {
  label: string;
  value: string | number;
  disabled?: boolean;
}
const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    footer?: string;
    loading?: boolean;
    loadingText?: string;
    keepContentOnLoading?: boolean;
    bordered?: boolean;
    shadow?: "always" | "hover" | "never";
    bodyStyle?: CSSProperties;
    headerStyle?: CSSProperties;
    footerStyle?: CSSProperties;
    bodyClass?: string;
    headerClass?: string;
    footerClass?: string;
    size?: "sm" | "md" | "lg";
    hoverable?: boolean;
    type?: "default" | "inner";
    tabs?: readonly HysCardTab[];
    activeTab?: string | number;
    defaultActiveTab?: string | number;
    tabsLabel?: string;
    collapsible?: boolean;
    collapsed?: boolean;
    defaultCollapsed?: boolean;
    collapseLabel?: string;
    expandLabel?: string;
    fullscreenable?: boolean;
    fullscreen?: boolean;
    defaultFullscreen?: boolean;
    fullscreenTransition?: boolean;
    fullscreenLabel?: string;
    exitFullscreenLabel?: string;
  }>(),
  {
    bordered: true,
    shadow: "never",
    size: "md",
    type: "default",
    loadingText: "加载中",
    tabsLabel: "卡片页签",
    collapsed: undefined,
    defaultCollapsed: false,
    collapseLabel: "收起卡片内容",
    expandLabel: "展开卡片内容",
    fullscreen: undefined,
    defaultFullscreen: false,
    fullscreenTransition: true,
    fullscreenLabel: "全屏查看卡片",
    exitFullscreenLabel: "退出卡片全屏",
  },
);
const emit = defineEmits<{
  "update:activeTab": [value: string | number];
  tabChange: [value: string | number];
  "update:collapsed": [collapsed: boolean];
  collapseChange: [collapsed: boolean];
  "update:fullscreen": [fullscreen: boolean];
  fullscreenChange: [fullscreen: boolean];
}>();
const attrs = useHysRootAttrs(),
  id = useId(),
  nav = ref<HTMLElement>(),
  element = ref<HTMLElement>(),
  local = ref(props.defaultActiveTab);
const localCollapsed = ref(props.defaultCollapsed);
const folded = computed(() => !!props.collapsible && (props.collapsed ?? localCollapsed.value));
const bodyId = id + "-fold";
const titleId = id + "-title";
const fullscreenHint = ref<InstanceType<typeof HysTooltip>>();
const { fullscreen: isFullscreen, placeholder, zIndex, setFullscreen } = useCardFullscreen(
  element,
  props,
  fullscreenHint,
  () => attrs.value["data-hys-motion"] !== "off",
  (value) => emit("update:fullscreen", value),
  (value) => emit("fullscreenChange", value),
);
const fullscreenAction = computed(() => isFullscreen.value ? props.exitFullscreenLabel : props.fullscreenLabel);
const toggleFullscreen = () => setFullscreen(!isFullscreen.value);
function toggleCollapse() {
  const next = !folded.value;
  localCollapsed.value = next;
  emit("update:collapsed", next);
  emit("collapseChange", next);
}
const enabled = computed(
  () => props.tabs?.filter((tab) => !tab.disabled) ?? [],
);
const current = computed(
  () =>
    props.activeTab ??
    (enabled.value.some((tab) => tab.value === local.value)
      ? local.value
      : enabled.value[0]?.value),
);
const index = computed(
  () => props.tabs?.findIndex((tab) => tab.value === current.value) ?? -1,
);
let live = true,
  ticket = 0;
async function select(value: string | number) {
  if (
    !live ||
    props.loading ||
    value === current.value ||
    !enabled.value.some((tab) => tab.value === value)
  )
    return;
  const request = ++ticket;
  local.value = value;
  emit("update:activeTab", value);
  await nextTick();
  if (live && request === ticket && current.value === value)
    emit("tabChange", value);
}
function keys(event: KeyboardEvent) {
  const rtl = nav.value && getComputedStyle(nav.value).direction === "rtl",
    forward = rtl ? "ArrowLeft" : "ArrowRight",
    back = rtl ? "ArrowRight" : "ArrowLeft";
  if (
    props.loading ||
    ![forward, back, "Home", "End"].includes(event.key) ||
    !enabled.value.length
  )
    return;
  event.preventDefault();
  const at = enabled.value.findIndex((tab) => tab.value === current.value),
    next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? enabled.value.length - 1
          : (at + (event.key === forward ? 1 : -1) + enabled.value.length) %
            enabled.value.length;
  const tab = enabled.value[next];
  void select(tab.value);
  nav.value
    ?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")
    [next]?.focus();
}
function stop() {
  live = false;
  ticket++;
}
onDeactivated(stop);
onBeforeUnmount(stop);
onActivated(() => (live = true));
defineExpose({ element, activeTab: current, fullscreen: isFullscreen, setFullscreen, toggleFullscreen });
defineOptions({ inheritAttrs: false });
</script>
<template>
  <div v-if="isFullscreen" class="hys-ui-card-placeholder" :style="placeholder" aria-hidden="true" />
  <Teleport to="body" :disabled="!isFullscreen">
  <section
    ref="element"
    v-bind="isFullscreen ? {
      ...attrs,
      ...$attrs,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': ($attrs['aria-labelledby'] as string | undefined) ?? (!$slots.header && (title || $slots.title) ? titleId : undefined),
      'aria-label': ($attrs['aria-label'] as string | undefined) ?? ($slots.header || !(title || $slots.title) ? title || '卡片全屏' : undefined),
      tabindex: -1,
    } : { ...attrs, ...$attrs }"
    class="hys-ui-card"
    :class="[
      'hys-ui-card-shadow-' + shadow,
      'hys-ui-card-size-' + size,
      {
        'hys-ui-card-hoverable': hoverable,
        'hys-ui-card-inner': type === 'inner',
        'hys-ui-card-borderless': !bordered,
        'hys-ui-card-fullscreen': isFullscreen,
      },
    ]"
    :aria-busy="loading || undefined"
    :style="isFullscreen ? { zIndex } : undefined"
  >
    <div v-if="$slots.cover" class="hys-ui-card-cover">
      <slot name="cover" />
    </div>
    <header
      v-if="title || subtitle || $slots.title || $slots.header || $slots.action || collapsible || fullscreenable || isFullscreen"
      class="hys-ui-card-head"
      :class="headerClass"
      :style="headerStyle"
    >
      <slot name="header"
        ><div class="hys-ui-card-heading">
          <h3 v-if="title || $slots.title" :id="titleId">
            <slot name="title">{{ title }}</slot>
          </h3>
          <p v-if="subtitle" class="hys-ui-muted hys-ui-small">
            {{ subtitle }}
          </p>
        </div></slot
      >
      <div v-if="$slots.action || collapsible || fullscreenable || isFullscreen" class="hys-ui-card-extra">
        <slot name="action" />
        <button v-if="collapsible" type="button" class="hys-ui-card-fold-button"
          :aria-expanded="!folded" :aria-controls="bodyId" @click="toggleCollapse">
          <slot name="collapse-toggle" :collapsed="folded">{{ folded ? expandLabel : collapseLabel }}</slot>
        </button>
        <HysTooltip
          v-if="fullscreenable || isFullscreen"
          ref="fullscreenHint"
          :text="fullscreenAction"
          :show-delay="600"
          :trigger-keys="[]"
        >
          <HysButton
            data-card-fullscreen-toggle
            size="sm"
            variant="ghost"
            :icon="isFullscreen ? Minimize2 : Maximize2"
            :aria-label="fullscreenAction"
            @click="toggleFullscreen"
          />
        </HysTooltip>
      </div>
    </header>
    <div :id="bodyId" v-show="!folded" class="hys-ui-card-fold">
    <div v-if="tabs?.length" class="hys-ui-card-tabs-row">
      <div
        ref="nav"
        class="hys-ui-card-tabs hys-ui-scrollbar"
        role="tablist"
        :aria-label="tabsLabel"
        @keydown="keys"
      >
        <button
          v-for="(tab, i) in tabs"
          :id="id + '-tab-' + i"
          :key="typeof tab.value + ':' + tab.value"
          type="button"
          role="tab"
          :aria-selected="current === tab.value"
          :aria-controls="id + '-body'"
          :tabindex="
            current === tab.value ||
            (index < 0 && enabled[0]?.value === tab.value)
              ? 0
              : -1
          "
          :disabled="loading || tab.disabled"
          @click="select(tab.value)"
        >
          <slot name="tab" :tab="tab" :active="current === tab.value">{{
            tab.label
          }}</slot>
        </button>
      </div>
      <div v-if="$slots['tab-extra']" class="hys-ui-card-extra">
        <slot name="tab-extra" />
      </div>
    </div>
    <div
      :id="id + '-body'"
      class="hys-ui-card-content"
      :class="[bodyClass, { 'hys-ui-scrollbar': isFullscreen }]"
      :style="isFullscreen ? [bodyStyle, { height: 'auto', maxHeight: 'none' }] : bodyStyle"
      :role="tabs?.length ? 'tabpanel' : undefined"
      :aria-labelledby="
        tabs?.length && index >= 0 ? id + '-tab-' + index : undefined
      "
      :tabindex="tabs?.length ? 0 : undefined"
      :aria-busy="loading"
    >
      <div v-if="keepContentOnLoading" class="hys-card-refresh" :inert="loading || undefined">
        <slot :active-tab="current" />
      </div>
      <div v-if="loading && keepContentOnLoading" class="hys-card-refresh-overlay">
        <slot name="loading"><HysSkeleton :loading-text="loadingText" :lines="3" /></slot>
      </div>
      <slot v-else-if="loading" name="loading"><HysSkeleton :loading-text="loadingText" :lines="3" /></slot>
      <slot v-else-if="!keepContentOnLoading" :active-tab="current" />
    </div>
    <div v-if="$slots.actions" class="hys-ui-card-actions">
      <slot name="actions" />
    </div>
    <footer
      v-if="footer || $slots.footer"
      class="hys-ui-card-foot"
      :class="footerClass"
      :style="footerStyle"
    >
      <slot name="footer">{{ footer }}</slot>
    </footer>
    </div>
  </section>
  </Teleport>
</template>
<style scoped>
.hys-ui-card {
  color: var(--hys-ui-text, var(--hys-ui-theme-text, #27344b));
  box-shadow: none;
}
.hys-ui-card-fold {
  display: contents;
}
.hys-ui-card-placeholder {
  box-sizing: border-box;
  max-inline-size: 100%;
  pointer-events: none;
}
.hys-ui-card.hys-ui-card-fullscreen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  inline-size: 100%;
  block-size: 100%;
  inline-size: 100dvi !important;
  block-size: 100dvb !important;
  max-inline-size: none !important;
  max-block-size: none !important;
  min-inline-size: 0;
  min-block-size: 0;
  margin: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.hys-ui-card[data-card-fullscreen-motion="leave"] {
  position: relative;
  z-index: 1;
}
.hys-ui-card-fullscreen > .hys-ui-card-head {
  padding-block-end: 12px;
}
.hys-ui-card-fullscreen > .hys-ui-card-cover {
  max-block-size: 25%;
  border-radius: 0;
}
.hys-ui-card-fullscreen > .hys-ui-card-fold > .hys-ui-card-content {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
.hys-ui-card-fullscreen > .hys-ui-card-head,
.hys-ui-card-fullscreen > .hys-ui-card-fold > :is(.hys-ui-card-tabs-row, .hys-ui-card-actions, .hys-ui-card-foot) {
  flex: none;
}
.hys-ui-card-content:has(> .hys-card-refresh-overlay) {
  position: relative;
}
.hys-card-refresh-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  padding: inherit;
  background: color-mix(in srgb, var(--hys-ui-surface, var(--hys-ui-theme-surface)) 92%, transparent);
}
.hys-ui-card-fold-button {
  padding: 4px 8px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.hys-ui-card-fold-button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 2px;
}
.hys-ui-card-borderless {
  border: 0;
}
.hys-ui-card-shadow-always,
.hys-ui-card-shadow-hover:hover,
.hys-ui-card-hoverable:hover {
  box-shadow: 0 8px 24px #17274412;
}
.hys-ui-card-head {
  min-width: 0;
}
.hys-ui-card-heading {
  min-width: 0;
  flex: 1;
}
.hys-ui-card-heading h3 {
  margin: 0;
  overflow-wrap: anywhere;
}
.hys-ui-card-heading p {
  margin: 6px 0 0;
}
.hys-ui-card-extra {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hys-ui-card-cover {
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}
.hys-ui-card-cover :deep(img) {
  display: block;
  width: 100%;
  object-fit: cover;
}
.hys-ui-card-foot,
.hys-ui-card-actions {
  padding: 14px 20px;
  border-top: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ee));
}
.hys-ui-card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-evenly;
  gap: 12px;
}
.hys-ui-card-tabs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-inline: 21px;
  border-bottom: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ee));
}
.hys-ui-card-tabs {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1;
  min-width: 0;
  overflow: auto;
}
.hys-ui-card-tabs button {
  flex: none;
  white-space: nowrap;
  min-height: 42px;
  padding: 10px 2px 8px;
  border: 0;
  border-bottom: 2px solid transparent;
  font: inherit;
  font-size: 13px;
  background: transparent;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted, #778397));
  cursor: pointer;
}
.hys-ui-card-tabs button[aria-selected="true"] {
  border-bottom-color: var(
    --hys-ui-primary,
    var(--hys-ui-theme-primary, #3168f5)
  );
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary, #3168f5));
  font-weight: 600;
}
.hys-ui-card-tabs button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hys-ui-card-tabs button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary, #3168f5));
  outline-offset: -3px;
  border-radius: 4px;
}
.hys-ui-card-inner > .hys-ui-card-head {
  background: var(
    --hys-ui-surface-alt,
    var(--hys-ui-theme-surface-alt, #f6f8fc)
  );
  padding-block: 12px;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ee));
}
.hys-ui-card-size-sm .hys-ui-card-content,
.hys-ui-card-size-sm .hys-ui-card-head,
.hys-ui-card-size-sm .hys-ui-card-foot,
.hys-ui-card-size-sm .hys-ui-card-actions {
  padding: 12px;
}
.hys-ui-card-size-lg .hys-ui-card-content {
  padding: 28px;
}
@media (prefers-reduced-motion: no-preference) {
  .hys-ui-card {
    transition: box-shadow 0.18s ease;
  }
}
@media (max-width: 650px) {
  .hys-ui-card-tabs-row {
    padding-inline: 15px;
    gap: 8px;
  }
}
</style>
