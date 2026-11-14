<script setup lang="ts">
import { ref } from "vue";
import { HysPagination, HysSelect } from "hys-ui";

const page = ref(12);
const jumpStep = ref("5");
const options = [5, 10, 20].map((step) => ({
  value: String(step),
  label: step + " 页",
}));
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="jump-step">
        省略号跳转步长
        <HysSelect
          v-model="jumpStep"
          :options="options"
          aria-label="省略号跳转步长"
        />
      </label>
    </div>
    <div class="jump-preview">
      <HysPagination
        v-model:page="page"
        :page-count="50"
        :gap-step="Number(jumpStep)"
        :responsive="false"
        layout="prev,pager,next"
        jump-gaps
      />
    </div>
  </div>
</template>

<style scoped>
.jump-step {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.jump-preview {
  min-width: 0;
  overflow: auto;
}
</style>
