<script setup lang="ts">
import { ref } from "vue";
import { HysJsonEditor } from "hys-ui";
const config = ref('{"region":"east","retries":3}');
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
  <HysJsonEditor
    v-model="config"
    :validate="validate"
    :indent="4"
    compactable
  />
</template>
