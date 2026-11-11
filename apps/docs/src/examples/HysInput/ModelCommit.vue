<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";

const name = ref("示例名称");
const amount = ref<string | number>(12.5);
const draft = ref(name.value);
</script>

<template>
  <div class="demo-stack">
    <div class="input-demo-grid">
      <div class="demo-stack">
        <HysInput
          v-model.lazy.trim="name"
          label="显示名称"
          clearable
          @input="draft = $event"
        />
        <small>按 Enter 或移开焦点保存，保存时去掉首尾空白。</small>
        <output
          >草稿 {{ JSON.stringify(draft) }} · 模型
          {{ JSON.stringify(name) }}</output
        >
      </div>
      <div class="demo-stack">
        <HysInput
          v-model.number="amount"
          label="结算数量"
          inputmode="decimal"
          clearable
        />
        <small>输入可解析的数字，模型会收到 number。</small>
        <output>模型 {{ JSON.stringify(amount) }} · {{ typeof amount }}</output>
      </div>
    </div>
  </div>
</template>

<style scoped>
small {
  color: var(--docs-muted);
}
output {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
