<script setup lang="ts">
import { useHysRootAttrs } from "../../config";
import { usePopupSurface } from "../../composables/usePopupSurface";
import type {
  HysPopoverProps,
  HysPopoverSlots,
} from "../../composables/popupSurface";
import PopupReference from "../../internal/PopupReference";
import PopupSurfacePanel from "../../internal/PopupSurfacePanel.vue";
const props = withDefaults(defineProps<HysPopoverProps>(), {
  open: undefined,
  modelValue: undefined,
  placement: "bottom-end",
  showDelay: 0,
  hideDelay: 100,
  enterable: true,
  closeOnEscape: true,
  closeOnOutside: true,
  autoAdjustOverflow: true,
  destroyOnHide: true,
  appendTo: "body",
  effect: "light",
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
defineSlots<HysPopoverSlots>();
const skin = useHysRootAttrs(),
  surface = usePopupSurface(props, "popover", (name, ...args) =>
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
    class="hys-ui-popover-wrap"
    :class="'hys-ui-popover-trigger'"
    @pointerenter="surface.pointerEnter"
    @pointerleave="surface.pointerLeave"
    @focusin="surface.focusIn"
    @focusout="surface.focusOut"
    @click="surface.click"
    @contextmenu="surface.contextmenu"
    @keydown="surface.key"
  >
    <PopupReference
      :id="surface.id"
      :open="surface.open.value"
      kind="popover"
      @element="surface.referenceElement.value = $event"
      ><slot name="trigger" v-bind="surface.scope.value"
    /></PopupReference>
    <PopupSurfacePanel
      :surface="surface"
      :options="props"
      kind="popover"
      :title="title"
    >
      <template v-if="$slots.title" #title="scope"
        ><slot name="title" v-bind="scope" /></template
      ><template #default="scope"
        ><slot v-bind="scope">{{ content }}</slot></template
      >
    </PopupSurfacePanel>
  </span>
</template>
<style scoped>
.hys-ui-popover-wrap {
  display: inline-flex;
  vertical-align: middle;
  position: relative;
}
.hys-ui-popover-wrap:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
