<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysInput } from "hys-ui";

const amount = ref("128.50");
const reference = ref("PO-2026-014");
const allowClear = ref(true);
const action = ref("");
</script>

<template>
  <div class="demo-stack">
    <div class="input-demo-grid">
      <HysInput
        v-model="amount"
        label="结算金额"
        size="large"
        inputmode="decimal"
        addon-before="¥"
        addon-after="CNY"
        :allow-clear="allowClear"
        :input-style="{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }"
        @keydown.enter="action = '已确认金额'"
      />
      <HysInput
        v-model="reference"
        label="采购编号"
        size="large"
        autocomplete="off"
        :input-props="{ spellcheck: false }"
        :allow-clear="allowClear"
        @clear="action = '已清空采购编号'"
      />
    </div>
    <div class="demo-control-actions">
      <HysCheckbox v-model="allowClear" label="显示清空按钮" />
      <span v-if="action" class="input-result" role="status">{{ action }}</span>
    </div>
  </div>
</template>

<style scoped>
.input-result {
  color: var(--docs-muted);
  font-size: 0.8rem;
}
</style>
