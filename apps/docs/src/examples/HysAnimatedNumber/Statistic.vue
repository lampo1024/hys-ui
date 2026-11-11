<script setup lang="ts">
import { ref } from "vue";
import { HysAnimatedNumber, HysButton } from "hys-ui";

const deadline = ref(Date.now() + 125000);
const ended = ref(false);
function restart() {
  ended.value = false;
  deadline.value = Date.now() + 125000;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysAnimatedNumber
        title="累计结算"
        value="9007199254740993.105"
        :precision="2"
        group-separator=","
        prefix="¥"
        :value-style="{ fontWeight: 650 }"
      />
      <HysAnimatedNumber
        title="审核倒计时"
        :deadline="deadline"
        format="mm:ss"
        @finish="ended = true"
      >
        <template #suffix>{{ ended ? "已结束" : "剩余" }}</template>
      </HysAnimatedNumber>
      <HysButton size="sm" variant="secondary" @click="restart"
        >重新开始</HysButton
      >
    </div>
  </div>
</template>
