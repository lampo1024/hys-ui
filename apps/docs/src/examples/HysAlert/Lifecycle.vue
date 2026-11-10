<script setup lang="ts">
import { defineComponent, h, KeepAlive, ref } from "vue";
import { HysAlert, HysButton, type HysAlertCloseContext } from "hys-ui";
const shown = ref(true),
  events = ref<string[]>([]);
const Cached = defineComponent({
    setup: () => () =>
      h(HysAlert, {
        title: "缓存页面中的提示",
        description: "点击关闭后，在检查完成前离开此区域。",
        closable: true,
        beforeClose(context: HysAlertCloseContext) {
          events.value.push("开始检查");
          return new Promise<boolean>((resolve) => {
            const timer = setTimeout(() => resolve(true), 1200);
            context.signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timer);
                events.value.push("已取消检查");
                resolve(false);
              },
              { once: true },
            );
          });
        },
        onClose: () => events.value.push("发出关闭请求"),
      }),
  }),
  Other = defineComponent({ setup: () => () => h("p", "提示区域已缓存。") });
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="shown = !shown">{{
        shown ? "离开提示区域" : "返回提示区域"
      }}</HysButton>
    </div>
    <KeepAlive><component :is="shown ? Cached : Other" /></KeepAlive
    ><output class="state-output">{{
      events.join(" · ") || "等待操作"
    }}</output>
  </div>
</template>
