<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCard, HysStatistic } from "hys-ui";
const revenue = ref(128540.25);
const orders = ref(860);
function refresh() {
  revenue.value += 1699.5;
  orders.value += 12;
}
</script>

<template>
  <div class="demo-stack">
    <div class="statistic-demo">
      <HysCard>
        <HysStatistic
          title="本月销售额"
          :value="revenue"
          :precision="2"
          prefix="¥"
          animated
          :trend="{ direction: 'up', text: '4.2%' }"
        >
          <template #footer>较上月同期</template>
        </HysStatistic>
      </HysCard>
      <HysCard
        ><HysStatistic title="已完成订单" :value="orders" suffix=" 单" animated
      /></HysCard>
    </div>
    <div>
      <HysButton variant="secondary" @click="refresh">录入一批订单</HysButton>
    </div>
  </div>
</template>

<style scoped>
.statistic-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 10px;
}
</style>
