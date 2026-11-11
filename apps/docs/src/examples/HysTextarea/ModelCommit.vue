<script setup lang="ts">
import { ref, useId } from "vue";
import { HysButton, HysTextarea } from "hys-ui";

const form = useId();
const note = ref("请于工作日联系。");
const submitted = ref("");
function submit(event: SubmitEvent) {
  submitted.value = String(
    new FormData(event.currentTarget as HTMLFormElement).get("note") ?? "",
  );
}
</script>

<template>
  <div class="demo-stack">
    <HysTextarea
      v-model.lazy.trim="note"
      label="交付备注"
      :form="form"
      name="note"
      :autosize="{ minRows: 2, maxRows: 4 }"
      :maxlength="80"
      allow-clear
    />
    <form :id="form" class="demo-control-actions" @submit.prevent="submit">
      <HysButton size="sm" type="submit">读取表单值</HysButton>
      <small>Enter 继续换行，移开焦点后提交草稿。</small>
    </form>
    <output
      >模型 {{ JSON.stringify(note) }}<br />表单
      {{ submitted ? JSON.stringify(submitted) : "尚未读取" }}</output
    >
  </div>
</template>

<style scoped>
small {
  color: var(--docs-muted);
}
output {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
