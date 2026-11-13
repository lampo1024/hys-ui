<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from "vue";
import {
  blockSpinTarget,
  lockSpinTargetScroll,
  positionSpinTarget,
} from "./spinTarget";
const props = defineProps<{
  target: string | HTMLElement | ShadowRoot;
  cover: boolean;
  block: boolean;
  lock: boolean;
}>();
const target = shallowRef<HTMLElement | ShadowRoot>();
let releasePosition: (() => void) | undefined,
  releaseBlock: (() => void) | undefined,
  releaseScroll: (() => void) | undefined;
watch(
  () => props.target,
  (value) => {
    if (typeof document === "undefined") return;
    if (typeof value !== "string") {
      target.value = value;
      return;
    }
    try {
      const node = document.querySelector(value);
      target.value = node instanceof HTMLElement ? node : undefined;
    } catch {
      target.value = undefined;
    }
  },
  { immediate: true },
);
watch(
  [target, () => props.cover],
  ([node, cover]) => {
    releasePosition?.();
    releasePosition = node && cover ? positionSpinTarget(node) : undefined;
  },
  { immediate: true },
);
watch(
  [target, () => props.cover && props.block],
  ([node, block]) => {
    releaseBlock?.();
    releaseBlock = node && block ? blockSpinTarget(node) : undefined;
  },
  { immediate: true, flush: "post" },
);
watch(
  [target, () => props.cover && props.lock],
  ([node, lock]) => {
    releaseScroll?.();
    releaseScroll = node && lock ? lockSpinTargetScroll(node) : undefined;
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  releaseBlock?.();
  releaseScroll?.();
  releasePosition?.();
});
</script>
<template>
  <Teleport :to="target ?? 'body'" :disabled="!target">
    <div
      data-hys-spin-portal
      :class="{ 'hys-spin-portal-cover': target && cover }"
    >
      <slot />
    </div>
  </Teleport>
</template>
<style scoped>
.hys-spin-portal-cover {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hys-spin-portal-cover :slotted(.hys-ui-spin) {
  block-size: 100%;
  min-block-size: var(--hys-spin-region-height, 0);
}
</style>
