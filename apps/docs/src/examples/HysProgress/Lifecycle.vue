<script setup lang="ts">
import { ref, defineComponent, h, KeepAlive } from "vue";
import { HysProgress, HysButton } from "hys-ui";
const shown = ref(true);
const Cached = defineComponent({
    setup: () => () =>
      h(HysProgress, {
        value: 65,
        indeterminate: true,
        type: "circle",
        ariaLabel: "缓存中的进度",
        format: () => "加载中",
      }),
  }),
  Other = defineComponent({
    setup: () => () => h("p", "当前进度区域已缓存，返回时恢复显示。"),
  });
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="shown = !shown">{{
        shown ? "暂时离开" : "返回进度区域"
      }}</HysButton>
    </div>
    <div class="demo-content progress-examples">
      <KeepAlive><component :is="shown ? Cached : Other" /></KeepAlive>
    </div>
    <p class="scenario-note">
      进度组件不启动 JavaScript
      定时器或逐帧监听。缓存页面离开时停止自身动画，返回后恢复。
    </p>
  </div>
</template>
