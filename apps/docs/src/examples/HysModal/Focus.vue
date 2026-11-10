<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysInput, HysModal, HysSelect } from "hys-ui";
const open = ref(false),
  target = ref("cancel");
</script>
<template>
  <div class="demo-content">
    <HysSelect
      v-model="target"
      style="width: 240px"
      :options="[
        { label: '取消按钮（安全操作）', value: 'cancel' },
        { label: '确认按钮', value: 'confirm' },
        { label: '备注输入', value: '#modal-focus-note' },
        { label: '整个对话框', value: 'dialog' },
      ]"
    /><HysButton @click="open = true">检查键盘与焦点</HysButton>
  </div>
  <HysModal v-model:open="open" title="初始焦点" footer :initial-focus="target"
    ><HysInput
      id="modal-focus-note"
      label="备注"
      placeholder="可以通过 Tab 切换"
    />
    <p>
      Tab / Shift + Tab 在弹窗内循环，关闭后焦点返回打开按钮。Escape
      只影响最上层弹窗。
    </p></HysModal
  >
</template>
