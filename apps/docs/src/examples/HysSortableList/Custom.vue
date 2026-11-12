<script setup lang="ts">
import { computed, ref } from "vue";
import { Grip, Music2 } from "lucide-vue-next";
import {
  HysCheckbox,
  HysSortableList,
  provideHysConfig,
  type HysSortPreview,
} from "hys-ui";

interface Track {
  code: string;
  title: string;
  length: string;
}
const tracks = ref<Track[]>([
  { code: "city", title: "城市晨光", length: "03:21" },
  { code: "walk", title: "海边漫步", length: "04:10" },
  { code: "lights", title: "归途灯火", length: "02:48" },
]);
const dark = ref(false);
const motionOff = ref(false);
const live = ref(true);
const endOnly = ref(false);
const status = ref("松手后，曲目预览会滑到最终位置。");
provideHysConfig({ theme: computed(() => (dark.value ? "dark" : "blue")) });

function preview(event: HysSortPreview<Track> | null) {
  if (!event) {
    status.value = "拖动曲目时可查看目标位置。";
    return;
  }
  const track = event.proposal.items[0];
  const position =
    event.lists[0].next.findIndex((item) => item.code === track.code) + 1;
  status.value = `「${track.title}」将移至第 ${position} 项`;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="dark" label="深色主题" />
      <HysCheckbox v-model="motionOff" label="关闭动画" />
      <HysCheckbox v-model="live" label="实时预览" />
      <HysCheckbox v-model="endOnly" label="自动插到末尾" />
    </div>
    <HysSortableList
      v-model="tracks"
      item-key="code"
      item-label="title"
      :live-preview="live"
      :motion="!motionOff"
      :resolve-index="
        endOnly ? (proposal) => proposal.to.items.length : undefined
      "
      :show-buttons="false"
      :animation-duration="280"
      animation-easing="cubic-bezier(.22,1,.36,1)"
      :ghost-style="{
        '--hys-sort-ghost-scale': 1.05,
        '--hys-sort-ghost-opacity': 0.88,
      }"
      aria-label="播放队列"
      class="playlist"
      @preview="preview"
      @change="status = '播放队列已更新'"
    >
      <template #handle><Grip :size="16" aria-hidden="true" /></template>
      <template #item="{ item }">
        <span class="track"
          ><Music2 :size="15" aria-hidden="true" /><strong>{{
            item.title
          }}</strong
          ><small>{{ item.length }}</small></span
        >
      </template>
      <template #preview="{ drag }"
        >移动曲目 · {{ drag.items[0].title }}</template
      >
      <template #placeholder>放置到此位置</template>
    </HysSortableList>
    <small class="status">{{ status }}</small>
  </div>
</template>

<style scoped>
.playlist {
  --hys-sort-gap: 6px;
  --hys-sort-radius: 12px;
  --hys-sort-picked-opacity: 0.72;
}
.track {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.track svg {
  flex: none;
  color: var(--hys-ui-theme-primary);
}
.track small {
  margin-inline-start: auto;
  color: var(--hys-ui-theme-muted);
  font-variant-numeric: tabular-nums;
}
.status {
  color: var(--docs-muted);
}
</style>
