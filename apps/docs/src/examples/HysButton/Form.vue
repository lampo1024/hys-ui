<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysInput } from "hys-ui";

const feedback = ref("");
const initialName = "项目计划";
const name = ref(initialName);
function submit(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  feedback.value = "已提交 " + new FormData(form).get("name");
}
function reset() {
  name.value = initialName;
  feedback.value = "已重置";
}
</script>

<template>
  <form class="button-form-demo" @submit.prevent="submit" @reset.prevent="reset">
    <HysInput v-model="name" label="草稿名称" name="name" required />
    <div class="demo-row">
      <HysButton type="primary" native-type="submit">提交</HysButton>
      <HysButton type="default" native-type="reset">重置</HysButton>
    </div>
    <small v-if="feedback" role="status">{{ feedback }}</small>
  </form>
</template>

<style scoped>
.button-form-demo { display: flex; align-items: end; flex-wrap: wrap; gap: 10px; }
.button-form-demo small { flex-basis: 100%; }
</style>
