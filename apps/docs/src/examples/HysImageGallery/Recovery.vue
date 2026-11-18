<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysImageGallery } from "hys-ui";
const loading = ref(false);
const empty = ref(false);
const items = [{ key: "old", src: "/missing-hys-gallery-image.png", title: "已移除的旧附件" }];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row"><HysCheckbox v-model="loading">同步中</HysCheckbox><HysCheckbox v-model="empty">清空图库</HysCheckbox></div>
    <HysImageGallery :items="empty ? [] : items" :loading="loading" layout="list" />
  </div>
</template>
