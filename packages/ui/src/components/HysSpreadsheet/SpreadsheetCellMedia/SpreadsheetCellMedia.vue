<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import type { HysSpreadsheetCellOptions } from "../spreadsheetTypes";

defineProps<{ media: NonNullable<HysSpreadsheetCellOptions["media"]> }>();
const target = useTemplateRef<HTMLElement>("target");
const visible = ref(false);
let observer: IntersectionObserver | undefined;
onMounted(() => {
  if (!target.value || typeof IntersectionObserver === "undefined") {
    visible.value = true;
    return;
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some(({ isIntersecting }) => isIntersecting)) {
      visible.value = true;
      observer?.disconnect();
    }
  });
  observer.observe(target.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <span ref="target" class="spreadsheet-media">
    <template v-if="visible">
      <img
        v-if="media.type === 'image'"
        :src="media.src"
        :alt="media.alt"
        loading="lazy"
        decoding="async"
      />
      <span v-else class="chart" role="img" :aria-label="media.label">
        <i
          v-for="(value, index) in media.values.slice(0, 48)"
          :key="index"
          :style="{ height: Math.max(0, Math.min(100, value)) + '%' }"
        />
      </span>
    </template>
  </span>
</template>

<style scoped>
.spreadsheet-media {
  display: inline-flex;
  min-height: 20px;
  max-width: 100%;
  vertical-align: middle;
}
img {
  display: block;
  max-width: 100%;
  height: 24px;
  object-fit: contain;
}
.chart {
  display: inline-flex;
  align-items: end;
  gap: 2px;
  min-width: 48px;
  height: 23px;
}
.chart i {
  flex: 1 1 4px;
  background: var(--hys-ui-theme-primary);
  border-radius: 1px 1px 0 0;
}
</style>
