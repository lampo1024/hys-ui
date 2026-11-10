<script setup lang="ts">
import { ref } from "vue";
import { HysContextMenu, HysButton, HysCheckbox } from "hys-ui";
const open = ref(false),
  allowClose = ref(true),
  events = ref<string[]>([]);
function request(value: boolean) {
  events.value = [`请求${value ? "展开" : "关闭"}`, ...events.value].slice(
    0,
    4,
  );
  if (value || allowClose.value) open.value = value;
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="allowClose" label="允许关闭请求" /><HysButton
        size="sm"
        @click="open = !open"
        >外部切换</HysButton
      >
    </div>
    <div class="demo-content">
      <HysContextMenu
        :open="open"
        trigger="click"
        :items="[{ label: '确认操作', value: 'confirm' }]"
        @update:open="request"
        ><HysButton>受控菜单</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output"
      >实际状态：{{ open ? "展开" : "关闭" }} · {{ events.join(" · ") }}</output
    >
    <p class="scenario-note">
      open、openPath、checkedKeys、selectedKeys 均支持受控和非受控用法。update
      事件表示请求，visibleChange 表示实际浮层状态变化。
    </p>
  </div>
</template>
