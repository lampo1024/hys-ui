<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysModal, HysSelect } from "hys-ui";
const open = ref(false),
  mode = ref("center");
</script>
<template>
  <div class="demo-content">
    <HysSelect
      v-model="mode"
      style="width: 220px"
      :options="[
        { label: '垂直居中', value: 'center' },
        { label: '距离顶部 80px', value: 'top' },
        { label: '全屏工作区', value: 'full' },
      ]"
    /><HysButton @click="open = true">查看布局</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="布局预览"
    footer
    :centered="mode !== 'top'"
    :top="80"
    :default-fullscreen="mode === 'full'"
    :fullscreen="mode === 'full'"
    :width="720"
    :center="mode === 'center'"
  >
    <p>
      弹窗宽度受视口限制；窄屏仍保留边距。center 让标题和底部操作居中，centered
      控制整个弹窗的垂直对齐。
    </p>
  </HysModal>
</template>
