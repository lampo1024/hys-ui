<script setup lang="ts">
import { ref } from "vue";
import { HysCard, HysCheckbox, HysSkeleton, HysButton } from "hys-ui";
const loading = ref(true);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="loading" label="加载中" />
    <div class="card-loading-grid">
      <HysCard title="默认加载占位" :loading="loading"
        ><p>加载完成后展示正文内容。</p></HysCard
      >
      <HysCard title="自定义占位" :loading="loading">
        <template #loading
          ><HysSkeleton
            avatar
            :lines="2"
            :title-width="'55%'"
            loading-text="正在读取成员信息"
        /></template>
        <p>可以通过 loading 插槽，使占位布局接近实际内容。</p>
        <template #footer
          ><HysButton size="sm" :disabled="loading"
            >查看详情</HysButton
          ></template
        >
      </HysCard>
    </div>
  </div>
</template>
<style scoped>
.card-loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 20px;
  align-items: start;
}
</style>
