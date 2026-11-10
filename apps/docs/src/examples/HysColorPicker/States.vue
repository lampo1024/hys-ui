<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker, HysColorTokenEditor } from "hys-ui";
const disabled = ref("#3867f5"),
  readonly = ref("#8955ea"),
  empty = ref(""),
  invalid = ref("not-a-color"),
  tokens = ref({ primary: "#3867f5", accent: "#22a06b" });
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker
      v-model="disabled"
      disabled
      label="禁用颜色"
    /><HysColorPicker
      v-model="readonly"
      readonly
      label="只读颜色"
    /><HysColorPicker
      v-model="empty"
      clearable
      label="可清空颜色"
    /><HysColorPicker v-model="invalid" label="无效颜色" />
    <div style="width: 230px; max-width: 100%">
      <HysColorPicker default-value="#f59e0b" label="窄容器颜色" />
    </div>
    <HysColorTokenEditor v-model="tokens" /><output class="state-output"
      >令牌：{{ tokens }}</output
    >
  </div>
</template>
