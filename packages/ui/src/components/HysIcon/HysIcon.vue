<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
  type VNodeChild,
} from "vue";
import { useHysRootAttrs } from "../../config";
import { usePageVisibility } from "../../composables/usePageVisibility";
import IconGraphic from "./IconGraphic/IconGraphic.vue";
import IconReferenceGraphic from "./IconReferenceGraphic/IconReferenceGraphic.vue";
import IconTooltip from "./IconTooltip/IconTooltip.vue";
import { useIconConfig } from "./iconConfig";
import { hysIconRegistry } from "./iconRegistry";
import { iconAssetUrl } from "./iconSafety";
import { iconLength, iconNumber, iconStyle } from "./iconStyle";
import type {
  HysIconContext,
  HysIconLayer,
  HysIconProps,
  HysIconReference,
  HysIconSource,
} from "./iconTypes";
import { useIconResource } from "./useIconResource";

const IconPicker = defineAsyncComponent(
  () => import("./IconPickerPanel/IconPickerPanel.vue"),
);
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysIconProps>(), {
  flipX: undefined,
  flipY: undefined,
  directional: undefined,
  animated: undefined,
  paused: undefined,
  decorative: undefined,
  clickable: undefined,
  disabled: undefined,
  readonly: undefined,
  active: undefined,
  selected: undefined,
  picker: undefined,
  allowUpload: undefined,
  fallback: undefined,
  loadingIcon: undefined,
  badge: undefined,
});
const emit = defineEmits<{
  "update:name": [name: string];
  "update:selected": [selected: boolean];
  change: [context: HysIconContext];
  statusChange: [status: string, previous: string];
  load: [context: HysIconContext, event?: Event];
  error: [error: unknown, context: HysIconContext];
  click: [event: MouseEvent];
  dblclick: [event: MouseEvent];
  mouseenter: [event: MouseEvent];
  mouseleave: [event: MouseEvent];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  keydown: [event: KeyboardEvent];
}>();
defineSlots<{
  default?: (context: HysIconContext) => VNodeChild;
  icon?: (context: HysIconContext) => VNodeChild;
  loading?: (context: HysIconContext) => VNodeChild;
  fallback?: (context: HysIconContext) => VNodeChild;
  badge?: (context: HysIconContext) => VNodeChild;
}>();
const scope = useIconConfig(),
  skin = useHysRootAttrs(),
  attrs = useAttrs();
const options = computed<HysIconProps>(() => ({
  ...scope.defaults.value,
  ...Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ),
}));
const registry = computed(() => options.value.registry ?? scope.registry.value);
const name = ref(options.value.name),
  element = ref<HTMLElement>(),
  mounted = ref(false);
watch(
  () => options.value.name,
  (value) => {
    name.value = value;
  },
);
const status = computed(() => options.value.status ?? "default");
const variant = computed(() => options.value.variant ?? "outline");
const stateIcons: Record<string, string> = {
  loading: "loader",
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
};
const reference = computed(() => {
  const custom = options.value.statusIcons;
  const current = status.value;
  return (
    (custom && Object.hasOwn(custom, current) ? custom[current] : undefined) ??
    (Object.hasOwn(stateIcons, current) ? stateIcons[current] : undefined) ??
    options.value.source ??
    name.value
  );
});
const origins = () => options.value.allowedOrigins;
const main = useIconResource({
  reference: () => reference.value,
  registry: () => registry.value,
  variant: () => variant.value,
  allowedOrigins: origins,
});
const fallback = useIconResource({
  reference: () =>
    main.error.value && options.value.fallback !== false
      ? (options.value.fallback ?? "help")
      : undefined,
  registry: () => registry.value,
  variant: () => variant.value,
  allowedOrigins: origins,
});
const loading = useIconResource({
  reference: () =>
    main.loading.value && options.value.loadingIcon !== false
      ? (options.value.loadingIcon ?? "loader")
      : undefined,
  registry: () => registry.value,
  variant: () => variant.value,
  allowedOrigins: origins,
});
const brokenFallback = ref(false);
watch(
  [
    reference,
    variant,
    registry,
    () => registry.value.revision.value,
    () => options.value.fallback,
  ],
  () => {
    brokenFallback.value = false;
  },
);
const graphic = computed(() => {
  if (main.source.value) return main.source.value;
  if (main.loading.value && options.value.loadingIcon !== false)
    return loading.source.value ?? hysIconRegistry.get("loader");
  if (main.error.value && options.value.fallback !== false) {
    return (
      (!brokenFallback.value ? fallback.source.value : undefined) ??
      hysIconRegistry.get("help")
    );
  }
});
const context = computed<HysIconContext>(() => ({
  name: name.value,
  variant: variant.value,
  status: status.value,
  loading: main.loading.value || status.value === "loading",
  source: main.source.value,
}));
const isLink = computed(() => options.value.href !== undefined);
const interactive = computed(() => isLink.value || options.value.clickable);
const href = computed(() =>
  options.value.href
    ? (iconAssetUrl(options.value.href, undefined, true) ??
      iconAssetUrl(options.value.href))
    : undefined,
);
const blocked = computed(
  () =>
    !!(
      options.value.disabled ||
      options.value.readonly ||
      (isLink.value && !href.value)
    ),
);
const tag = computed(() =>
  isLink.value ? "a" : options.value.clickable ? "button" : "span",
);
const label = computed(
  () =>
    options.value.label ??
    options.value.tooltip ??
    (interactive.value || options.value.decorative === false
      ? [
          main.record.value?.label ?? name.value ?? "图标",
          typeof options.value.badge === "number"
            ? options.value.badge + " 条通知"
            : "",
        ]
          .filter(Boolean)
          .join("，")
      : undefined),
);
const animation = computed(
  () =>
    options.value.animation ??
    (status.value === "loading" || main.loading.value ? "loading" : "none"),
);
const trigger = computed(() => options.value.animateOn ?? "always");
const pageHidden = usePageVisibility();
const systemDark = ref(false);
let media: MediaQueryList | undefined;
const syncScheme = () => {
  systemDark.value = !!media?.matches;
};
watch([() => options.value.theme, mounted], ([theme, ready]) => {
  media?.removeEventListener("change", syncScheme);
  media = undefined;
  if (theme !== "system" || !ready || typeof window.matchMedia !== "function")
    return;
  media = window.matchMedia("(prefers-color-scheme: dark)");
  syncScheme();
  media.addEventListener("change", syncScheme);
});
onBeforeUnmount(() => media?.removeEventListener("change", syncScheme));
const appearance = computed(() => ({
  ...skin.value,
  "data-hys-theme":
    options.value.theme === "system"
      ? systemDark.value
        ? "dark"
        : "blue"
      : (options.value.theme ?? skin.value["data-hys-theme"]),
}));
const paused = ref(false),
  stopped = ref(false),
  played = ref(false),
  revision = ref(0);
const style = computed(() =>
  iconStyle(
    options.value,
    animation.value,
    paused.value || !!options.value.paused || pageHidden.value,
  ),
);
const directional = computed(
  () => options.value.directional ?? main.record.value?.directional ?? false,
);
const layers = computed<HysIconLayer[]>(() => [
  ...(options.value.secondary
    ? [{ icon: options.value.secondary, size: "52%", x: "32%", y: "28%" }]
    : []),
  ...(options.value.layers ?? []),
]);
const badge = computed(() => {
  const value = options.value.badge;
  const max = iconNumber(options.value.badgeMax, 99, 1, 9999);
  return typeof value === "number" && value > max
    ? max + "+"
    : value === true
      ? ""
      : value;
});
function play() {
  played.value = true;
  stopped.value = paused.value = false;
  revision.value++;
}
function select(value: string) {
  name.value = value;
  emit("update:name", value);
}
function click(event: MouseEvent) {
  if (!interactive.value || blocked.value) {
    if (blocked.value) event.preventDefault();
    return;
  }
  if (trigger.value === "click") play();
  if (options.value.selected !== undefined)
    emit("update:selected", !options.value.selected);
  emit("click", event);
}
function loaded(event?: Event) {
  emit("load", context.value, event);
}
function failed(event: Event) {
  if (graphic.value === main.source.value) main.fail(event);
  else brokenFallback.value = true;
}
watch([name, variant, status], () => emit("change", context.value));
watch(status, (value, previous) => {
  emit("statusChange", value, previous);
  if (trigger.value === "state") play();
});
watch(
  [() => main.source.value, mounted],
  ([source, active]) => {
    if (active && source && source.type !== "image") loaded();
  },
  { flush: "post" },
);
watch(
  [() => main.error.value, mounted],
  ([error, active]) => {
    if (active && error) emit("error", error, context.value);
  },
  { flush: "post" },
);
onMounted(() => {
  mounted.value = true;
  if (trigger.value === "state" && status.value !== "default") play();
});
defineExpose({
  element,
  focus: () => element.value?.focus(),
  select,
  reload: main.reload,
  preload: (names: readonly string[]) =>
    registry.value.preload(names, variant.value, options.value.allowedOrigins),
  play,
  restart: play,
  pause: () => {
    paused.value = true;
  },
  resume: () => {
    paused.value = stopped.value = false;
  },
  stop: () => {
    stopped.value = true;
  },
});
</script>

<template>
  <IconPicker
    v-if="options.picker"
    v-bind="{ ...appearance, ...attrs }"
    :name="name"
    :registry="registry"
    :variant="variant"
    :allow-upload="options.allowUpload"
    :allowed-origins="options.allowedOrigins"
    :storage-key="options.storageKey"
    :locale="options.pickerLocale"
    @select="select"
  />
  <IconTooltip v-else :text="options.tooltip">
    <component
      :is="tag"
      ref="element"
      v-bind="{ ...appearance, ...attrs }"
      class="hys-ui-icon"
      :style="[style, attrs.style]"
      :type="tag === 'button' ? 'button' : undefined"
      :disabled="(tag === 'button' && !!options.disabled) || undefined"
      :href="isLink && !blocked ? href : undefined"
      :tabindex="
        isLink && blocked
          ? options.readonly && !options.disabled && href
            ? 0
            : -1
          : attrs.tabindex
      "
      :target="isLink ? options.target : undefined"
      :rel="
        isLink
          ? (options.rel ??
            (options.target === '_blank' ? 'noopener noreferrer' : undefined))
          : undefined
      "
      :role="
        tag === 'span' && label && !options.decorative && !$slots.default
          ? 'img'
          : isLink && blocked
            ? 'link'
            : undefined
      "
      :aria-hidden="
        (!interactive && !$slots.default && (options.decorative || !label)) ||
        undefined
      "
      :aria-label="interactive || !options.decorative ? label : undefined"
      :aria-disabled="(interactive && blocked) || undefined"
      :aria-pressed="tag === 'button' ? options.selected : undefined"
      :aria-busy="(context.loading && !!(interactive || label)) || undefined"
      :data-status="status"
      :data-active="options.active || options.selected || undefined"
      :data-align="options.align"
      :data-directional="directional || undefined"
      :data-animation="animation"
      :data-trigger="trigger"
      :data-played="played || undefined"
      :data-off="stopped || options.animated === false || undefined"
      @click="click"
      @dblclick="interactive && !blocked && emit('dblclick', $event)"
      @mouseenter="emit('mouseenter', $event)"
      @mouseleave="emit('mouseleave', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
      @keydown="emit('keydown', $event)"
    >
      <span class="hys-icon-box" aria-hidden="true">
        <span class="hys-icon-orientation">
          <Transition
            name="hys-icon-change"
            mode="out-in"
            :css="trigger === 'state' && options.animated !== false"
          >
            <span :key="revision" class="hys-icon-motion">
              <slot
                v-if="main.loading.value && $slots.loading"
                name="loading"
                v-bind="context"
              />
              <slot
                v-else-if="main.error.value && $slots.fallback"
                name="fallback"
                v-bind="context"
              />
              <slot v-else name="icon" v-bind="context">
                <IconGraphic
                  v-if="graphic"
                  :key="graphic.type === 'image' ? graphic.src : graphic.type"
                  :source="graphic"
                  :variant="variant"
                  :fill="options.fill"
                  :stroke="options.stroke"
                  :stroke-width="options.strokeWidth"
                  :fit="options.fit"
                  :gradient="options.gradient"
                  :allowed-origins="options.allowedOrigins"
                  :morph-to="
                    animation === 'morph' ? options.morphTo : undefined
                  "
                  :draw="animation === 'draw'"
                  @load="graphic === main.source.value && loaded($event)"
                  @error="failed"
                />
                <span v-else-if="main.error.value && options.fallback !== false"
                  >?</span
                >
              </slot>
            </span>
          </Transition>
          <span
            v-for="(layer, index) in layers"
            :key="index"
            class="hys-icon-layer"
            :style="{
              color: layer.color,
              '--hys-icon-layer-size': iconLength(layer.size) ?? '65%',
              '--hys-icon-layer-x': iconLength(layer.x) ?? '0px',
              '--hys-icon-layer-y': iconLength(layer.y) ?? '0px',
              '--hys-icon-layer-angle': (layer.rotate ?? 0) + 'deg',
            }"
          >
            <IconReferenceGraphic
              :icon="layer.icon"
              :registry="registry"
              :variant="variant"
              :allowed-origins="options.allowedOrigins"
            />
          </span>
        </span>
        <span
          v-if="$slots.badge || (badge !== undefined && badge !== false)"
          class="hys-icon-badge"
          :data-position="options.badgePosition ?? 'top-end'"
          :data-dot="(options.badge === true && !$slots.badge) || undefined"
        >
          <slot name="badge" v-bind="context">{{ badge }}</slot>
        </span>
      </span>
      <slot v-bind="context" />
    </component>
  </IconTooltip>
</template>

<style src="./icon.css"></style>
