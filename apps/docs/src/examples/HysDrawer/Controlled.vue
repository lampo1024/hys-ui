<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, HysCheckbox } from "hys-ui";
const open = ref(false),
  legacy = ref(false),
  accept = ref(true),
  result = ref("尚未请求");
function update(value: boolean) {
  result.value = value ? "请求展开" : "请求关闭";
  if (accept.value) open.value = value;
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="accept" label="接受显示状态请求" /><HysButton
        @click="open = true"
        >受控显示</HysButton
      ><HysButton variant="secondary" @click="legacy = true"
        >旧 close 事件用法</HysButton
      >
    </div>
    <output class="state-output">{{ result }}</output
    ><HysDrawer :open="open" title="受控抽屉" footer @update:open="update"
      ><p>
        调用方可拒绝关闭请求。open 优先于 modelValue；未提供绑定时可使用
        defaultOpen 和实例 show / close。
      </p>
      <HysButton
        size="sm"
        variant="ghost"
        @click="
          accept = true;
          open = false;
        "
        >允许并关闭</HysButton
      ></HysDrawer
    ><HysDrawer :open="legacy" title="兼容已有代码" @close="legacy = false"
      ><p>
        原有 :open 和 @close 方式保持可用。close
        表示守卫通过后的请求通知，closed 表示退出完成。
      </p></HysDrawer
    >
  </div>
</template>
