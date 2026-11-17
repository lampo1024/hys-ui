<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCard, HysStatistic } from "hys-ui";
const live = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCard>
        <HysStatistic
          title="平均响应时间"
          :value="live ? 164 : 218"
          :comparison-value="200"
          positive-direction="decrease"
          suffix="ms"
          animated
          ><template #footer>对比上周期</template></HysStatistic
        >
      </HysCard>
      <HysCard>
        <HysStatistic
          title="请求成功率"
          :value="live ? '0.9956' : '0.9714'"
          :comparison-value="'0.9892'"
          number-format="percent"
          :precision="2"
          comparison-mode="absolute"
          animated
        />
      </HysCard>
    </div>
    <HysButton variant="secondary" size="sm" @click="live = !live">{{
      live ? "查看高峰期" : "查看恢复后"
    }}</HysButton>
  </div>
</template>
