<script setup lang="ts">
import { ref } from "vue";
import { HysResizablePanel } from "hys-ui";
const width = ref(220),
  message = ref("");
</script>

<template>
  <div class="demo-stack">
    <HysResizablePanel
      v-model="width"
      :min-width="150"
      :max-width="420"
      cancelable
      @resize-start="message = ''"
      @resize-cancel="message = '已恢复 ' + $event + ' px'"
    >
      <div style="padding: 16px">文档预览 · {{ width }} px</div>
    </HysResizablePanel>
    <p class="scenario-note">拖动调整宽度，拖动过程中按 Esc 可恢复原宽度。</p>
    <output v-if="message" class="state-output" aria-live="polite">{{
      message
    }}</output>
  </div>
</template>
