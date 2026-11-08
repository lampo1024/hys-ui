<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysSwitch :default-value="true" disabled active-text="禁用" /><HysSwitch
        :default-value="true"
        readonly
        active-text="只读"
      /><HysSwitch loading active-text="加载" /><HysSwitch
        status="warning"
        inactive-text="待确认"
      /><HysSwitch error="保存失败，请重试" inactive-text="错误状态" />
    </div>
  </div>
</template>
