<script setup lang="ts">
import { ref } from "vue";
import { HysActionBar } from "hys-ui";
const progress = ref(0);
const undo = ref(false);
</script>

<template>
  <div class="demo-stack">
    <HysActionBar :selected-count="3" :total-count="12" :progress="progress" :undo-text="undo ? '撤销归档' : undefined"
      :actions="[{ key:'archive',label:'归档', shortcut:'Alt+A' }, {key:'release',label:'发布',disabled:true,disabledReason:'待归档记录不能发布'}]"
      @action="progress = 100; undo = true" @undo="progress = 0; undo = false" />
  </div>
</template>
