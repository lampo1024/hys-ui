<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysDataView } from "hys-ui";
const records = ref<string[]>([]);
const loading = ref(false);
const error = ref("知识库暂时无法访问");
async function refresh() {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 500));
  records.value = ["配送异常处置", "售后签收说明", "账单差异核查"];
  error.value = "";
  loading.value = false;
}
function simulate() {
  records.value = [];
  error.value = "知识库暂时无法访问";
}
</script>
<template>
  <HysDataView
    :items="records"
    :loading="loading"
    :error="error"
    default-view="grid"
    @retry="refresh"
  >
    <template #toolbar
      ><HysButton
        size="sm"
        variant="secondary"
        :disabled="loading || !!error"
        @click="simulate"
        >模拟连接中断</HysButton
      ></template
    >
    <template #item="{ item }"
      ><strong>{{ item }}</strong></template
    >
  </HysDataView>
</template>
