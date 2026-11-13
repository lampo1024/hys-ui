<script setup lang="ts">
import { ref } from "vue";
import { BellOff } from "lucide-vue-next";
import { HysButton, HysPopconfirm } from "hys-ui";
const result = ref("工作区提醒已开启");
const duration = ref<number>();
</script>

<template>
  <div class="demo-stack">
    <div class="demo-panel demo-control-actions">
      <HysPopconfirm
        tone="neutral"
        title="暂停工作区提醒？"
        :icon="BellOff"
        initial-focus="panel"
        align="start"
        @confirm="result = '已暂停提醒 ' + duration + ' 小时'"
        @cancel="result = '保留工作区提醒'"
      >
        <template #trigger="{ open }">
          <HysButton variant="secondary">{{
            open ? "收起提醒设置" : "暂停提醒"
          }}</HysButton>
        </template>
        <template #description>请选择时长。到期后提醒会自动恢复。</template>
        <template
          #actions="{ confirm, cancel, confirmDisabled, cancelDisabled }"
        >
          <HysButton
            size="sm"
            variant="secondary"
            :disabled="cancelDisabled"
            data-hys-popconfirm-focus="cancel"
            @click="cancel"
            >保留提醒</HysButton
          >
          <HysButton
            size="sm"
            :disabled="confirmDisabled"
            data-hys-popconfirm-focus="confirm"
            @click="
              duration = 1;
              confirm($event);
            "
            >1 小时</HysButton
          >
          <HysButton
            size="sm"
            :disabled="confirmDisabled"
            @click="
              duration = 8;
              confirm($event);
            "
            >8 小时</HysButton
          >
        </template>
      </HysPopconfirm>
    </div>
    <output class="state-output" aria-live="polite">{{ result }}</output>
  </div>
</template>
