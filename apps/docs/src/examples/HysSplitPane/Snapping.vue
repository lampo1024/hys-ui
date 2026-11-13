<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSplitPane,
  type HysSplitPanePanelOptions,
} from "hys-ui";

const ratio = ref(40);
const snap = ref(true);
const lazy = ref(false);
const feedback = ref("");
const firstPanel: HysSplitPanePanelOptions = {
  min: "20%",
  max: "80%",
  snapPoints: ["33%", "50%", "67%"],
};

function finish(value: number, { cancelled }: { cancelled: boolean }) {
  feedback.value = cancelled
    ? "已取消，尺寸已恢复"
    : `已调整为 ${Math.round(value)}%`;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="snap" label="启用吸附" />
      <HysCheckbox v-model="lazy" label="释放后调整" />
      <HysButton
        size="sm"
        variant="secondary"
        @click="
          ratio = 40;
          feedback = '';
        "
        >恢复比例</HysButton
      >
    </div>
    <HysSplitPane
      v-model="ratio"
      class="comparison"
      aria-label="调整原文与修订稿比例"
      :first-panel="firstPanel"
      :snap-threshold="snap ? 14 : 0"
      :lazy="lazy"
      cancel-behavior="restore"
      @resize-start="feedback = ''"
      @resize-end="finish"
    >
      <template #first>
        <section class="comparison-pane original">
          <h4>原文</h4>
          <p>每周五发送汇总邮件，包含过去一周的工单处理情况。</p>
        </section>
      </template>
      <template #second>
        <section class="comparison-pane">
          <h4>修订稿</h4>
          <p>每周五下午发送工单周报，列出本周已完成和待跟进事项。</p>
        </section>
      </template>
    </HysSplitPane>
    <output class="state-output">
      左侧 {{ Math.round(ratio) }}% · 吸附点 33% / 50% / 67% · 拖动时按 Esc 取消
      <span v-if="feedback"> · {{ feedback }}</span>
    </output>
  </div>
</template>

<style scoped>
.comparison {
  height: 172px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 10px;
}
.comparison-pane {
  padding: 14px;
  min-block-size: 100%;
}
.comparison-pane h4 {
  margin: 0 0 10px;
}
.comparison-pane p {
  margin: 0;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.original {
  background: var(--hys-ui-theme-surface-alt);
}
</style>
