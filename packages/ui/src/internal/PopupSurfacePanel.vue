<script setup lang="ts">
import PopupMotion from "../motion/PopupMotion";
import { useHysRootAttrs } from "../config";
import type { HysPopupSurfaceProps } from "../composables/popupSurface";
import type { usePopupSurface } from "../composables/usePopupSurface";
import { computed, provide } from "vue";
import { overlayOwnerKey } from "../composables/overlayManager";
const props = defineProps<{
  surface: ReturnType<typeof usePopupSurface>;
  options: HysPopupSurfaceProps;
  kind: "tooltip" | "popover";
  title?: string;
  labelledBy?: string;
  describedBy?: string;
  tabindex?: number;
}>();
// Only floating content owns nested popups; the reference keeps its original owner.
provide(
  overlayOwnerKey,
  computed(() => props.surface.active.value && props.surface.open.value),
);
const skin = useHysRootAttrs();
</script>
<template>
  <Teleport
    v-if="surface.active.value"
    :to="surface.teleportTo.value"
    :disabled="options.appendTo === false"
  >
    <PopupMotion
      :popup-transition="options.popupTransition"
      :popup-transition-duration="options.popupTransitionDuration"
      :placement="surface.placement.value"
      ignore-owner
      @entered="surface.afterEnter"
      @left="surface.afterLeave"
      @inactive="surface.inactive"
    >
      <div
        v-if="surface.mounted.value"
        v-show="surface.open.value"
        :id="surface.id"
        :ref="(el) => (surface.panel.value = el as HTMLElement)"
        v-bind="skin"
        class="hys-ui-popup-surface-panel"
        :class="[
          kind === 'tooltip'
            ? 'hys-ui-tooltip-bubble hys-ui-floating-tooltip'
            : 'hys-ui-popover-panel hys-ui-floating-surface',
          options.overlayClass,
          { 'hys-ui-popup-enterable': options.enterable !== false },
        ]"
        :style="surface.style.value"
        :role="kind === 'tooltip' ? 'tooltip' : 'dialog'"
        :aria-label="
          options.ariaLabel ||
          (kind === 'popover' && !labelledBy ? title || '浮层' : undefined)
        "
        :aria-labelledby="
          (!options.ariaLabel &&
            (labelledBy ??
              (kind === 'popover' && (title || $slots.title)
                ? surface.titleId
                : undefined))) ||
          undefined
        "
        :aria-describedby="describedBy"
        :tabindex="tabindex"
        :data-side="surface.placement.value.split('-')[0]"
        :data-placement="surface.placement.value"
        @pointerenter="surface.panelEnter"
        @pointerleave="surface.panelLeave"
        @focusin="surface.panelFocusIn"
        @focusout="surface.panelFocusOut"
      >
        <span
          v-if="options.showArrow"
          class="hys-ui-popup-arrow"
          :style="surface.arrowStyle.value"
          aria-hidden="true"
        />
        <div
          class="hys-ui-popup-surface-content"
          :class="options.contentClass"
          :style="surface.contentStyle.value"
        >
          <div
            v-if="kind === 'popover' && (title || $slots.title)"
            :id="surface.titleId"
            class="hys-ui-popup-surface-title"
          >
            <slot name="title" v-bind="surface.scope.value">{{ title }}</slot>
          </div>
          <slot v-bind="surface.scope.value" />
        </div>
      </div>
    </PopupMotion>
  </Teleport>
</template>
<style scoped>
.hys-ui-popup-surface-panel.hys-ui-tooltip-bubble,
.hys-ui-popup-surface-panel.hys-ui-popover-panel {
  box-sizing: border-box;
  padding: 0;
  border: 0;
  box-shadow: none;
  background: none;
  border-radius: 9px;
  isolation: isolate;
  white-space: normal;
}
.hys-ui-popup-surface-panel.hys-ui-floating-tooltip {
  pointer-events: none;
}
.hys-ui-popup-surface-panel.hys-ui-popup-enterable {
  pointer-events: auto;
}
.hys-ui-popup-surface-content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--hys-ui-popup-border);
  border-radius: inherit;
  background: var(--hys-ui-popup-surface);
  color: var(--hys-ui-popup-color);
  padding: 12px;
  box-shadow: 0 10px 32px #0002;
  overflow-wrap: anywhere;
}
.hys-ui-floating-tooltip .hys-ui-popup-surface-content {
  padding: 7px 10px;
  font-size: 12px;
  line-height: 1.6;
}
.hys-ui-popup-surface-title {
  font-weight: 650;
  margin-bottom: 8px;
  line-height: 1.5;
}
.hys-ui-popup-arrow {
  position: absolute;
  z-index: 0;
  width: 9px;
  height: 9px;
  box-sizing: border-box;
  background: var(--hys-ui-popup-surface);
  border: 1px solid var(--hys-ui-popup-border);
  transform: translate(-50%, -50%) rotate(45deg);
  pointer-events: none;
}
[data-side="top"] > .hys-ui-popup-arrow {
  top: 100%;
  border-top: 0;
  border-left: 0;
}
[data-side="bottom"] > .hys-ui-popup-arrow {
  top: 0;
  border-right: 0;
  border-bottom: 0;
}
[data-side="left"] > .hys-ui-popup-arrow {
  left: 100%;
  border-left: 0;
  border-bottom: 0;
}
[data-side="right"] > .hys-ui-popup-arrow {
  left: 0;
  border-top: 0;
  border-right: 0;
}
</style>
