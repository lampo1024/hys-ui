<script setup lang="ts">
import { ref } from "vue";
import { HysJsonEditor } from "hys-ui";

const json = ref(`{
  "orderId": 9007199254740993,
  "status": "待复核",
  "status": "已处理"
}`);
</script>

<template>
  <div class="demo-stack">
    <HysJsonEditor v-model="json" compactable />
    <p class="scenario-note">先用「下载 JSON」保存样例，再把源码改成 {}。使用「导入 JSON」重新打开文件，确认替换后可查看重复键提示，并用「撤销」恢复为 {}。</p>
  </div>
</template>
