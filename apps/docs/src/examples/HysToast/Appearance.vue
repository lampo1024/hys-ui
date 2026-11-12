<script setup lang="ts">
import { h, ref } from "vue";
import { BellRing } from "lucide-vue-next";
import {
  HysButton,
  HysCheckbox,
  HysSelect,
  useHysToast,
  type HysTheme,
} from "hys-ui";
const theme = ref<HysTheme>("blue"),
  glass = ref(true),
  english = ref(false);
const toast = useHysToast({
  maxCount: 1,
  duration: 0,
  position: "bottom-center",
});
function show() {
  toast.show({
    id: "appearance",
    theme: theme.value,
    glass: glass.value,
    type: "custom",
    width: 380,
    header: () => h("span", "月报审核"),
    content: () =>
      h("div", [
        h("strong", "华东区 · 经营分析"),
        h("div", "等待财务确认，审核通过后会通知订阅者。".repeat(6)),
      ]),
    icon: () => h(BellRing, { size: 18 }),
    footer: () => h("small", "报表编号 HY-06"),
    maxLines: 2,
    progress: 65,
    progressStyle: { background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" },
    toastStyle: {
      borderRadius: "14px",
      boxShadow: "0 10px 28px #162a4d24",
      opacity: 0.98,
    },
    copyable: true,
    copyText: "华东区经营分析，报表编号 HY-06",
    locale: english.value
      ? {
          close: "Dismiss",
          copy: "Copy report ID",
          copied: "Copied",
          copyFailed: "Copy unavailable",
          expand: "Read more",
          collapse: "Show less",
          progress: "Review progress",
        }
      : undefined,
    actionLayout: "footer",
  });
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        >提示主题<HysSelect
          v-model="theme"
          :options="[
            { label: '亮色', value: 'blue' },
            { label: '深色', value: 'dark' },
            { label: '紫色', value: 'purple' },
          ]"
          aria-label="提示主题"
      /></label>
      <HysCheckbox v-model="glass" label="毛玻璃背景" />
      <HysCheckbox v-model="english" label="使用英文控件文案" />
    </div>
    <div class="demo-control-actions">
      <HysButton @click="show">预览定制提示</HysButton>
      <HysButton variant="ghost" @click="toast.close('appearance')"
        >关闭预览</HysButton
      >
    </div>
    <p class="scenario-note">
      长内容默认折叠为两行，展开后可滚动阅读。再次预览会更新同一条提示。
    </p>
  </div>
</template>
