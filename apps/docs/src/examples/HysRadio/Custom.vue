<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadio, HysBadge } from "hys-ui";
import { Check } from "lucide-vue-next";
const value = ref("team");
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysRadio v-model="value" value="team" border
        ><span>团队版</span> <HysBadge>推荐</HysBadge
        ><template #icon="{ checked }"
          ><Check v-if="checked" :size="12" /></template></HysRadio
      ><HysRadio v-model="value" value="personal" border label="个人版" />
    </div>
    <output>{{ value }}</output>
  </div>
</template>
