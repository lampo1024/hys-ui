<script setup lang="ts">
import { defineComponent, h, KeepAlive, ref } from "vue";
import {
  HysUpload,
  HysButton,
  type HysUploadFile,
  type HysUploadRequestOptions,
} from "hys-ui";
const shown = ref(true),
  events = ref<string[]>([]);
const Cached = defineComponent({
  setup() {
    return () =>
      h(HysUpload<HysUploadFile>, {
        customRequest(options: HysUploadRequestOptions) {
          events.value.push("开始 " + options.file.name);
          let percent = 0;
          const timer = setInterval(() => {
            percent += 5;
            options.onProgress(percent);
            if (percent >= 100) {
              clearInterval(timer);
              options.onSuccess("Done");
            }
          }, 300);
          options.signal.addEventListener(
            "abort",
            () => {
              clearInterval(timer);
              events.value.push("已取消 " + options.file.name);
            },
            { once: true },
          );
          return () => clearInterval(timer);
        },
        listType: "picture",
        onSuccess: () => events.value.push("上传完成"),
      });
  },
});
const Other = defineComponent({
  setup: () => () =>
    h("p", "当前上传页面已缓存。返回后保留文件列表，不自动恢复请求。"),
});
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="shown = !shown">{{
        shown ? "暂时离开上传页面" : "返回上传页面"
      }}</HysButton>
    </div>
    <KeepAlive><component :is="shown ? Cached : Other" /></KeepAlive
    ><output class="state-output">{{
      events.slice(-5).join(" · ") || "添加文件后，在请求完成前切换页面"
    }}</output>
  </div>
</template>
