<script setup lang="ts">
import { computed, useAttrs } from "vue";
import {
  X,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleAlert,
  LoaderCircle,
} from "lucide-vue-next";
import { useAlert } from "../../composables/useAlert";
import type {
  HysAlertProps,
  HysAlertSlots,
  HysAlertCloseContext,
} from "../../composables/feedback";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysAlertProps>(), {
  visible: undefined,
  modelValue: undefined,
  showIcon: undefined,
  defaultVisible: true,
  effect: "light",
  bordered: true,
  size: "md",
  closeLabel: "关闭提示",
  transition: "fade",
  transitionDuration: 180,
  ariaAtomic: true,
});
const emit = defineEmits<{
  close: [];
  "update:visible": [visible: boolean];
  "update:modelValue": [visible: boolean];
  visibleChange: [visible: boolean];
  closeRequest: [context: HysAlertCloseContext];
  closeError: [error: Error];
  afterClose: [];
}>();
const slots = defineSlots<HysAlertSlots>(),
  attrs = useAttrs(),
  state = useAlert(props, (name, ...args) => (emit as any)(name, ...args));
const icon = computed(
  () =>
    ({
      success: CircleCheck,
      warning: TriangleAlert,
      danger: CircleAlert,
      info: Info,
      primary: Info,
    })[state.tone.value],
);
const hasDescription = computed(
  () => !!(props.description || slots.default || slots.description),
);
const color = computed(
  () =>
    ({
      info: "var(--hys-ui-info,#3867f5)",
      primary: "var(--hys-ui-primary,var(--hys-ui-theme-primary))",
      success: "var(--hys-ui-success,#16a46e)",
      warning: "var(--hys-ui-warning,#d9860c)",
      danger: "var(--hys-ui-red,var(--hys-ui-theme-red,#ed4556))",
    })[state.tone.value],
);
defineExpose({
  element: state.element,
  visible: state.visible,
  closing: state.closing,
  close: () => state.close(),
  show: state.show,
});
</script>
<template>
  <Transition
    :name="'hys-ui-alert-' + transition"
    :css="state.duration.value > 0"
    :duration="state.duration.value"
    :appear="appear"
    @before-leave="state.beforeLeave"
    @after-leave="state.afterLeave"
    @before-enter="state.restore"
    @leave-cancelled="state.restore"
  >
    <div
      v-if="state.visible.value"
      :ref="(el) => (state.element.value = el as HTMLElement)"
      v-bind="{ ...state.skin.value, ...attrs }"
      class="hys-ui-ex-alert hys-ui-alert-panel"
      :class="[
        'hys-ui-ex-' + state.tone.value,
        'hys-ui-alert-' + size,
        {
          'hys-ui-alert-banner': banner,
          'hys-ui-alert-center': center,
          'hys-ui-alert-bordered': bordered,
          'hys-ui-alert-description': hasDescription,
        },
      ]"
      :data-effect="effect"
      :style="{
        '--hys-ui-alert-color': color,
        '--hys-ui-alert-duration': state.duration.value + 'ms',
      }"
      :role="
        (attrs.role as string) ||
        (state.tone.value === 'danger' ? 'alert' : 'status')
      "
      :aria-label="ariaLabel"
      :aria-live="ariaLive"
      :aria-atomic="ariaAtomic"
      :aria-busy="state.closing.value || undefined"
    >
      <span
        v-if="showIcon ?? banner"
        class="hys-ui-alert-icon"
        aria-hidden="true"
        ><slot name="icon" v-bind="state.scope.value"
          ><component :is="icon" :size="hasDescription ? 22 : 18" /></slot
      ></span>
      <div class="hys-ui-alert-content">
        <strong v-if="title || slots.title" class="hys-ui-alert-title"
          ><slot name="title" v-bind="state.scope.value">{{
            title
          }}</slot></strong
        >
        <div v-if="hasDescription" class="hys-ui-alert-description">
          <slot v-bind="state.scope.value"
            ><slot name="description" v-bind="state.scope.value">{{
              description
            }}</slot></slot
          >
        </div>
      </div>
      <div v-if="slots.action" class="hys-ui-alert-action">
        <slot name="action" v-bind="state.scope.value" />
      </div>
      <button
        v-if="closable"
        type="button"
        class="hys-ui-alert-close"
        :aria-label="closeLabel"
        :disabled="disabled || state.closing.value"
        @click="state.close('button', $event)"
      >
        <LoaderCircle
          v-if="state.closing.value"
          class="hys-ui-alert-spinner"
          :size="16"
          aria-hidden="true"
        /><slot v-else name="close-icon" v-bind="state.scope.value"
          ><span v-if="closeText">{{ closeText }}</span
          ><X v-else :size="16" aria-hidden="true"
        /></slot>
      </button>
    </div>
  </Transition>
</template>
<style scoped>
.hys-ui-ex-alert.hys-ui-alert-panel {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  box-sizing: border-box;
  padding: 12px 14px;
  min-width: 0;
  max-width: 100%;
  margin: 0 0 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: color-mix(
    in srgb,
    var(--hys-ui-alert-color) 10%,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
  color: color-mix(
    in srgb,
    var(--hys-ui-alert-color) 70%,
    var(--hys-ui-text, var(--hys-ui-theme-text))
  );
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.hys-ui-alert-panel.hys-ui-alert-bordered {
  border-color: color-mix(in srgb, var(--hys-ui-alert-color) 22%, transparent);
}
.hys-ui-alert-panel[data-effect="dark"] {
  background: color-mix(in srgb, var(--hys-ui-alert-color) 75%, #000);
  color: #fff;
}
.hys-ui-alert-panel[data-effect="outline"] {
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  border-color: var(--hys-ui-alert-color);
}
.hys-ui-alert-panel.hys-ui-alert-banner {
  border-radius: 0;
  border-inline: 0;
}
.hys-ui-alert-panel.hys-ui-alert-sm {
  padding: 8px 10px;
  gap: 8px;
  font-size: 12px;
}
.hys-ui-alert-panel.hys-ui-alert-lg {
  padding: 16px 18px;
  gap: 12px;
  font-size: 15px;
}
.hys-ui-alert-icon {
  display: inline-flex;
  flex: none;
  margin-top: 1px;
  color: inherit;
}
.hys-ui-alert-content {
  flex: 1;
  min-width: 0;
}
.hys-ui-alert-title {
  display: block;
  margin: 0;
  font-size: inherit;
  font-weight: 600;
}
.hys-ui-alert-content > .hys-ui-alert-description {
  margin-top: 3px;
  font-size: inherit;
}
.hys-ui-alert-content > .hys-ui-alert-description:first-child {
  margin: 0;
}
.hys-ui-alert-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: none;
  max-width: 100%;
}
.hys-ui-alert-panel.hys-ui-alert-center .hys-ui-alert-content {
  text-align: center;
}
.hys-ui-alert-panel .hys-ui-alert-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: none;
  min-width: 24px;
  min-height: 24px;
  padding: 2px 4px;
  margin: -2px -4px 0 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1;
  cursor: pointer;
}
.hys-ui-alert-panel .hys-ui-alert-close:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 10%, transparent);
}
.hys-ui-alert-close:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.hys-ui-alert-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.hys-ui-alert-spinner {
  animation: hys-ui-alert-spin 1s linear infinite;
}
.hys-ui-alert-fade-enter-active,
.hys-ui-alert-fade-leave-active,
.hys-ui-alert-slide-enter-active,
.hys-ui-alert-slide-leave-active {
  transition:
    opacity var(--hys-ui-alert-duration) ease,
    transform var(--hys-ui-alert-duration) ease;
}
.hys-ui-alert-fade-enter-from,
.hys-ui-alert-fade-leave-to,
.hys-ui-alert-slide-enter-from,
.hys-ui-alert-slide-leave-to {
  opacity: 0;
}
.hys-ui-alert-slide-enter-from,
.hys-ui-alert-slide-leave-to {
  transform: translateY(-6px);
}
.hys-ui-alert-collapse-enter-active,
.hys-ui-alert-collapse-leave-active {
  overflow: hidden;
  transition:
    height var(--hys-ui-alert-duration) ease,
    padding var(--hys-ui-alert-duration) ease,
    margin var(--hys-ui-alert-duration) ease,
    opacity var(--hys-ui-alert-duration) ease;
}
.hys-ui-alert-collapse-leave-from {
  height: var(--hys-ui-alert-height);
}
.hys-ui-alert-panel.hys-ui-alert-collapse-leave-to {
  height: 0;
  padding-block: 0;
  margin-block: 0;
  opacity: 0;
  border-block-width: 0;
}
.hys-ui-alert-collapse-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.hys-ui-alert-panel[data-hys-motion="off"] .hys-ui-alert-spinner {
  animation: none;
}
@keyframes hys-ui-alert-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 480px) {
  .hys-ui-alert-panel {
    flex-wrap: wrap;
  }
  .hys-ui-alert-content {
    flex-basis: calc(100% - 74px);
  }
  .hys-ui-alert-action {
    order: 2;
    flex-basis: 100%;
    padding-left: 28px;
  }
  .hys-ui-alert-panel:not(:has(.hys-ui-alert-icon)) .hys-ui-alert-action {
    padding-left: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-alert-spinner {
    animation: none !important;
  }
}
</style>
