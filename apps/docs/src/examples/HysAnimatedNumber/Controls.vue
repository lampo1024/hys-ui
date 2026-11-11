<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCheckbox,
  HysSlider,
  type HysAnimatedNumberInstance,
  type HysNumberFrame,
} from "hys-ui";

const animation = useTemplateRef<HysAnimatedNumberInstance>("animation");
const progress = ref(0);
const alternate = ref(false);
const status = ref("就绪");
function readFrame(frame: HysNumberFrame) {
  progress.value = Math.round(frame.progress * 100);
}
function reset() {
  animation.value?.reset();
  progress.value = 0;
  status.value = "就绪";
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview">
      <HysAnimatedNumber
        ref="animation"
        title="当前计数"
        trigger="manual"
        :from="0"
        :value="900"
        :duration="2200"
        :loop="alternate ? 2 : 1"
        :alternate="alternate"
        effect="odometer"
        :minimum-integer-digits="3"
        easing="linear"
        :value-style="{ fontSize: '2rem', fontWeight: 650 }"
        @start="status = '播放中'"
        @pause="status = '已暂停'"
        @resume="status = '播放中'"
        @progress="readFrame"
        @end="status = '已完成'"
        @cancel="status = '已停止'"
      />
      <div class="control-progress">
        <div class="control-progress-label">
          <span
            >播放进度 <strong>{{ progress }}%</strong></span
          >
          <span role="status">{{ status }}</span>
        </div>
        <HysSlider
          :model-value="progress"
          aria-label="播放进度"
          :show-value="false"
          @update:model-value="animation?.seek(Number($event) / 100)"
        />
      </div>
    </div>
    <div class="demo-control-actions">
      <div class="demo-toolbar-actions" role="group" aria-label="播放操作">
        <HysButton size="sm" @click="animation?.play()">播放</HysButton>
        <HysButton size="sm" variant="secondary" @click="animation?.pause()"
          >暂停</HysButton
        >
        <HysButton size="sm" variant="secondary" @click="animation?.resume()"
          >继续</HysButton
        >
        <HysButton size="sm" variant="secondary" @click="animation?.reverse()"
          >反向</HysButton
        >
        <HysButton size="sm" variant="secondary" @click="animation?.stop()"
          >停止</HysButton
        >
      </div>
      <div class="demo-toolbar-actions" role="group" aria-label="进度定位">
        <HysButton
          size="sm"
          variant="secondary"
          @click="animation?.finishAnimation()"
          >跳到终点</HysButton
        >
        <HysButton size="sm" variant="ghost" @click="reset">回到起点</HysButton>
      </div>
      <HysCheckbox v-model="alternate" label="往返两轮" />
    </div>
  </div>
</template>

<style scoped>
.control-progress {
  display: grid;
  flex: 1 1 16rem;
  gap: 4px;
}
.control-progress-label {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  color: var(--docs-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.control-progress-label strong {
  color: var(--docs-text);
  font-weight: 650;
}
.demo-toolbar-actions {
  gap: 6px;
}
</style>
