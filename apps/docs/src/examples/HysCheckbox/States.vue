<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox :default-value="true" disabled label="禁用" /><HysCheckbox
        :default-value="true"
        readonly
        label="只读"
      /><HysCheckbox status="warning" label="待确认" /><HysCheckbox
        error="请确认使用条款"
        label="使用条款"
      />
    </div>
  </div>
</template>
