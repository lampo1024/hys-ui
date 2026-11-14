<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSplitPane } from "hys-ui";

const size = ref(38);
const lazy = ref(true);
</script>

<template>
  <div class="demo-panel">
    <HysCheckbox v-model="lazy" label="释放分隔条后应用尺寸" />
    <HysSplitPane
      v-model="size"
      :lazy="lazy"
      :first-panel="{ min: 120, max: '65%', collapsible: true }"
      :second-panel="{ min: '24%', collapsible: true }"
      first-label="文件面板"
      second-label="编辑面板"
    >
      <template #first>
        <div class="split-example-panel">
          <strong>文件</strong>
          <p>工作区设置</p>
          <p>部署配置</p>
        </div>
      </template>
      <template #second>
        <div class="split-example-panel">
          <strong>编辑区</strong>
          <p>文件面板占用 {{ Math.round(size) }}%</p>
        </div>
      </template>
    </HysSplitPane>
  </div>
</template>

<style scoped>
.split-example-panel {
  padding: 12px;
}
</style>
