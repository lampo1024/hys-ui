<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysDataView, HysSelect } from "hys-ui";
const narrow = ref(false);
const columns = ref(3);
const items = [
  {
    id: "A1",
    label: "新仓上线交付资料",
    file: "warehouse_implementation_guidelines_and_rollback_checklist_2026.pdf",
  },
  {
    id: "A2",
    label: "财务交接政策",
    file: "finance_reconciliation_approval_checklist_v2.pdf",
  },
  {
    id: "A3",
    label: "客户问题升级指引",
    file: "customer_support_escalation_playbook.md",
  },
  { id: "A4", label: "供应商登记表", file: "supplier_registration.xlsx" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="narrow">使用 300px 窄容器</HysCheckbox>
      <HysSelect
        v-model="columns"
        aria-label="网格最多列数"
        size="sm"
        :options="
          [2, 3, 4].map((value) => ({ value, label: '最多 ' + value + ' 列' }))
        "
      />
    </div>
    <div
      class="demo-responsive-view"
      :style="{ maxWidth: narrow ? '300px' : undefined }"
    >
      <HysDataView
        :items="items"
        item-key="id"
        :grid-columns="columns"
        default-view="grid"
      >
        <template #item="{ item }"
          ><strong>{{ item.label }}</strong>
          <div>{{ item.file }}</div></template
        >
      </HysDataView>
    </div>
  </div>
</template>
