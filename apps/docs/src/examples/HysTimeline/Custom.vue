<script setup lang="ts">
import { ref } from "vue";
import {
  HysTimeline,
  HysCard,
  HysBadge,
  HysButton,
  HysAvatar,
  type HysTimelineItem,
} from "hys-ui";
const result = ref("等待查看");
const items: (HysTimelineItem & { owner: string })[] = [
  {
    id: 0,
    title: "完成内容审核",
    label: "09:00",
    owner: "陈",
    description: "已核对内容，可继续提交。",
    status: "done",
    size: 28,
  },
  {
    id: 1,
    title: "等待确认",
    label: "10:00",
    owner: "李",
    description: "请核对最终结果。",
    status: "current",
    size: 28,
  },
];
</script>
<template>
  <div class="demo-stack">
    <HysTimeline :items="items" aria-label="卡片时间线"
      ><template #dot="{ item }"
        ><HysAvatar :name="item.owner" :size="28" /></template
      ><template #item="{ item, status }"
        ><HysCard :title="item.title"
          ><div class="demo-stack">
            <HysBadge :tone="status === 'done' ? 'green' : 'blue'">{{
              status === "done" ? "已完成" : "进行中"
            }}</HysBadge
            ><span>{{ item.description }}</span>
            <div class="demo-control-actions">
              <HysButton size="sm" @click="result = '正在查看：' + item.title"
                >查看详情</HysButton
              >
            </div>
          </div></HysCard
        ></template
      ></HysTimeline
    ><output class="state-output">{{ result }}</output>
  </div>
</template>
