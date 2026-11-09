<script setup lang="ts">
import { ref, onBeforeUnmount, onDeactivated } from "vue";
import { HysSkeleton, HysButton } from "hys-ui";
const loading = ref(false),
  visible = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
function load(duration: number) {
  if (timer) clearTimeout(timer);
  loading.value = true;
  timer = setTimeout(() => {
    timer = undefined;
    loading.value = false;
  }, duration);
}
function clear() {
  if (timer) clearTimeout(timer);
  timer = undefined;
  loading.value = false;
}
onBeforeUnmount(clear);
onDeactivated(clear);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysButton variant="secondary" :disabled="loading" @click="load(100)"
        >快速请求</HysButton
      ><HysButton variant="secondary" :disabled="loading" @click="load(900)"
        >慢速请求</HysButton
      >
    </div>
    <div class="loading-preview">
      <HysSkeleton
        :loading="loading"
        :delay="250"
        :min-duration="700"
        :lines="2"
        @visibility-change="visible = $event"
        ><p>
          加载完成的内容。快速请求不会显示骨架；出现占位后会保留足够时间，避免闪烁。
        </p></HysSkeleton
      >
    </div>
  </div>
  <output
    >请求：{{ loading ? "进行中" : "已结束" }} · 占位：{{
      visible ? "显示" : "隐藏"
    }}</output
  >
</template>
<style scoped>
.loading-preview {
  min-height: 110px;
  padding: 20px;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
}
</style>
