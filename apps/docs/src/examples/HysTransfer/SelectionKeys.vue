<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { HysTransfer, HysCheckbox, HysButton } from "hys-ui";
const value = ref<number[]>([12, 13]),
  checked = ref<number[]>([]),
  doubleClick = ref(true),
  large = ref(false);
const make = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      value: i,
      label: "资源 " + String(i + 1).padStart(3, "0"),
      disabled: i === 3 || i === 8,
    })),
  small = make(18),
  big = make(2000),
  options = computed(() => (large.value ? big : small));
function reset() {
  value.value = [12, 13];
  checked.value = [];
}
watch(large, reset);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="doubleClick" label="双击移动" /><HysCheckbox
        v-model="large"
        label="大量项目与虚拟列表"
      /><HysButton variant="ghost" size="sm" @click="reset">重置选择</HysButton>
    </div>
    <HysTransfer
      v-model="value"
      v-model:checked-keys="checked"
      :options="options"
      :move-on-double-click="doubleClick"
      :virtual="large"
      :list-height="280"
      show-invert
    />
    <output class="state-output"
      >已勾选 {{ checked.length }} 项 · 目标列表 {{ value.length }} 项</output
    >
    <p class="scenario-note">
      点击一个项目，再按住 Shift 点击另一个项目，可追加选择中间范围；Ctrl / Cmd
      点击逐项切换。禁用项自动跳过。大数据模式下，滚动后按 Shift
      选择同样覆盖尚未渲染的中间项目。
    </p>
    <p class="scenario-note">
      双击移动在组件中默认关闭，此示例已启用。启用时，文字/空白区域单击只聚焦，双击只移动当前项目，其他勾选项保持不变；输入框、复选框和项目内的链接/按钮保留自身行为。
    </p>
  </div>
</template>
