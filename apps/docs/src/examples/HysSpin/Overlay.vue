<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysNumberInput,
  HysSelect,
  HysSpin,
  type HysSpinPlacement,
} from "hys-ui";
const outer = ref(true),
  inner = ref(false),
  full = ref(false),
  blocked = ref(true),
  scrolling = ref(true),
  mask = ref(true),
  blur = ref(3),
  hits = ref(0);
const placement = ref<HysSpinPlacement>("center");
const placements = [
  { label: "居中", value: "center" },
  { label: "上方", value: "top" },
  { label: "右侧", value: "right" },
  { label: "左下", value: "bottom-start" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >提示位置<HysSelect
            v-model="placement"
            :options="placements"
            aria-label="提示位置"
        /></label>
        <label class="demo-field"
          >模糊（px）<HysNumberInput v-model="blur" :min="0" :max="12"
        /></label>
      </div>
    </div>
    <div class="demo-control-actions">
      <HysCheckbox v-model="outer" label="区域加载" />
      <HysCheckbox v-model="inner" label="嵌套加载" />
      <HysCheckbox v-model="blocked" label="禁止底层交互" />
      <HysCheckbox v-model="mask" label="显示遮罩" />
      <HysCheckbox v-model="scrolling" label="全屏锁定滚动" />
    </div>
    <div class="demo-panel">
      <HysSpin
        :spinning="outer"
        mode="overlay"
        :placement="placement"
        :block-interaction="blocked"
        :mask="mask"
        :blur="blur"
        :mask-opacity="0.64"
        message="正在同步工作台"
        region-height="126px"
      >
        <HysSpin
          :spinning="inner"
          size="sm"
          :block-interaction="blocked"
          message="刷新概览"
          region-height="66px"
        >
          <p>工作台概览 · 12 个项目</p>
        </HysSpin>
        <HysButton size="sm" variant="secondary" @click="hits++"
          >测试底层交互</HysButton
        >
      </HysSpin>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="full = true">打开全屏加载</HysButton>
    </div>
    <HysSpin
      v-model:spinning="full"
      mode="fullscreen"
      title="正在准备工作区"
      description="可点击取消或按 Escape 关闭"
      animation="gradient"
      :gradient="['#60a5fa', '#6366f1']"
      :lock-scroll="scrolling"
      :blur="4"
      cancellable
      escape-cancel
    />
    <output class="state-output">底层按钮已触发 {{ hits }} 次</output>
  </div>
</template>
