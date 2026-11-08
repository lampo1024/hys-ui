<script setup lang="ts">
import { ref } from "vue";
import { HysCheckboxGroup, HysCheckbox } from "hys-ui";
const selected = ref(["read"]),
  options = [
    { value: "read", label: "查看内容", description: "浏览可访问的内容" },
    { value: "edit", label: "编辑内容", description: "创建和修改内容" },
    { value: "review", label: "审核内容", description: "检查并确认变更" },
    {
      value: "admin",
      label: "管理设置",
      description: "仅管理员可用",
      disabled: true,
    },
  ];
</script>
<template>
  <div class="demo-content">
    <HysCheckboxGroup v-model="selected" aria-label="功能权限"
      ><div class="choice-demo-grid">
        <HysCheckbox
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
          border
          ><span class="choice-demo-option"
            ><strong>{{ option.label }}</strong
            ><small>{{ option.description }}</small></span
          ></HysCheckbox
        >
      </div></HysCheckboxGroup
    ><output>{{ selected.join("、") }}</output>
    <p class="scenario-note">
      默认插槽中的子项可以放在响应式网格或自定义容器中，仍然继承分组状态和限制。
    </p>
  </div>
</template>
