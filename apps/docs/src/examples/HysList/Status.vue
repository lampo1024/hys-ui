<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysList, HysTag } from "hys-ui";
const loading = ref(false);
const empty = ref(false);
const items = [{ key: "a", title: "清点凭证归档", description: "该清单已在本地保留，恢复网络后可继续处理。"}];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row"><HysCheckbox v-model="loading">加载中</HysCheckbox><HysCheckbox v-model="empty">空数据</HysCheckbox></div>
     <HysList :items="empty ? [] : items" :loading="loading" bordered compact>
       <template #actions><HysTag tone="success" size="sm">已保存</HysTag></template>
     </HysList>
  </div>
</template>
