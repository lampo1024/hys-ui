<script setup lang="ts">
import { ref } from "vue";
import {
  HysTimeline,
  HysEmpty,
  HysButton,
  HysCheckbox,
  type HysTimelineItem,
} from "hys-ui";
const loading = ref(false),
  items = ref<HysTimelineItem[]>([]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="loading" label="正在获取记录" /><HysButton
        @click="items = [{ id: 0, title: '新创建的记录', status: 'current' }]"
        >创建一条记录</HysButton
      ><HysButton variant="ghost" @click="items = []">清空记录</HysButton>
    </div>
    <HysTimeline :items="items" :pending="loading" aria-label="空时间线"
      ><template #empty
        ><HysEmpty
          title="暂无时间记录"
          description="执行操作后，会在这里显示相关记录。"
          size="sm" /></template></HysTimeline
    ><HysTimeline
      :items="[
        {
          title:
            '较长的标题会自然换行，在窄容器里仍保持节点、连接线与内容的关系清晰',
          description: '说明可以包含较长的内容，不会把时间线横向撑宽。',
        },
      ]"
      aria-label="长内容时间线"
    />
  </div>
</template>
