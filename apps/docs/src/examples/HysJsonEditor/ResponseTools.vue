<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysJsonEditor, type HysJsonEditorView } from "hys-ui";

const json = ref([
  "{",
  '  "orders": [',
  '    {"id": 9007199254740993, "status": "待发货", "details": {"quantity": 2}},',
  '    {"id": 9007199254740992, "status": "已发货", "details": {"quantity": 1}}',
  "  ]",
  "}",
].join("\n"));
const view = ref<HysJsonEditorView>("table");
const baseline = ref(false);
const comparison = '{"orders":[{"id":9007199254740993,"status":"已发货","details":{"quantity":2}},{"id":9007199254740992,"status":"已发货","details":{"quantity":1}}]}';
</script>

<template>
  <div class="demo-stack">
    <HysJsonEditor v-model="json" v-model:view="view" />
    <p class="scenario-note">点击 id 列排序，选中 status 单元格后编辑。用 JSONPath 查询 <code>$.orders[?@.id == 9007199254740993].status</code> 并定位结果。</p>
    <div>
      <HysButton size="sm" variant="secondary" :aria-expanded="baseline" @click="baseline = !baseline">{{ baseline ? "收起对比样例" : "查看对比样例" }}</HysButton>
      <pre v-if="baseline" class="hys-json-example-code">{{ comparison }}</pre>
    </div>
    <p class="scenario-note">把样例粘贴到「结构对比」，查看 /orders/0/status 的变化。</p>
  </div>
</template>

<style scoped>
.hys-json-example-code { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
