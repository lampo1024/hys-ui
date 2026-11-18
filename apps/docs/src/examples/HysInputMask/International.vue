<script setup lang="ts">
import { ref } from "vue";
import { HysInputMask } from "hys-ui";
const raw = ref("");
const formatted = ref("");
const mask = (text: string) => /^外/.test(text) ? "A-AA-NNNN" : "AA-NNNN";
const rules = { N: /\p{Nd}/u };
</script>

<template>
  <div class="demo-stack">
    <HysInputMask v-model="raw" v-model:formatted="formatted" :mask="mask" :rules="rules" raw-on-focus
      aria-label="供应商编号" placeholder="例：外沪港０１０２" hint="外地编号以“外”开头。支持全角数字和其他书写系统的十进制数字。" />
    <p role="status">原值 {{ raw || "—" }} · 格式化 {{ formatted || "—" }}</p>
  </div>
</template>
