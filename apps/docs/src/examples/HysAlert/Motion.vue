<script setup lang="ts">
import { ref } from "vue";
import {
  HysAlert,
  HysButton,
  HysSelect,
  type HysAlertTransition,
} from "hys-ui";
const transition = ref<HysAlertTransition>("collapse"),
  visible = ref(true),
  phase = ref("已显示");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >动画类型<HysSelect
          v-model="transition"
          :options="
            ['fade', 'slide', 'collapse', 'none'].map((value) => ({
              label: value,
              value,
            }))
          " /></label
      ><HysButton
        @click="
          visible = true;
          phase = '已显示';
        "
        >显示提示</HysButton
      >
    </div>
    <HysAlert
      v-model:visible="visible"
      :transition="transition"
      :transition-duration="400"
      title="关闭动画示例"
      description="collapse 会平滑收起占用的空间；关闭后，下方内容回到原位。"
      closable
      @close="phase = '开始关闭'"
      @after-close="phase = '退出完成'"
    /><output class="state-output">{{ phase }}</output>
    <p class="scenario-note">
      系统减少动态效果与全局关闭动效优先；动画期间的内容不可交互。
    </p>
  </div>
</template>
