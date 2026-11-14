<script setup lang="ts">
import { useHysRootAttrs } from "../../config";
import { usePopupSurface } from "../../composables/usePopupSurface";
import type {
  HysTooltipProps,
  HysTooltipSlots,
} from "../../composables/popupSurface";
import PopupReference from "../../internal/PopupReference";
import PopupSurfacePanel from "../../internal/PopupSurfacePanel.vue";
const props = withDefaults(defineProps<HysTooltipProps>(), {
  open: undefined,
  modelValue: undefined,
  placement: "top-start",
  showDelay: 0,
  hideDelay: 70,
  enterable: false,
  closeOnEscape: true,
  closeOnOutside: true,
  autoAdjustOverflow: true,
  destroyOnHide: true,
  appendTo: "body",
  effect: "dark",
});
const emit = defineEmits<{
  "update:open": [open: boolean];
  "update:modelValue": [open: boolean];
  visibleChange: [open: boolean];
  openChange: [open: boolean];
  show: [];
  hide: [];
  opened: [];
  closed: [];
}>();
defineSlots<HysTooltipSlots>();
const skin = useHysRootAttrs(),
  surface = usePopupSurface(props, "tooltip", (name, ...args) =>
    (emit as any)(name, ...args),
  );
defineExpose({
  element: surface.panel,
  referenceElement: surface.actualReference,
  open: surface.open,
  placement: surface.placement,
  show: surface.show,
  hide: surface.hide,
  close: surface.hide,
  toggle: surface.toggle,
  updatePosition: surface.updatePosition,
  focus: surface.focus,
});
</script>
<template>
  <span
    :ref="(el) => (surface.wrapper.value = el as HTMLElement)"
    v-bind="{ ...skin, ...surface.wrapperAttrs.value }"
    class="hys-ui-tooltip-wrap"
    @pointerenter="surface.pointerEnter"
    @pointerleave="surface.pointerLeave"
    @pointermove="surface.pointerMove"
    @pointerdown.capture="surface.pointerDown"
    @focusin="surface.focusIn"
    @focusout="surface.focusOut"
    @click="surface.click"
    @contextmenu="surface.contextmenu"
    @keydown="surface.key"
  >
    <PopupReference
      :id="surface.id"
      :open="surface.open.value"
      kind="tooltip"
      @element="surface.referenceElement.value = $event"
      ><slot v-bind="surface.scope.value"
    /></PopupReference>
    <PopupSurfacePanel :surface="surface" :options="props" kind="tooltip">
      <template #default="scope"
        ><slot name="content" v-bind="scope">{{ text }}</slot></template
      >
    </PopupSurfacePanel>
  </span>
</template>
<style scoped>
.hys-ui-tooltip-wrap {
  display: inline-flex;
  vertical-align: middle;
  position: relative;
}
.hys-ui-tooltip-wrap:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
