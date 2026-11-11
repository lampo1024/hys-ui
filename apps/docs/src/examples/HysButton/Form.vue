<script setup lang="ts">
import { ref } from "vue";
import { HysButton } from "hys-ui";

const feedback = ref("");
function submit(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  feedback.value = "已提交 " + new FormData(form).get("name");
}
</script>

<template>
  <form class="button-form-demo" @submit.prevent="submit" @reset="feedback = '已重置'">
    <label>
      草稿名称
      <input name="name" value="项目计划" required />
    </label>
    <div class="demo-row">
      <HysButton type="primary" native-type="submit">提交</HysButton>
      <HysButton type="default" native-type="reset">重置</HysButton>
    </div>
    <small v-if="feedback" role="status">{{ feedback }}</small>
  </form>
</template>

<style scoped>
.button-form-demo { display: flex; align-items: end; flex-wrap: wrap; gap: 10px; }
.button-form-demo label { display: grid; gap: 6px; font-size: 12px; }
.button-form-demo input {
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
  color: inherit;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
.button-form-demo small { flex-basis: 100%; }
</style>
