<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysNumberInput,
  HysPopconfirm,
  HysSelect,
  type HysPopupTransition,
} from "hys-ui";
const transition = ref<HysPopupTransition>("scale"),
  duration = ref(160);
const effects = [
  { value: "scale", label: "柔和缩放" },
  { value: "fade", label: "淡入淡出" },
  { value: "slide", label: "轻移" },
  { value: "slide-fade", label: "轻移淡入" },
  { value: "none", label: "无动画" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >浮层动效<HysSelect
            v-model="transition"
            aria-label="浮层动效"
            :options="effects"
        /></label>
        <label class="demo-field"
          >时长（ms）<HysNumberInput
            v-model="duration"
            aria-label="动效时长"
            :min="0"
            :max="1000"
            :step="40"
        /></label>
      </div>
    </div>
    <div class="demo-panel demo-control-actions">
      <HysPopconfirm
        :popup-transition="transition"
        :popup-transition-duration="duration"
        title="置顶这条消息？"
        description="置顶后，消息会显示在频道顶部。"
        confirm-text="置顶"
      >
        <HysButton>置顶消息</HysButton>
      </HysPopconfirm>
    </div>
  </div>
</template>
