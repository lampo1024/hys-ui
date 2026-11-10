<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown } from "lucide-vue-next";
import HysColorPanel from "./HysColorPanel.vue";
import PopupMotion from "../../motion/PopupMotion";
import { useHysRootAttrs } from "../../config";
import { useColorPicker } from "../../composables/useColorPicker";
import {
  parseColor,
  colorCss,
  type HysColorPickerProps,
  type HysColorPickerSlots,
} from "../../composables/color";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysColorPickerProps>(), {
  modelValue: undefined,
  open: undefined,
  immediate: true,
  showInput: true,
  showPresets: true,
  showFooter: true,
  appendTo: "body",
  popupWidth: 288,
  placement: "bottom-start",
  validateEvent: true,
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:open": [open: boolean];
  change: [value: string];
  activeChange: [value: string];
  visibleChange: [open: boolean];
  confirm: [value: string];
  cancel: [];
  clear: [];
  invalid: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
defineSlots<HysColorPickerSlots>();
const skin = useHysRootAttrs(),
  state = useColorPicker(props, (name, ...args) =>
    (emit as any)(name, ...args),
  ),
  actualCss = computed(() => {
    const parsed = parseColor(state.value.value);
    return parsed ? colorCss(parsed) : "transparent";
  }),
  nativeKey = (key: string) =>
    key === "id" || key.startsWith("aria-") || key === "required",
  rootAttrs = computed(() =>
    Object.fromEntries(
      Object.entries(state.attrs).filter(([key]) => !nativeKey(key)),
    ),
  ),
  nativeAttrs = computed(() =>
    Object.fromEntries(
      Object.entries(state.attrs).filter(([key]) => nativeKey(key)),
    ),
  );
defineExpose({
  element: state.element,
  input: state.input,
  panel: state.panel,
  value: state.value,
  draft: state.draft,
  color: computed(() => ({ ...state.working.value })),
  open: state.open,
  focus: state.focus,
  blur: state.blur,
  show: state.show,
  hide: state.hide,
  confirm: state.confirm,
  cancel: state.cancel,
  clear: state.clear,
  setColor: state.setColor,
});
</script>
<template>
  <div
    :ref="(el) => (state.element.value = el as HTMLElement)"
    v-bind="{ ...skin, ...rootAttrs }"
    class="hys-ui-pf-color-picker"
    :class="[
      'hys-ui-color-picker-' + state.control.size.value,
      {
        'hys-ui-color-disabled': state.control.disabled.value,
        'hys-ui-color-focused': state.focused.value,
      },
    ]"
    :data-status="state.status.value"
    @focusin="state.focusIn"
    @focusout="state.focusOut"
  >
    <template v-if="!inline">
      <span
        v-if="$slots.trigger"
        :ref="(el) => (state.trigger.value = el as HTMLElement)"
        class="hys-ui-color-custom-trigger"
        tabindex="-1"
        ><slot name="trigger" v-bind="state.context.value"
      /></span>
      <div v-else class="hys-ui-pf-color-control">
        <button
          :ref="(el) => (state.trigger.value = el as HTMLElement)"
          type="button"
          class="hys-ui-pf-color-trigger"
          :id="
            !showInput
              ? (state.attrs.id as string) || state.field?.id.value
              : undefined
          "
          :aria-label="
            ariaLabel ||
            (state.attrs['aria-label'] as string) ||
            label ||
            state.field?.label.value ||
            '选择颜色'
          "
          aria-haspopup="dialog"
          :aria-controls="state.open.value ? state.panelId : undefined"
          :aria-expanded="state.open.value"
          :disabled="state.control.disabled.value"
          :tabindex="tabindex"
          @click="state.open.value ? state.hide() : state.show()"
        >
          <span class="hys-ui-pf-color-chip"
            ><span :style="{ background: actualCss }" /></span
          ><span v-if="showText" class="hys-ui-color-value">{{
            state.value.value || "选择颜色"
          }}</span
          ><ChevronDown :size="14" aria-hidden="true" />
        </button>
        <input
          v-if="showInput"
          :ref="(el) => (state.input.value = el as HTMLInputElement)"
          v-bind="{ ...inputProps, ...nativeAttrs }"
          class="hys-ui-pf-color-hex"
          :id="(state.attrs.id as string) || state.field?.id.value"
          data-hys-ui-field-managed
          :value="state.draft.value"
          :aria-label="
            ariaLabel ||
            (state.attrs['aria-label'] as string) ||
            (label
              ? label + ' 颜色值'
              : state.format.value === 'hex'
                ? '十六进制颜色'
                : '颜色值')
          "
          :aria-invalid="state.status.value === 'error' || undefined"
          :aria-describedby="
            [
              state.attrs['aria-describedby'],
              state.field?.describedBy.value,
              error ? state.errorId : undefined,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          "
          :disabled="state.control.disabled.value"
          :readonly="readonly"
          spellcheck="false"
          autocomplete="off"
          @input="state.draft.value = ($event.target as HTMLInputElement).value"
          @change="state.commitText"
          @keydown.enter.prevent="
            immediate === false ? state.confirm() : state.commitText()
          "
        />
      </div>
    </template>
    <small
      v-if="error || !state.valid.value"
      :id="state.errorId"
      class="hys-ui-pf-color-error"
      role="alert"
      >{{ error || "请输入有效的颜色值" }}</small
    >
    <HysColorPanel
      v-if="inline && state.live.value"
      :state="state"
      :options="props"
      ><template v-if="$slots.header" #header="scope"
        ><slot name="header" v-bind="scope" /></template
      ><template v-if="$slots.footer" #footer="scope"
        ><slot name="footer" v-bind="scope" /></template
      ><template v-if="$slots.preset" #preset="scope"
        ><slot name="preset" v-bind="scope" /></template
    ></HysColorPanel>
    <Teleport
      v-if="!inline && state.live.value"
      :to="state.teleportTo.value"
      :disabled="appendTo === false"
      ><PopupMotion
        :popup-transition="popupTransition"
        :popup-transition-duration="popupTransitionDuration"
        :placement="state.floating.placement.value"
        ><HysColorPanel
          v-if="state.floating.open.value"
          :state="state"
          :options="props"
          ><template v-if="$slots.header" #header="scope"
            ><slot name="header" v-bind="scope" /></template
          ><template v-if="$slots.footer" #footer="scope"
            ><slot name="footer" v-bind="scope" /></template
          ><template v-if="$slots.preset" #preset="scope"
            ><slot
              name="preset"
              v-bind="scope" /></template></HysColorPanel></PopupMotion
    ></Teleport>
    <input
      v-if="name && !state.control.disabled.value"
      type="hidden"
      :name="name"
      :form="form"
      :value="state.value.value"
    />
  </div>
</template>
<style scoped>
.hys-ui-pf-color-picker {
  width: 100%;
  min-width: 0;
  position: relative;
}
.hys-ui-pf-color-control {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 9px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  min-height: 38px;
  overflow: hidden;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-color-focused .hys-ui-pf-color-control {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 3px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 12%,
      transparent
    );
}
.hys-ui-pf-color-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 7px 10px;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  border: 0;
  border-right: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.hys-ui-pf-color-trigger:only-child {
  border-right: 0;
  flex: 1;
  justify-content: space-between;
}
.hys-ui-pf-color-chip {
  position: relative;
  width: 22px;
  height: 22px;
  flex: none;
  display: block;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1px #0002;
  background-color: white;
  background-image: conic-gradient(
    #d9dce3 25%,
    transparent 0 50%,
    #d9dce3 0 75%,
    transparent 0
  );
  background-size: 8px 8px;
  overflow: hidden;
}
.hys-ui-pf-color-chip > span {
  position: absolute;
  inset: 0;
}
.hys-ui-color-value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-ui-pf-color-hex {
  width: 100%;
  min-width: 0;
  border: 0 !important;
  background: transparent;
  color: inherit;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  box-shadow: none !important;
}
.hys-ui-pf-color-hex:focus-visible {
  outline: none;
}
.hys-ui-pf-color-trigger:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -3px;
}
.hys-ui-pf-color-error {
  display: block;
  margin-top: 6px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
}
.hys-ui-color-picker-sm .hys-ui-pf-color-control {
  min-height: 30px;
}
.hys-ui-color-picker-sm .hys-ui-pf-color-trigger {
  padding: 4px 8px;
}
.hys-ui-color-picker-sm .hys-ui-pf-color-chip {
  width: 18px;
  height: 18px;
}
.hys-ui-color-picker-sm .hys-ui-pf-color-hex {
  padding: 4px 8px;
  font-size: 12px;
}
.hys-ui-color-picker-lg .hys-ui-pf-color-control {
  min-height: 46px;
}
.hys-ui-color-picker-lg .hys-ui-pf-color-trigger {
  padding: 9px 12px;
}
.hys-ui-color-picker-lg .hys-ui-pf-color-chip {
  width: 26px;
  height: 26px;
}
.hys-ui-color-picker-lg .hys-ui-pf-color-hex {
  padding: 10px 14px;
  font-size: 15px;
}
.hys-ui-color-disabled {
  opacity: 0.5;
}
.hys-ui-color-disabled button {
  cursor: not-allowed;
}
.hys-ui-pf-color-picker[data-status="error"] .hys-ui-pf-color-control {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-pf-color-picker[data-status="warning"] .hys-ui-pf-color-control {
  border-color: var(--hys-ui-warning, #d9860c);
}
.hys-ui-color-custom-trigger {
  display: inline-flex;
  max-width: 100%;
  vertical-align: middle;
}
.hys-ui-color-custom-trigger:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
  border-radius: 6px;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-pf-color-control {
    transition: none;
  }
}
</style>
