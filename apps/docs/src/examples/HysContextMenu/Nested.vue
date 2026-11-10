<script setup lang="ts">
import { ref } from "vue";
import { HysModal, HysContextMenu, HysButton } from "hys-ui";
const open = ref(false),
  result = ref("尚未操作");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="open = true">弹窗内的菜单</HysButton>
    </div>
    <HysModal v-model:open="open" title="资源操作"
      ><div class="demo-stack">
        <p>菜单挂载到 body，同步当前主题与弹窗层级。</p>
        <HysContextMenu
          trigger="click"
          :items="[
            {
              label: '导出',
              value: 'export',
              children: [
                { label: 'CSV 文件', value: 'csv' },
                { label: 'PDF 文件', value: 'pdf' },
              ],
            },
            { label: '复制资源', value: 'copy' },
          ]"
          @select="result = String($event)"
          ><HysButton>资源操作</HysButton></HysContextMenu
        ><output class="state-output">{{ result }}</output>
      </div></HysModal
    >
    <p class="scenario-note">
      Esc
      先关闭最上层菜单，再关闭弹窗。父弹窗隐藏或缓存页面离开时，菜单浮层与待执行操作一并清理，不会留在页面中。
    </p>
  </div>
</template>
