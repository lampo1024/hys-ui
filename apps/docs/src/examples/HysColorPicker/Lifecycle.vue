<script setup lang="ts">
import { ref, defineComponent, h, KeepAlive } from "vue";
import { HysColorPicker, HysButton } from "hys-ui";
const shown = ref(true),
  color = ref("#3867f5");
const Cached = defineComponent({
    setup: () => () =>
      h(HysColorPicker, {
        modelValue: color.value,
        "onUpdate:modelValue": (value: string) => (color.value = value),
        label: "缓存颜色",
        showAlpha: true,
      }),
  }),
  Other = defineComponent({
    render: () => h("p", "颜色区域已缓存，浮层和手势已释放。"),
  });
</script>
<template>
  <div class="demo-stack">
    <HysButton @click="shown = !shown">{{
      shown ? "离开颜色区域" : "返回颜色区域"
    }}</HysButton
    ><KeepAlive><component :is="shown ? Cached : Other" /></KeepAlive
    ><output class="state-output">{{ color }}</output>
    <p class="scenario-note">
      离开时关闭面板并清理连续编辑，已接受的颜色保留；返回后可重新打开面板。
    </p>
  </div>
</template>
