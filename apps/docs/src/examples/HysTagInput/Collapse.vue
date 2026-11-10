<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, HysNumberInput, HysCheckbox } from "hys-ui";
const tags = ref(
    Array.from(
      { length: 500 },
      (_, i) => "资源标签 " + String(i + 1).padStart(3, "0"),
    ),
  ),
  count = ref(2),
  tooltip = ref(true);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >直接展示数量<HysNumberInput
          v-model="count"
          :min="0"
          :max="6"
          :show-controls="false" /></label
      ><HysCheckbox v-model="tooltip" label="展开其余标签" />
    </div>
    <HysTagInput
      v-model="tags"
      :max="Infinity"
      collapse-tags
      :max-collapse-tags="count"
      :collapse-tags-tooltip="tooltip"
      clearable
      aria-label="大量折叠标签"
    /><output class="state-output">共 {{ tags.length }} 个标签</output>
    <p class="scenario-note">
      折叠列表按可见范围渲染，可以滚动查看和逐项删除，不会一次创建全部标签节点。
    </p>
  </div>
</template>
