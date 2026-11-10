<script setup lang="ts">
import { computed, provide } from "vue";
import { Check } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import { useHysRootAttrs } from "../../config";
import { overlayOwnerKey } from "../../composables/overlayManager";
import type { useColorPicker } from "../../composables/useColorPicker";
import {
  colorRgb,
  sameColor,
  type HysColorPickerProps,
} from "../../composables/color";
const props = defineProps<{
    state: ReturnType<typeof useColorPicker>;
    options: HysColorPickerProps;
  }>(),
  skin = useHysRootAttrs();
provide(
  overlayOwnerKey,
  computed(() => !!props.state.open.value && props.state.live.value),
);
const opaque = computed(() => {
  const c = props.state.working.value;
  return (
    "rgb(" +
    colorRgb(c)
      .map((v) => Math.round(v * 255))
      .join(",") +
    ")"
  );
});
function checkColor(color: readonly number[]) {
  return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722 > 0.58
    ? "#172a4d"
    : "#fff";
}
</script>
<template>
  <div
    :id="state.panelId"
    :ref="(el) => (state.panel.value = el as HTMLElement)"
    v-bind="skin"
    class="hys-ui-v4-menu hys-ui-pf-color-panel hys-ui-color-panel"
    :class="[options.popupClass, { 'hys-ui-color-inline': options.inline }]"
    :style="
      options.inline
        ? {
            ...options.popupStyle,
            width:
              typeof options.popupWidth === 'number'
                ? options.popupWidth + 'px'
                : options.popupWidth,
          }
        : { ...options.popupStyle, ...state.floating.style.value }
    "
    :role="options.inline ? 'group' : 'dialog'"
    :aria-label="options.ariaLabel || options.label || '选择颜色'"
    :aria-disabled="state.control.disabled.value || undefined"
    @focusin="state.focusIn"
    @focusout="state.focusOut"
  >
    <header>
      <slot name="header" v-bind="state.context.value"
        ><strong>选择颜色</strong
        ><code>{{
          state.hasColor.value ? state.serialized.value : "未选择"
        }}</code></slot
      >
    </header>
    <div
      class="hys-ui-pf-color-palette"
      role="slider"
      :tabindex="state.locked.value ? -1 : 0"
      aria-label="饱和度与亮度"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(state.working.value.s * 100)"
      :aria-valuetext="
        '饱和度 ' +
        Math.round(state.working.value.s * 100) +
        '%，亮度 ' +
        Math.round(state.working.value.v * 100) +
        '%'
      "
      :aria-disabled="state.locked.value || undefined"
      :style="{
        backgroundColor: 'hsl(' + state.working.value.h + ',100%,50%)',
      }"
      @pointerdown="state.start($event, 'palette')"
      @pointermove="state.move"
      @pointerup="state.end"
      @pointercancel="state.pointerCancel"
      @lostpointercapture="state.pointerCancel"
      @keydown="state.keyboard($event, 'palette')"
    >
      <span
        class="hys-ui-pf-color-cursor"
        :style="{
          left: state.working.value.s * 100 + '%',
          top: (1 - state.working.value.v) * 100 + '%',
          background: opaque,
        }"
      />
    </div>
    <div
      class="hys-ui-pf-color-hue"
      role="slider"
      :tabindex="state.locked.value ? -1 : 0"
      aria-label="色相"
      aria-valuemin="0"
      aria-valuemax="359"
      :aria-valuenow="Math.round(state.working.value.h)"
      :aria-disabled="state.locked.value || undefined"
      @pointerdown="state.start($event, 'hue')"
      @pointermove="state.move"
      @pointerup="state.end"
      @pointercancel="state.pointerCancel"
      @lostpointercapture="state.pointerCancel"
      @keydown="state.keyboard($event, 'hue')"
    >
      <span :style="{ left: (state.working.value.h / 359) * 100 + '%' }" />
    </div>
    <div
      v-if="options.showAlpha"
      class="hys-ui-color-alpha"
      role="slider"
      :tabindex="state.locked.value ? -1 : 0"
      aria-label="透明度"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(state.working.value.a * 100)"
      :aria-valuetext="Math.round(state.working.value.a * 100) + '%'"
      :aria-disabled="state.locked.value || undefined"
      @pointerdown="state.start($event, 'alpha')"
      @pointermove="state.move"
      @pointerup="state.end"
      @pointercancel="state.pointerCancel"
      @lostpointercapture="state.pointerCancel"
      @keydown="state.keyboard($event, 'alpha')"
    >
      <div
        :style="{
          background: 'linear-gradient(to right,transparent,' + opaque + ')',
        }"
      />
      <span :style="{ left: state.working.value.a * 100 + '%' }" />
    </div>
    <div
      v-if="options.showPresets !== false && state.presets.value.length"
      class="hys-ui-pf-color-presets"
      role="group"
      aria-label="常用颜色"
    >
      <button
        v-for="preset in state.presets.value"
        :key="preset.key"
        type="button"
        :disabled="state.locked.value"
        :aria-label="preset.value"
        :aria-pressed="
          state.hasColor.value && sameColor(preset.parsed, state.working.value)
        "
        @click="state.setColor(preset.value)"
      >
        <span
          class="hys-ui-color-preset-fill"
          :style="{ background: preset.color }"
        /><slot
          name="preset"
          :value="preset.value"
          :color="preset.color"
          :selected="
            state.hasColor.value &&
            sameColor(preset.parsed, state.working.value)
          "
          :disabled="state.locked.value"
          ><Check
            v-if="
              state.hasColor.value &&
              sameColor(preset.parsed, state.working.value)
            "
            :size="13"
            :style="{ color: checkColor(colorRgb(preset.parsed)) }"
            aria-hidden="true"
        /></slot>
      </button>
    </div>
    <input
      v-if="options.showInput !== false"
      class="hys-ui-color-panel-input"
      :value="state.draft.value"
      :disabled="state.control.disabled.value"
      :readonly="options.readonly"
      aria-label="面板颜色值"
      :aria-invalid="!state.valid.value || undefined"
      spellcheck="false"
      autocomplete="off"
      @input="state.draft.value = ($event.target as HTMLInputElement).value"
      @change="state.commitText"
      @keydown.enter.prevent="state.confirm"
    />
    <small v-if="!state.valid.value" class="hys-ui-pf-color-error" role="alert"
      >请输入有效的颜色值</small
    >
    <footer v-if="options.showFooter !== false">
      <slot name="footer" v-bind="state.context.value"
        ><HysButton
          v-if="options.clearable"
          class="hys-ui-color-clear"
          variant="ghost"
          size="sm"
          :disabled="
            state.locked.value || (!state.value.value && !state.hasColor.value)
          "
          @click="state.clear"
          >{{ options.clearText || "清空" }}</HysButton
        ><span class="hys-ui-color-footer-spacer" /><HysButton
          v-if="options.immediate === false && !options.inline"
          variant="ghost"
          size="sm"
          @click="state.cancel"
          >{{ options.cancelText || "取消" }}</HysButton
        ><HysButton
          size="sm"
          :disabled="state.locked.value || !state.valid.value"
          @click="state.confirm"
          >{{
            options.confirmText ||
            (options.immediate === false ? "确认" : "完成")
          }}</HysButton
        ></slot
      >
    </footer>
  </div>
</template>
<style scoped>
.hys-ui-color-panel.hys-ui-v4-menu {
  box-sizing: border-box;
  width: 288px;
  max-width: 100%;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 12px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font-size: 13px;
  line-height: 1.5;
}
.hys-ui-color-panel.hys-ui-color-inline {
  position: relative !important;
  max-width: 100%;
  box-shadow: none;
  margin: 0;
  left: auto !important;
  top: auto !important;
}
.hys-ui-color-panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  min-width: 0;
}
.hys-ui-color-panel header strong {
  flex: none;
  font-weight: 600;
}
.hys-ui-color-panel code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 11px;
}
.hys-ui-pf-color-palette {
  height: 162px;
  position: relative;
  border-radius: 8px;
  background-image:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent);
  touch-action: none;
  cursor: crosshair;
}
.hys-ui-pf-color-cursor {
  position: absolute;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  transform: translate(-50%, -50%);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #0006;
  pointer-events: none;
  will-change: left, top;
}
.hys-ui-pf-color-hue,
.hys-ui-color-alpha {
  height: 12px;
  position: relative;
  margin: 18px 0;
  border-radius: 8px;
  touch-action: none;
  cursor: pointer;
}
.hys-ui-pf-color-hue {
  background: linear-gradient(to right, red, #ff0, #0f0, #0ff, #00f, #f0f, red);
}
.hys-ui-pf-color-hue > span,
.hys-ui-color-alpha > span {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 9px;
  height: 18px;
  box-sizing: border-box;
  border: 2px solid white;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #0005;
  pointer-events: none;
}
.hys-ui-color-alpha,
.hys-ui-pf-color-presets button {
  background-color: white;
  background-image: conic-gradient(
    #d9dce3 25%,
    transparent 0 50%,
    #d9dce3 0 75%,
    transparent 0
  );
  background-size: 8px 8px;
}
.hys-ui-color-alpha > div {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.hys-ui-pf-color-presets {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 6px;
  margin-top: 8px;
}
.hys-ui-pf-color-presets button {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  min-width: 0;
  padding: 0;
  border: 1px solid #0002;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}
.hys-ui-pf-color-presets svg {
  z-index: 1;
  position: relative;
}
.hys-ui-color-preset-fill {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hys-ui-color-panel-input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin-top: 12px;
  padding: 7px 9px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 7px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.hys-ui-color-panel footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-color-footer-spacer {
  flex: 1;
}
.hys-ui-pf-color-error {
  display: block;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
  margin-top: 5px;
}
.hys-ui-color-panel [tabindex]:focus-visible,
.hys-ui-color-panel button:focus-visible,
.hys-ui-color-panel-input:focus-visible {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 60%,
      transparent
    );
  outline-offset: 3px;
}
.hys-ui-color-panel [aria-disabled="true"],
.hys-ui-color-panel button:disabled {
  cursor: not-allowed;
}
.hys-ui-color-panel[aria-disabled="true"] {
  opacity: 0.5;
}
</style>
