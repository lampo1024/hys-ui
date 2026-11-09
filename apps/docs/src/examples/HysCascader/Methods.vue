<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, HysButton, type HysCascaderInstance } from "hys-ui";
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
const api = ref<HysCascaderInstance>(),
  value = ref<string[]>([]),
  report = ref("");
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="api?.setValue(['rd', 'frontend'])"
        >设置前端研发</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="api?.scrollTo(['product', 'design'])"
        >定位交互设计</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="
          report = JSON.stringify(
            api
              ?.getSelectedItems()
              .map((item) => ({
                path: item.path,
                label: item.label,
                disabled: item.disabled,
              })),
          )
        "
        >读取已选路径</HysButton
      ><HysButton size="sm" variant="ghost" @click="api?.clearCheckedNodes()"
        >清空</HysButton
      >
    </div>
    <div class="demo-content">
      <HysCascader ref="api" v-model="value" :options="options" clearable />
    </div>
    <output class="state-output">{{ report || value }}</output>
  </div>
</template>
