<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, shallowRef, watch } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSelect,
  createHysToast,
  hysToast,
  useHysToast,
  type HysToastConfig,
  type HysToastHandle,
} from "hys-ui";

const layout = ref<NonNullable<HysToastConfig["layout"]>>("layered"),
  layerTrigger = ref<NonNullable<HysToastConfig["layerTrigger"]>>("both"),
  compact = ref(true),
  target = ref<HTMLElement>();
const local = useHysToast({
  maxCount: 4,
  duration: 0,
  position: "bottom-left",
  layout: "layered",
  collapsedCount: 2,
  gap: 12,
});
const global = shallowRef<HysToastHandle>();
let scoped: ReturnType<typeof createHysToast> | undefined;
watch([layout, compact, layerTrigger], ([layout, collapse, layerTrigger]) =>
  local.configure({ layout, layerTrigger, collapsedCount: collapse ? 2 : 0 }),
);
function group() {
  local.closeAll();
  for (const [index, message] of [
    "已同步配置",
    "报告生成完成",
    "同步成员列表",
    "已归档日志",
  ].entries()) {
    local.info({ id: "stack-" + index, message });
  }
}
function move() {
  const item = local.find("stack-0");
  if (item)
    local.update(item.id, {
      position: item.position === "bottom-left" ? "top-right" : "bottom-left",
      offsetX: 32,
    });
}
function custom() {
  if (!target.value) return;
  scoped ??= createHysToast({
    appendTo: target.value,
    maxCount: 1,
    position: "custom",
    coordinates: {
      right: "max(32px, env(safe-area-inset-right))",
      bottom: "20vh",
    },
    duration: 5000,
  });
  scoped.info({ id: "custom-position", message: "独立容器 · 自定义位置" });
}
function cleanup() {
  global.value?.close();
  scoped?.dispose();
  scoped = undefined;
}
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        >消息布局<HysSelect
          v-model="layout"
          :options="[
            { label: '垂直堆叠', value: 'vertical' },
            { label: '水平排列', value: 'horizontal' },
            { label: '层叠预览', value: 'layered' },
          ]"
          aria-label="消息布局"
      /></label>
      <label v-if="layout === 'layered'" class="demo-field">
        展开方式
        <HysSelect
          v-model="layerTrigger"
          aria-label="展开方式"
          :options="[
            { label: '悬停或点击', value: 'both' },
            { label: '悬停预览', value: 'hover' },
            { label: '点击展开', value: 'click' },
          ]"
        />
      </label>
      <HysCheckbox v-else v-model="compact" label="折叠超过两条的提示" />
    </div>
    <div class="demo-control-actions">
      <HysButton @click="group">显示一组提示</HysButton>
      <HysButton variant="secondary" @click="move">切换第一条的位置</HysButton>
      <HysButton variant="secondary" @click="custom"
        >自定义位置与容器</HysButton
      >
      <HysButton
        variant="secondary"
        @click="
          global = hysToast.info({
            id: 'demo-global',
            message: '来自共享服务的提示',
          })
        "
        >全局提示</HysButton
      >
      <HysButton
        variant="ghost"
        @click="
          local.closeAll();
          cleanup();
        "
        >清理示例提示</HysButton
      >
    </div>
    <div ref="target" />
    <p class="scenario-note">
      悬停层叠提示可预览，移开后收起。点击展开按钮可固定展开，也可用 Tab 和
      Enter 操作。
    </p>
  </div>
</template>
