<script setup lang="ts">
import { ref } from "vue";
import { HysJsonEditor } from "hys-ui";
const config = ref('{"region":"east","retries":3,"enabled":true,"channels":["email","webhook"]}');
function validate(value: unknown) {
  if (
    typeof value !== "object" ||
    !value ||
    !("retries" in value) ||
    typeof value.retries !== "number" ||
    !Number.isInteger(value.retries) ||
    value.retries < 0 ||
    value.retries > 5
  )
    return "retries 必须是 0 至 5 的整数。";
}
</script>
<template>
  <div class="demo-stack">
    <HysJsonEditor v-model="config" view="tree" :validate="validate" :indent="4" compactable />
    <p class="scenario-note">在树中选中 retries 并改为 6 查看业务校验。展开 channels，选中数组项即可上移或下移，再使用工具栏撤销。</p>
  </div>
</template>
