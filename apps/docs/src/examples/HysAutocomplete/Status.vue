<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete } from "hys-ui";
const warning = ref(""),
  error = ref(""),
  success = ref(""),
  options = ["design", "frontend", "quality"];
</script>
<template>
  <div class="demo-content">
    <div class="autocomplete-demo-grid">
      <label class="autocomplete-demo-field"
        ><span>警告</span
        ><HysAutocomplete
          v-model="warning"
          :options="options"
          status="warning"
          placeholder="名称可能重复" /></label
      ><label class="autocomplete-demo-field"
        ><span>错误</span
        ><HysAutocomplete
          v-model="error"
          :options="options"
          status="error"
          error="请使用唯一的空间名称"
          placeholder="输入空间名称" /></label
      ><label class="autocomplete-demo-field"
        ><span>成功</span
        ><HysAutocomplete
          v-model="success"
          :options="options"
          status="success"
          placeholder="名称可以使用"
      /></label>
    </div>
    <p class="scenario-note">
      status 控制外观，error
      提供关联说明。表单校验反馈会自动继承，建议加载失败与字段校验分开处理。
    </p>
  </div>
</template>
