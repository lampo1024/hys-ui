<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysModal } from "hys-ui";
const open = ref(false);
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">查看长内容</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="使用协议"
    description="滚动内容时，标题和操作区保持可见。"
    footer
    :width="680"
    :height="520"
    ok-text="同意协议"
  >
    <section v-for="item in 14" :key="item" style="margin-bottom: 20px">
      <h3>条款 {{ item }}</h3>
      <p>
        请妥善管理当前工作区的数据与成员权限。操作记录用于帮助协作成员了解更新内容；如需调整权限，请联系工作区管理员。
      </p>
    </section>
  </HysModal>
</template>
