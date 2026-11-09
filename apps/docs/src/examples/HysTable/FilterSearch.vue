<script setup lang="ts">
import { ref } from "vue";
import {
  HysTable,
  HysButton,
  type HysTableColumn,
  type HysTableFilters,
} from "hys-ui";
type Member = { id: number; name: string; team: string; city: number };
const rows: Member[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: ["陈晓", "林夕", "周宁", "许晨"][i % 4] + " " + (i + 1),
  team: ["web", "server", "design", "qa"][i % 4],
  city: i % 12,
}));
const filters = ref<HysTableFilters>({});
const columns: HysTableColumn<Member>[] = [
  { key: "name", label: "成员", width: 150 },
  {
    key: "team",
    label: "协作团队",
    width: 190,
    filterMode: "tree",
    filterSearch: true,
    filters: [
      {
        label: "技术中心",
        value: "engineering",
        children: [
          { label: "前端研发", value: "web" },
          { label: "后端研发", value: "server" },
        ],
      },
      {
        label: "设计中心",
        value: "creative",
        children: [{ label: "交互设计", value: "design" }],
      },
      { label: "质量保障", value: "qa" },
      { label: "归档团队", value: "archived", disabled: true },
    ],
  },
  {
    key: "city",
    label: "办公城市",
    width: 170,
    filterMultiple: false,
    filterSearch: true,
    defaultFilterValue: [0],
    filterResetToDefault: true,
    filters: [
      "北京",
      "上海",
      "广州",
      "深圳",
      "杭州",
      "南京",
      "苏州",
      "成都",
      "武汉",
      "西安",
      "厦门",
      "长沙",
    ].map((label, value) => ({ label, value })),
  },
];
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="filters = {}"
        >查看全部成员</HysButton
      >
    </div>
    <div class="demo-content">
      <HysTable
        v-model:filters="filters"
        :rows="rows"
        :columns="columns"
        :pagination="{ pageSize: 6 }"
      />
    </div>
    <output class="state-output">当前条件：{{ filters }}</output>
    <p class="scenario-note">
      团队筛选支持分层展开、父子勾选与搜索；选择父级包含其后代。城市为可搜索单选，重置恢复默认城市。搜索只缩小候选项，点击“应用”后才更新表格。
    </p>
  </div>
</template>
