<script setup lang="ts">
import { ref } from "vue";
import { HysSelect } from "hys-ui";
const tags = ref(["Vue"]),
  events = ref<string[]>([]);
</script>
<template>
  <div class="demo-content">
    <label class="select-demo-field"
      ><span>选择已有技术标签，或创建新标签</span
      ><HysSelect
        v-model="tags"
        :options="[
          { label: 'Vue', value: 'Vue' },
          { label: 'TypeScript', value: 'TypeScript' },
          { label: 'Vite', value: 'Vite' },
        ]"
        multiple
        allow-create
        clearable
        clear-search-after-select
        :multiple-limit="6"
        :token-separators="[',', '，', ';']"
        aria-label="可创建技术标签"
        @create="(option) => events.push('创建：' + option.label)"
        @reject="
          (value, reason) =>
            events.push('未添加：' + value + ' (' + reason + ')')
        " /></label
    ><output class="state-output"
      >标签：{{ tags }}
      {{
        events.slice(-4).join("\n") ||
        "输入标签并按 Enter，或粘贴逗号、分号分隔的标签"
      }}</output
    >
    <p class="scenario-note">
      仅在确认创建时触发
      create，不会在每次输入时重复创建。分隔符输入会自动去重并遵循数量限制；中文输入法组合过程中不会提前提交。
    </p>
  </div>
</template>
