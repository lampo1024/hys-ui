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
    <HysSlider
      :model-value="progress"
      aria-label="动画进度"
      @update:model-value="animation?.seek(Number($event) / 100)"
    />
    <div class="demo-control-actions">
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
      <HysButton
        size="sm"
        variant="secondary"
        @click="animation?.finishAnimation()"
        >跳到终点</HysButton
      >
      <HysButton size="sm" variant="ghost" @click="reset">回到起点</HysButton>
      <HysCheckbox v-model="alternate" label="往返两轮" />
    </div>
    <output>{{ status }} · {{ progress }}%</output>
  </div>
</template>
