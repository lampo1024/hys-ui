<script setup lang="ts">
import { ref } from "vue";
import { HysSelect, type HysSelectDataOption } from "hys-ui";
const member = ref<number | null>(0);
const options: HysSelectDataOption[] = [
  {
    name: "产品与设计",
    children: [
      { id: 0, name: "Keller" },
      { id: 1, name: "Amy" },
    ],
  },
  {
    name: "研发团队",
    children: [
      { id: 2, name: "Lisa" },
      { id: 3, name: "David" },
    ],
  },
  { name: "暂不可用", blocked: true, children: [{ id: 4, name: "Jack" }] },
];
</script>
<template>
  <div class="demo-content">
    <label class="select-demo-field"
      ><span>按团队选择成员</span
      ><HysSelect
        v-model="member"
        :options="options"
        :field-names="{
          label: 'name',
          value: 'id',
          options: 'children',
          disabled: 'blocked',
        }"
        filterable
        clearable
        :clear-value="null"
        aria-label="分组成员"
        ><template #group="{ label }"
          ><span>{{ label }}</span></template
        ></HysSelect
      ></label
    ><output class="state-output"
      >成员 ID：{{ member === null ? "未选择" : member }}</output
    >
    <p class="scenario-note">
      分组标题不会参与选择。分组禁用状态会传给所有子选项；搜索只保留有匹配项的组。fieldNames
      可直接映射业务数据字段，无须手动改写原始数据。
    </p>
  </div>
</template>
