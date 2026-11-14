<script setup lang="ts">
import { ref } from "vue";
import { HysAccordion, HysButton } from "hys-ui";

const accordion = ref<InstanceType<typeof HysAccordion>>();
const items = [
  {
    id: "payment",
    title: "付款确认",
    content: "支付完成后，付款凭证会发送至财务邮箱。",
  },
  {
    id: "delivery",
    title: "交付安排",
    content: "仓库确认到货时间后，由采购联系人安排验收。",
  },
];

async function showDelivery() {
  await accordion.value?.expand("delivery");
  accordion.value?.focus("delivery");
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="showDelivery"
        >定位交付安排</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        @click="accordion?.collapse('delivery')"
        >收起交付安排</HysButton
      >
    </div>
    <HysAccordion ref="accordion" :items="items" :heading-level="4" />
  </div>
</template>
