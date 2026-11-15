<script setup lang="ts">
import { ref } from "vue";
import { HysJsonEditor } from "hys-ui";

const json = ref(`{
  "orderId": 9007199254740993,
  "status": "已发货",
  "items": [
    {"name": "键盘", "quantity": 2},
    {"name": "显示器", "quantity": 1}
  ]
}`);
</script>

<template>
  <div class="demo-stack">
    <HysJsonEditor v-model="json" compactable />
    <p class="scenario-note">切到「树视图」，搜索“显示器”，选中匹配节点后可复制路径或定位到源码。格式化和压缩后，订单号仍为 9007199254740993。</p>
  </div>
</template>
