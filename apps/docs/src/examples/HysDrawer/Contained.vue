<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, HysInput } from "hys-ui";
const open = ref(false),
  outside = ref("容器外仍可交互");
</script>
<template>
  <div class="demo-stack">
    <HysInput v-model="outside" aria-label="容器外输入" />
    <div class="contained-drawer-demo">
      <HysButton size="sm" @click="open = true">在容器中打开</HysButton>
      <p>抽屉只覆盖这个容器。</p>
      <HysDrawer
        v-model:open="open"
        :append-to="false"
        contained
        :width="300"
        title="容器内详情"
        footer
        resizable
        ><p>
          contained
          使用定位父容器作为可用空间，默认不锁定整个页面滚动，也不限制容器外的焦点。
        </p></HysDrawer
      >
    </div>
  </div>
</template>
<style scoped>
.contained-drawer-demo {
  position: relative;
  isolation: isolate;
  min-height: 360px;
  border: 1px solid var(--docs-border);
  border-radius: 12px;
  overflow: hidden;
  padding: 20px;
  background: var(--docs-bg);
}
</style>
