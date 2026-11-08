<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented, HysAvatar } from "hys-ui";
import { List, LayoutGrid, CalendarDays } from "lucide-vue-next";
const mode = ref("list"),
  member = ref("alex"),
  options = [
    { label: "列表", value: "list", icon: List },
    { label: "网格", value: "grid", icon: LayoutGrid },
    { label: "日历", value: "calendar", icon: CalendarDays },
  ],
  people = [
    { label: "Alex", value: "alex", description: "产品设计" },
    { label: "Amy", value: "amy", description: "前端开发" },
  ];
</script>
<template>
  <div class="demo-content">
    <HysSegmented
      v-model="mode"
      :options="options"
      aria-label="图标分段"
    /><HysSegmented
      v-model="member"
      :options="people"
      block
      aria-label="成员分段"
      ><template #label="{ option }"
        ><span class="segmented-demo-member"
          ><HysAvatar :name="option.label" :size="28" /><span
            ><strong>{{ option.label }}</strong
            ><small>{{ option.description }}</small></span
          ></span
        ></template
      ></HysSegmented
    ><output>布局：{{ mode }} · 成员：{{ member }}</output>
  </div>
</template>
