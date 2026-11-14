<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { HysButton, HysScrollbar, HysSelect, type HysScrollbarEdge, type HysScrollbarInstance, type HysScrollbarMask } from "hys-ui";

const viewport = useTemplateRef<HysScrollbarInstance>("viewport");
const mode = ref<HysScrollbarEdge | "all" | "off">("all");
const mask = computed<HysScrollbarMask>(() => {
  if (mode.value === "all") return true;
  if (mode.value === "off") return false;
  return mode.value;
});
const options = [
  { label: "四边遮罩", value: "all" },
  { label: "仅上侧", value: "top" },
  { label: "仅下侧", value: "bottom" },
  { label: "仅左侧", value: "left" },
  { label: "仅右侧", value: "right" },
  { label: "关闭遮罩", value: "off" },
];
const weeks = ["10 月第 1 周", "10 月第 2 周", "10 月第 3 周", "10 月第 4 周", "11 月第 1 周", "11 月第 2 周", "11 月第 3 周", "11 月第 4 周"];
const teams = ["产品", "设计", "研发", "测试", "运营", "交付", "支持", "复盘"];
const states = ["已排期", "执行中", "待确认", "已交付"];

function center() {
  const el = viewport.value?.viewport;
  if (el) viewport.value?.scrollTo((el.scrollWidth - el.clientWidth) / 2, (el.scrollHeight - el.clientHeight) / 2);
}
</script>

<template>
  <div class="mask-example">
    <div class="mask-controls">
      <HysSelect v-model="mode" :options="options" size="sm" aria-label="排期边缘遮罩" />
      <HysButton size="sm" variant="secondary" @click="center">定位中间</HysButton>
    </div>
    <HysScrollbar ref="viewport" :height="226" :mask="mask" aria-label="团队周排期" class="schedule">
      <table>
        <thead><tr><th scope="col">团队</th><th v-for="week in weeks" :key="week" scope="col">{{ week }}</th></tr></thead>
        <tbody>
          <tr v-for="(team, row) in teams" :key="team">
            <th scope="row">{{ team }}</th>
            <td v-for="(week, column) in weeks" :key="week">{{ states[(row + column) % states.length] }}</td>
          </tr>
        </tbody>
      </table>
    </HysScrollbar>
    <p class="scenario-note">点「定位中间」查看四边遮罩。拖到任一边缘后，该方向的遮罩会消失。</p>
  </div>
</template>

<style scoped>
.mask-example { display: grid; gap: 10px; min-inline-size: 0; }
.mask-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.mask-controls :deep(.hys-ui-select) { inline-size: 145px; }
.schedule {
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
  background: var(--hys-ui-theme-surface);
  --hys-ui-scrollbar-top-mask-height: 32px;
  --hys-ui-scrollbar-bottom-mask-height: 32px;
  --hys-ui-scrollbar-left-mask-width: 36px;
  --hys-ui-scrollbar-right-mask-width: 36px;
}
table { inline-size: 100%; min-inline-size: 1050px; border-collapse: collapse; text-align: start; }
th, td { padding: 11px 14px; border-bottom: 1px solid var(--hys-ui-theme-border); text-align: start; white-space: nowrap; }
thead th { background: var(--hys-ui-theme-bg); }
td { color: var(--hys-ui-theme-muted); }
</style>
