<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup, HysRadio, HysBadge } from "hys-ui";
const value = ref("team");
</script>
<template>
  <div class="demo-content">
    <HysRadioGroup v-model="value" type="button" aria-label="套餐类型"
      ><HysRadio value="personal">个人版</HysRadio
      ><HysRadio value="team">团队版 <HysBadge>推荐</HysBadge></HysRadio
      ><HysRadio value="enterprise" disabled>企业版</HysRadio></HysRadioGroup
    ><output>{{ value }}</output>
  </div>
</template>
