<script setup lang="ts" generic="T extends object">
import type { StyleValue } from "vue";
import type { SortGhost } from "./useSortGhost";

defineProps<{
  track: SortGhost<T>;
  appearance: Record<string, string>;
  motion: boolean;
  ghostClass?: string;
  ghostStyle?: StyleValue;
}>();
</script>

<template>
  <div
    v-bind="appearance"
    class="hys-sort-ghost"
    :class="{
      'hys-sort-returning': motion && track.returning.value,
      'hys-sort-landing': motion && track.landing.value,
    }"
    :style="{
      transform:
        'translate3d(' +
        track.position.value.x +
        'px,' +
        track.position.value.y +
        'px,0)',
      width: track.width + 'px',
      '--hys-sort-landing-duration': track.landing.value
        ? track.landing.value.duration + 'ms'
        : undefined,
      '--hys-sort-landing-easing': track.landing.value?.easing,
    }"
    aria-hidden="true"
  >
    <div class="hys-sort-ghost-card" :class="ghostClass" :style="ghostStyle">
      <slot :drag="track.drag" :allowed="track.allowed.value" />
      <small v-if="!track.allowed.value">不可放置</small>
    </div>
  </div>
</template>

<style scoped>
.hys-sort-ghost {
  position: fixed;
  inset: 0 auto auto 0;
  z-index: var(--hys-sort-ghost-z, 2000);
  max-inline-size: calc(100vw - 16px);
  pointer-events: none;
}
.hys-sort-ghost-card {
  display: grid;
  gap: 2px;
  padding: 10px 14px;
  border: 1px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-radius: var(--hys-sort-radius, 9px);
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  box-shadow: var(--hys-sort-ghost-shadow, 0 8px 24px #101d3e2e);
  font-weight: 600;
  opacity: var(--hys-sort-ghost-opacity, 0.96);
  transform: scale(var(--hys-sort-ghost-scale, 1.02));
  overflow-wrap: anywhere;
}
.hys-sort-ghost-card small {
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger, #c03946));
}
.hys-sort-returning {
  opacity: 0;
  transition:
    transform 180ms ease-out,
    opacity 180ms ease-out;
}
.hys-sort-landing {
  transition: transform var(--hys-sort-landing-duration)
    var(--hys-sort-landing-easing, ease);
  animation: hys-sort-land-ghost var(--hys-sort-landing-duration) linear both;
}
@keyframes hys-sort-land-ghost {
  0%,
  65% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-sort-returning,
  .hys-sort-landing {
    transition: none;
  }
  .hys-sort-landing {
    animation: none;
  }
}
</style>
