<script setup lang="ts">
import { computed } from "vue";
import { useHysRootAttrs } from "../../config";
const attrs = useHysRootAttrs();
const props = withDefaults(
  defineProps<{
    label?: string;
    direction?: "horizontal" | "vertical";
    dashed?: boolean;
    orientation?: "left" | "center" | "right" | "start" | "end";
    borderStyle?: "solid" | "dashed" | "dotted" | "double" | "none";
    orientationMargin?: number | string;
    plain?: boolean;
    size?: "sm" | "md" | "lg";
  }>(),
  { direction: "horizontal", orientation: "center", size: "md" },
);
const style = computed(() => ({
  "--hys-ui-divider-line":
    props.borderStyle ?? (props.dashed ? "dashed" : "solid"),
  "--hys-ui-divider-width": props.borderStyle === "double" ? "3px" : "1px",
  "--hys-ui-divider-margin":
    typeof props.orientationMargin === "number"
      ? Math.max(0, props.orientationMargin) + "px"
      : props.orientationMargin,
}));
</script>
<template>
  <div
    v-bind="attrs"
    class="hys-ui-ex-divider"
    :class="[
      'hys-ui-divider-' + direction,
      'hys-ui-divider-' + orientation,
      'hys-ui-divider-' + size,
      {
        'hys-ui-divider-plain': plain,
        'hys-ui-divider-custom-margin': orientationMargin !== undefined,
      },
    ]"
    :style="style"
    role="separator"
    :aria-orientation="direction"
  >
    <span
      v-if="direction === 'horizontal' && (label || $slots.default)"
      class="hys-ui-divider-text"
      ><slot>{{ label }}</slot></span
    >
  </div>
</template>
<style scoped>
.hys-ui-ex-divider {
  min-width: 0;
  gap: 12px;
  font-weight: 500;
}
.hys-ui-ex-divider:before,
.hys-ui-ex-divider:after {
  height: 0;
  min-width: 0;
  border-top: var(--hys-ui-divider-width) var(--hys-ui-divider-line)
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ee));
  background: none;
}
.hys-ui-divider-text {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-ui-divider-left:before,
.hys-ui-divider-start:before,
.hys-ui-divider-right:after,
.hys-ui-divider-end:after {
  flex: 0.1;
}
.hys-ui-divider-custom-margin.hys-ui-divider-left:before,
.hys-ui-divider-custom-margin.hys-ui-divider-start:before,
.hys-ui-divider-custom-margin.hys-ui-divider-right:after,
.hys-ui-divider-custom-margin.hys-ui-divider-end:after {
  flex: 0 0 var(--hys-ui-divider-margin);
}
.hys-ui-divider-plain {
  font-weight: 400;
  font-size: 13px;
}
.hys-ui-divider-sm {
  margin-block: 8px;
}
.hys-ui-divider-lg {
  margin-block: 24px;
}
.hys-ui-divider-vertical {
  display: inline-block;
  vertical-align: middle;
  align-self: stretch;
  flex: none;
  width: 0;
  height: 1em;
  border-inline-start: var(--hys-ui-divider-width) var(--hys-ui-divider-line)
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ee));
  margin: 0 10px;
}
.hys-ui-divider-vertical:before,
.hys-ui-divider-vertical:after {
  display: none;
}
:dir(rtl).hys-ui-divider-left {
  flex-direction: row-reverse;
}
:dir(rtl).hys-ui-divider-right {
  flex-direction: row-reverse;
}
</style>
