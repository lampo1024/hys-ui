<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
import { Search, Mail, Check } from "lucide-vue-next";
const search = ref(""),
  email = ref("hello@example.com");
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>前缀图标属性</span
        ><HysInput
          v-model="search"
          :prefix-icon="Search"
          clearable
          placeholder="搜索名称" /></label
      ><label class="input-demo-field"
        ><span>图标与自定义后缀</span
        ><HysInput v-model="email" :prefix-icon="Mail" :suffix-icon="Check"
          ><template #suffix
            ><Check :size="16" /><span>已填写</span></template
          ></HysInput
        ></label
      >
    </div>
    <p class="scenario-note">
      prefix / suffix 插槽可放图标或短文本，相应插槽会覆盖图标属性。
    </p>
  </div>
</template>
