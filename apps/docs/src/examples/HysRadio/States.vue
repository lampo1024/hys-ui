<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadio } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysRadio model-value="a" value="a" label="禁用" disabled /><HysRadio
        model-value="a"
        value="a"
        label="只读"
        readonly
      /><HysRadio value="b" label="有错误说明" error="请确认可用范围" />
    </div>
  </div>
</template>
