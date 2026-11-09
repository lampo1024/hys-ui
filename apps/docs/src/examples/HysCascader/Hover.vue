<script setup lang="ts">
import { ref } from "vue";
import { HysCascader } from "hys-ui";
const options = [
  {
    value: "rd",
    label: "研发中心",
    children: [
      { value: "backend", label: "后端研发" },
      { value: "frontend", label: "前端研发" },
      { value: "qa", label: "测试归档", disabled: true },
    ],
  },
  {
    value: "product",
    label: "产品中心",
    children: [
      { value: "design", label: "交互设计" },
      { value: "research", label: "用户研究" },
    ],
  },
  { value: "business", label: "商务协作" },
];
const clicked = ref<string[]>([]),
  hovered = ref<string[]>([]);
</script>
<template>
  <div>
    <div class="demo-content cascader-demo-grid">
      <label>点击展开<HysCascader v-model="clicked" :options="options" /></label
      ><label
        >悬停展开<HysCascader
          v-model="hovered"
          :options="options"
          expand-trigger="hover"
          :hover-delay="180"
      /></label>
    </div>
    <output class="state-output"
      >点击：{{ clicked }} · 悬停：{{ hovered }}</output
    >
    <p class="scenario-note">
      悬停只展开子级，点击末级才选择。短暂经过节点不会反复切换路径；键盘始终可以使用左右方向键浏览。
    </p>
  </div>
</template>
<style scoped>
.cascader-demo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.cascader-demo-grid label {
  display: grid;
  gap: 10px;
  min-width: 0;
}
@media (max-width: 680px) {
  .cascader-demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
