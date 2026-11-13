<script setup lang="ts">
import { ref } from "vue";
import {
  HysAvatar,
  HysCheckbox,
  HysDescriptions,
  HysSelect,
  type HysDescriptionItem,
} from "hys-ui";
const narrow = ref(false),
  bordered = ref(true);
const layout = ref<"horizontal" | "vertical">("vertical");
const fields: HysDescriptionItem[] = [
  { key: "avatar", label: "成员", rowSpan: 2 },
  { key: "name", label: "姓名", value: "苏宁" },
  { key: "group", label: "工作组", value: "客户交付" },
  { key: "role", label: "岗位", value: "项目协调员" },
  { key: "hours", label: "服务时段", value: "工作日 09:00–18:00" },
  {
    key: "note",
    label: "工作说明",
    value: "负责客户交付排期、跨团队协调和进度同步。",
    span: "full",
  },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >标签布局
          <HysSelect
            v-model="layout"
            aria-label="标签布局"
            :options="[
              { label: '标签在上方', value: 'vertical' },
              { label: '标签在左侧', value: 'horizontal' },
            ]"
          />
        </label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="narrow" label="模拟侧栏宽度" />
        <HysCheckbox v-model="bordered" label="显示边框" />
      </div>
    </div>
    <div class="demo-panel member-profile" :class="{ narrow }">
      <HysDescriptions
        title="成员详情"
        :items="fields"
        :layout="layout"
        :bordered="bordered"
        :columns="{ xs: 1, sm: 2, md: 3 }"
        :label-width="84"
      >
        <template #value-avatar><HysAvatar name="苏宁" :size="42" /></template>
      </HysDescriptions>
    </div>
  </div>
</template>

<style scoped>
.member-profile {
  box-sizing: border-box;
  inline-size: 100%;
}
.member-profile.narrow {
  inline-size: min(100%, 360px);
}
</style>
