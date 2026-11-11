<script setup lang="ts">
import { ref } from "vue";
import { HysAnimatedNumber, HysButton } from "hys-ui";

const total = ref("9007199254740993.105");
const deadline = ref(Date.now() + 15000);
const ended = ref(false);
function restart() {
  ended.value = false;
  deadline.value = Date.now() + 15000;
}
function updateTotal() {
  total.value = total.value.endsWith(".105")
    ? "9007199254740993.295"
    : "9007199254740993.105";
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysAnimatedNumber
        title="累计结算"
        :value="total"
        :precision="2"
        group-separator=","
        prefix="¥"
        :value-style="{ fontWeight: 650 }"
      />
      <HysButton size="sm" variant="secondary" @click="updateTotal"
        >切换结算金额</HysButton
      >
    </div>
    <div class="demo-control-actions">
      <HysAnimatedNumber
        title="审核倒计时"
        :deadline="deadline"
        format="mm:ss"
        effect="flip"
        @finish="ended = true"
      >
        <template #suffix>{{ ended ? "已结束" : "剩余" }}</template>
      </HysAnimatedNumber>
      <HysButton size="sm" variant="secondary" @click="restart"
        >开始 15 秒倒计时</HysButton
      >
    </div>
  </div>
</template>
