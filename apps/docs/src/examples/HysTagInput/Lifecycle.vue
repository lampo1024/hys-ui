<script setup lang="ts">
import { ref, defineComponent, h, KeepAlive } from "vue";
import { HysTagInput, HysButton, type HysTagInputAddContext } from "hys-ui";
const shown = ref(true),
  events = ref<string[]>([]);
const Cached = defineComponent({
    setup: () => () =>
      h(HysTagInput, {
        defaultValue: ["缓存标签"],
        ariaLabel: "缓存标签输入",
        beforeAdd(value: string, c: HysTagInputAddContext) {
          events.value.push("检查 " + value);
          return new Promise<boolean>((resolve) => {
            const timer = setTimeout(() => resolve(true), 1400);
            c.signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timer);
                events.value.push("检查已取消");
                resolve(false);
              },
              { once: true },
            );
          });
        },
      }),
  }),
  Other = defineComponent({ render: () => h("p", "标签区域已缓存。") });
</script>
<template>
  <div class="demo-stack">
    <HysButton @click="shown = !shown">{{
      shown ? "离开标签区域" : "返回标签区域"
    }}</HysButton
    ><KeepAlive><component :is="shown ? Cached : Other" /></KeepAlive
    ><output class="state-output">{{
      events.join(" · ") || "开始添加后，可立即离开区域测试取消"
    }}</output>
  </div>
</template>
