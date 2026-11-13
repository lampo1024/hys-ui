<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysPopconfirm,
  HysSelect,
  type HysPopupPlacement,
} from "hys-ui";
const placement = ref<HysPopupPlacement>("top");
const trigger = ref<"click" | "contextmenu">("click");
const arrow = ref(true),
  adjust = ref(true),
  dark = ref(false);
const positions = [
  ["top", "上方"],
  ["top-start", "左上"],
  ["top-end", "右上"],
  ["right", "右侧"],
  ["right-start", "右侧靠上"],
  ["right-end", "右侧靠下"],
  ["bottom", "下方"],
  ["bottom-start", "左下"],
  ["bottom-end", "右下"],
  ["left", "左侧"],
  ["left-start", "左侧靠上"],
  ["left-end", "左侧靠下"],
].map(([value, label]) => ({ value, label }));
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field">
          浮层位置
          <HysSelect
            v-model="placement"
            :options="positions"
            aria-label="浮层位置"
          />
        </label>
        <label class="demo-field">
          触发方式
          <HysSelect
            v-model="trigger"
            aria-label="触发方式"
            :options="[
              { label: '点击', value: 'click' },
              { label: '右键菜单', value: 'contextmenu' },
            ]"
          />
        </label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="arrow" label="显示箭头" />
        <HysCheckbox v-model="adjust" label="自动避让边缘" />
        <HysCheckbox v-model="dark" label="深色浮层" />
      </div>
    </div>
    <div class="demo-panel demo-control-actions">
      <HysPopconfirm
        :trigger="trigger"
        :placement="placement"
        :show-arrow="arrow"
        :auto-adjust-overflow="adjust"
        :effect="dark ? 'dark' : 'light'"
        title="停用分享链接？"
        description="停用后，访问者将无法通过原链接打开此文档。"
        :width="270"
        confirm-text="停用链接"
      >
        <HysButton>{{
          trigger === "contextmenu" ? "右键停用链接" : "停用链接"
        }}</HysButton>
      </HysPopconfirm>
      <span v-if="trigger === 'contextmenu'" class="hint"
        >也可以聚焦按钮后按 Shift + F10。</span
      >
    </div>
  </div>
</template>
