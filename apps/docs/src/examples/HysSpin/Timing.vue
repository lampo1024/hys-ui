<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref } from "vue";
import { HysButton, HysNumberInput, HysSpin } from "hys-ui";
const spinning = ref(false),
  delay = ref(200),
  minimum = ref(450),
  auto = ref(0),
  outcome = ref("等待操作");
let timer: ReturnType<typeof setTimeout> | undefined;
function clear() {
  clearTimeout(timer);
}
function start(duration?: number) {
  clear();
  spinning.value = true;
  outcome.value = "已请求加载";
  if (duration)
    timer = setTimeout(() => {
      spinning.value = false;
    }, duration);
}
function stop() {
  clear();
  spinning.value = false;
}
onDeactivated(stop);
onBeforeUnmount(stop);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >延迟显示（ms）<HysNumberInput
            v-model="delay"
            :min="0"
            :max="3000"
            :step="50"
        /></label>
        <label class="demo-field"
          >最短可见时间（ms）<HysNumberInput
            v-model="minimum"
            :min="0"
            :max="3000"
            :step="50"
        /></label>
        <label class="demo-field"
          >自动结束（ms）<HysNumberInput
            v-model="auto"
            :min="0"
            :max="5000"
            :step="100"
        /></label>
      </div>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="start(100)">模拟 100 ms 请求</HysButton>
      <HysButton variant="secondary" @click="start(500)"
        >模拟 500 ms 请求</HysButton
      >
      <HysButton variant="secondary" @click="start()">持续显示</HysButton>
      <HysButton variant="ghost" @click="stop">手动结束</HysButton>
    </div>
    <HysSpin
      v-model:spinning="spinning"
      :delay="delay"
      :min-duration="minimum"
      :auto-end="auto"
      mode="block"
      region-height="54px"
      message="加载中"
      @show="outcome = '指示器已显示'"
      @hide="outcome = '指示器已隐藏'"
      @end="!outcome.includes('已显示') && (outcome = '请求已结束')"
    />
    <output class="state-output">{{ outcome }}</output>
  </div>
</template>
