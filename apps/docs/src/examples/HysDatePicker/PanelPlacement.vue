<script setup lang="ts">
import { ref } from "vue";
import { CalendarCheck, CircleX } from "lucide-vue-next";
import { HysCheckbox, HysDatePicker } from "hys-ui";

const month = ref("");
const visible = ref(false);
const inPlace = ref(false);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysCheckbox v-model="inPlace">浮层保留在控件旁</HysCheckbox>
      <HysDatePicker
        v-model="month"
        picker="month"
        default-picker-value="2026-11"
        placeholder="选择发布月份"
        placement="topLeft"
        :fallback-placements="['bottom-start', 'right-start']"
        :popper-options="{ offset: 6, padding: 12 }"
        :teleported="!inPlace"
        :prefix-icon="CalendarCheck"
        :clear-icon="CircleX"
        allow-clear
        automatic-dropdown
        @open-change="visible = $event"
      >
        <template #month-cell-render="{ text, selected }">
          <strong v-if="selected">{{ text }}</strong>
          <span v-else>{{ text }}</span>
        </template>
      </HysDatePicker>
    </div>
    <output class="state-output"
      >{{ month || "尚未选择月份" }} ·
      {{ visible ? "面板已打开" : "面板已关闭" }}</output
    >
    <p class="scenario-note">
      聚焦可打开浮层。点击年份，再点击「选择年代」图标可浏览更早的年份。
    </p>
  </div>
</template>
