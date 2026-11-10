<script setup lang="ts">
import { reactive, computed } from "vue";
import {
  HysTimeline,
  HysCheckbox,
  HysSelect,
  type HysTimelineItem,
  type HysTimelineMode,
} from "hys-ui";
const items: HysTimelineItem[] = [
  { id: 0, title: "记录已创建", time: "10:00", status: "done" },
  {
    id: 1,
    title: "正在检查",
    time: "10:30",
    status: "current",
    description: "核对内容并确认操作。",
  },
  { id: 2, title: "等待下一步", time: "11:00", status: "pending" },
];
const config = reactive({
  mode: "left" as HysTimelineMode,
  size: "md" as "sm" | "md" | "lg",
  reverse: false,
  hollow: false,
  showTime: true,
  responsive: true,
  timePlacement: "bottom" as "top" | "bottom",
  lineStyle: "solid" as "solid" | "dashed" | "dotted",
});
const flags = ["reverse", "hollow", "showTime", "responsive"] as const;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>布局与外观</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >布局<HysSelect
              v-model="config.mode"
              :options="
                ['left', 'right', 'alternate', 'alternate-reverse'].map(
                  (value) => ({ label: value, value }),
                )
              " /></label
          ><label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-field"
            >时间位置<HysSelect
              v-model="config.timePlacement"
              :options="
                ['top', 'bottom'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-field"
            >连接线<HysSelect
              v-model="config.lineStyle"
              :options="
                ['solid', 'dashed', 'dotted'].map((value) => ({
                  label: value,
                  value,
                }))
              "
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div v-for="key in flags" :key="key" class="demo-control-toggle">
            <HysCheckbox v-model="config[key]" :label="key" />
          </div>
        </div>
      </section>
    </div>
    <HysTimeline :items="items" v-bind="config" aria-label="可配置时间线" />
  </div>
</template>
