<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, type HysCascaderValue } from "hys-ui";
interface Department {
  code: number;
  meta: { title: string };
  departments?: Department[];
  archived?: boolean;
}
const options: Department[] = [
  {
    code: 0,
    meta: { title: "总部" },
    departments: [
      { code: 1, meta: { title: "研发团队" } },
      { code: 2, meta: { title: "运营团队" } },
    ],
  },
  { code: 3, meta: { title: "区域办公室" }, archived: true },
];
const value = ref<HysCascaderValue>(0);
</script>
<template>
  <div>
    <div class="demo-content">
      <HysCascader
        v-model="value"
        :options="options"
        :field-names="{
          value: 'code',
          label: 'meta.title',
          children: 'departments',
          disabled: 'archived',
        }"
        :emit-path="false"
        check-strictly
        clearable
      />
    </div>
    <output class="state-output"
      >编号：{{ value }} · 类型：{{ typeof value }}</output
    >
    <p class="scenario-note">
      字段支持点号路径。关闭 emitPath
      仅输出末级编号，此时各节点编号须全局唯一；数字 0 会作为有效值保留。
    </p>
  </div>
</template>
