<script setup lang="ts">
import { computed, ref } from "vue";
import { HysCard, HysSelect, HysStatistic } from "hys-ui";
const reporting = ref("CN");
const options = [
  { label: "中国 · CNY", value: "CN" },
  { label: "美国 · USD", value: "US" },
  { label: "德国 · EUR", value: "DE" },
];
const locales: Record<
  string,
  { locale: string; currency: string; value: string }
> = {
  CN: { locale: "zh-CN", currency: "CNY", value: "92004764.28" },
  US: { locale: "en-US", currency: "USD", value: "12784817.32" },
  DE: { locale: "de-DE", currency: "EUR", value: "11727350.04" },
};
const current = computed(() => locales[reporting.value]);
</script>
<template>
  <div class="demo-stack">
    <HysSelect v-model="reporting" :options="options" aria-label="报表地区" />
    <div class="demo-row">
      <HysCard
        ><HysStatistic
          title="月度结算金额"
          number-format="currency"
          v-bind="current"
      /></HysCard>
      <HysCard
        ><HysStatistic
          title="投递记录规模"
          value="125987602"
          :compact="reporting === 'CN' ? 'zh' : 'short'"
          :precision="1"
      /></HysCard>
    </div>
  </div>
</template>
