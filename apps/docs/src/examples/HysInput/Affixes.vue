<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
import { Search } from "lucide-vue-next";
const text = ref("");
const password = ref("");
const url = ref("hys-ui");
</script>
<template>
  <div class="demo-stack">
    <HysInput
      v-model="text"
      clearable
      show-count
      :maxlength="20"
      placeholder="前缀图标与字数"
      ><template #prefix><Search :size="16" /></template></HysInput
    ><HysInput v-model="password" type="password" show-password /><HysInput
      v-model="url"
      ><template #prepend>https://</template
      ><template #append>.com</template></HysInput
    ><HysInput model-value="只读内容" readonly clearable /><HysInput
      model-value="校验错误"
      error="请输入正确内容"
    />
  </div>
</template>
