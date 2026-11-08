<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckboxGroup } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <HysCheckboxGroup
      :options="['a', 'b']"
      error="请至少确认一项"
      aria-label="复选框组错误"
    />
    <HysCheckboxGroup
      :default-value="['a']"
      :options="['a', 'b']"
      disabled
      aria-label="禁用分组"
    /><HysCheckboxGroup
      :default-value="['a']"
      :options="['a', 'b']"
      readonly
      aria-label="只读分组"
    /><HysCheckboxGroup :options="[]" aria-label="空数据"
      ><template #empty>暂无可选择的角色</template></HysCheckboxGroup
    >
  </div>
</template>
