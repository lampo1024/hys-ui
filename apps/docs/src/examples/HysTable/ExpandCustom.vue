<script setup lang="ts">
import { ref } from "vue";
import { Plus, Minus } from "lucide-vue-next";
import { HysTable, HysCheckbox, type HysTableColumn } from "hys-ui";
const show = ref(true);
const rows = [
  {
    id: 1,
    name: "体验优化",
    owner: "张工",
    description: "整理交互规范，完善组件的键盘操作。",
  },
  {
    id: 2,
    name: "数据治理",
    owner: "李工",
    description: "核对数据字段，补充数据质量检查。",
  },
];
const columns: HysTableColumn[] = [
  { key: "name", label: "任务" },
  { key: "owner", label: "负责人" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="show">显示展开操作列</HysCheckbox>
    </div>
    <div class="demo-content">
      <HysTable
        :rows="rows"
        :columns="columns"
        :show-expand-column="show"
        expand-on-click-row
        expand-fixed="right"
        expand-column-title="详情"
        ><template #expand-icon="{ expanded }"
          ><component :is="expanded ? Minus : Plus" :size="15" /></template
        ><template #expand="{ row }"
          ><p style="margin: 4px 0">{{ row.description }}</p></template
        ></HysTable
      >
    </div>
    <p class="scenario-note">
      点击行或图标展开详情。showExpandColumn
      隐藏操作列时仍可通过行点击或实例方法展开；图标插槽保留按钮本身的焦点、禁用状态与辅助标签。
    </p>
  </div>
</template>
