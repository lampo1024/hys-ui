<script setup lang="ts">
import { ref } from "vue";
import { HysWatermark, HysInput, HysButton } from "hys-ui";
const signature = ref("内部资料 · 林宁");
const downloaded = ref(false);
</script>

<template>
  <div class="demo-stack">
    <HysInput v-model="signature" aria-label="水印署名" />
    <HysWatermark :text="signature">
      <section style="min-height: 155px; padding: 16px; background: var(--hys-ui-theme-surface-alt)">
        <h3>出库凭证</h3><p>班次 A17 的货物已完成核对。</p>
        <HysButton variant="secondary" @click="downloaded = true">{{ downloaded ? '已确认' : '确认凭证' }}</HysButton>
      </section>
    </HysWatermark>
  </div>
</template>
