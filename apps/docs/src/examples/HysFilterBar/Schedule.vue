<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysFilterBar,
  type HysFilterField,
  type HysFilterValues,
} from "hys-ui";
const deliveries = [
  { area: "杭州", arrive: "2026-11-20", created: "2026-11-14" },
  { area: "绍兴", arrive: "2026-11-20", created: "2026-11-10" },
  { area: "宁波", arrive: "2026-11-22", created: "2026-11-16" },
];
const fields: HysFilterField[] = [
  { key: "arrive", label: "到货日", type: "date", placeholder: "选择到货日" },
  { key: "created", label: "创建日期范围", type: "date-range" },
];
const defaults = {
  arrive: "2026-11-20",
  created: ["2026-11-12", "2026-11-17"],
};
const applied = ref<HysFilterValues>(defaults);
const matching = computed(() => {
  const [start, end] = Array.isArray(applied.value.created)
    ? applied.value.created
    : [];
  return deliveries.filter(
    (item) =>
      (!applied.value.arrive || item.arrive === applied.value.arrive) &&
      (!start || item.created >= start) &&
      (!end || item.created <= end),
  );
});
</script>

<template>
  <div class="demo-stack">
    <HysFilterBar
      :fields="fields"
      :initial-values="defaults"
      @search="applied = $event"
      @reset="applied = $event"
    />
    <div role="status">
      <div v-for="item in matching" :key="item.area">
        {{ item.area }} · {{ item.arrive }} 到货
      </div>
      <span v-if="!matching.length">没有符合条件的送货安排</span>
    </div>
  </div>
</template>
