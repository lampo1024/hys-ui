<script setup lang="ts">
import { HysTimeline, HysBadge } from "hys-ui";
interface RecordItem {
  code: number;
  detail: { name: string; when: string };
  state: "done" | "current";
  owner: string;
}
const records: RecordItem[] = [
  {
    code: 0,
    detail: { name: "创建内容", when: "10:00" },
    state: "done",
    owner: "陈工",
  },
  {
    code: 1,
    detail: { name: "确认结果", when: "10:30" },
    state: "current",
    owner: "李工",
  },
];
</script>
<template>
  <HysTimeline
    :items="records"
    :field-names="{
      id: 'code',
      title: 'detail.name',
      time: 'detail.when',
      status: 'state',
    }"
    aria-label="业务字段时间线"
    ><template #description="{ item, key }"
      ><HysBadge>编号 {{ key }} · {{ item.owner }}</HysBadge></template
    ></HysTimeline
  >
</template>
