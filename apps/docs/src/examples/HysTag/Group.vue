<script setup lang="ts">
import { ref } from "vue";
import { HysTag, type HysTagGroupItem } from "hys-ui";
const items = ref<HysTagGroupItem[]>(["库存编辑","订单分派","异常复核","报表导出","账单审批"].map((label, key) => ({key,label,selected:key===0})));
</script>

<template>
  <div class="demo-stack">
    <HysTag :items="items" :max-visible="2" group-label="权限范围" selectable closable
      @select-item="(key, selected) => items = items.map(item => item.key === key ? {...item, selected} : item)"
      @close-item="key => items = items.filter(item => item.key !== key)" />
  </div>
</template>
