<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysModal, HysSelect } from "hys-ui";
const open = ref(false),
  transition = ref("scale");
</script>
<template>
  <div class="demo-content">
    <HysSelect
      v-model="transition"
      style="width: 220px"
      :options="[
        { label: '柔和缩放', value: 'scale' },
        { label: '淡入淡出', value: 'fade' },
        { label: '向下滑入', value: 'slide' },
        { label: '关闭动画', value: 'none' },
      ]"
    /><HysButton @click="open = true">预览切换动画</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="弹窗动效"
    footer
    :transition="transition"
    :transition-duration="220"
    ><p>
      动效支持名称或 Vue Transition
      配置。系统减少动态效果与全局关闭动效设置优先。
    </p></HysModal
  >
</template>
