<script setup lang="ts">
import { ref } from "vue";
import { HysKeyValueEditor, type HysKeyValueEntry } from "hys-ui";
const rows = ref<HysKeyValueEntry[]>([{ id:"limit", key:"retryLimit", value:"3", type:"number" }, { id:"secret", key:"sampleToken", value:"demo-token", sensitive:true }]);
</script>

<template>
  <div class="demo-stack">
    <HysKeyValueEditor v-model="rows" typed show-tools />
  </div>
</template>
