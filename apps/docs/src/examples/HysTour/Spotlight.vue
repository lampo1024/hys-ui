<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysTour, type HysTourStep } from "hys-ui";

const open = ref(false);
const current = ref(0);
const saved = ref(false);
const allowTargetClick = ref(true);
const steps: HysTourStep[] = [
  {
    target: "#tour-spotlight-save",
    title: "保存草稿",
    description: "可以直接点击高亮区域中的保存按钮。",
    placement: "bottom-start",
    gap: { offset: [12, 8], radius: 10 },
  },
  {
    target: "#tour-spotlight-history",
    title: "查看历史记录",
    description: "引导卡片会跟随滚动容器中的目标。这一步可以操作背景。",
    placement: "right-start",
    mask: false,
    type: "primary",
    arrow: { pointAtCenter: true },
  },
  { title: "引导完成", description: "没有关联目标的步骤显示在视口中央。" },
];
</script>

<template>
  <div class="demo-panel tour-example">
    <HysButton @click="current = 0; open = true">开始操作引导</HysButton>
    <HysButton id="tour-spotlight-save" variant="secondary" @click="saved = true">保存草稿</HysButton>
    <label><input v-model="allowTargetClick" type="checkbox" /> 允许点击高亮目标</label>
    <output v-if="saved" aria-live="polite">草稿已保存</output>
    <div class="tour-example-scroll" tabindex="0" aria-label="项目设置">
      <p>工作区名称</p>
      <p>项目可见范围</p>
      <p>消息通知</p>
      <p>更新记录</p>
      <HysButton id="tour-spotlight-history" variant="secondary">查看历史记录</HysButton>
    </div>
    <HysTour
      v-model:open="open"
      v-model:current="current"
      :steps="steps"
      :mask="{ color: 'rgba(15, 23, 42, 0.62)' }"
      :target-area-clickable="allowTargetClick"
    />
  </div>
</template>

<style scoped>
.tour-example {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.tour-example-scroll {
  flex: 0 0 100%;
  max-height: 112px;
  overflow: auto;
  padding: 8px 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
}
</style>
