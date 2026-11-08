<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete } from "hys-ui";
import { Eraser, Delete } from "lucide-vue-next";
const icon = ref("Vue"),
  slot = ref("Vite"),
  options = ["Vue", "Vite", "Vitest"];
</script>
<template>
  <div class="demo-content">
    <div class="autocomplete-demo-grid">
      <label class="autocomplete-demo-field"
        ><span>图标组件</span
        ><HysAutocomplete
          v-model="icon"
          :options="options"
          clearable
          :clear-icon="Eraser" /></label
      ><label class="autocomplete-demo-field"
        ><span>清空图标插槽</span
        ><HysAutocomplete v-model="slot" :options="options" clearable
          ><template #clear-icon
            ><Delete :size="14" /></template></HysAutocomplete
      ></label>
    </div>
    <p class="scenario-note">
      自定义清空图标保留原按钮的焦点、可访问名称和键盘行为。清空会取消查询并关闭建议列表。
    </p>
  </div>
</template>
