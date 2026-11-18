<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysRecordPicker } from "hys-ui";
const keys = ref<(string | number)[]>([]);
const pageSize = ref(2);
const broken = ref(true);
const onlyActive = ref(false);
const rows = [{id:1, name:"北区供货中心", active:true}, {id:2,name:"海港配送仓",active:false}, {id:3,name:"东区物料库",active:true}];
const columns = [{key:"name", prop:"name", label:"供应商"}];
</script>

<template>
  <div class="demo-stack">
    <HysRecordPicker v-model="keys" v-model:page-size="pageSize" presentation="drawer" :page-sizes="[2, 3]" show-selected
      :rows="onlyActive ? rows.filter(row => row.active) : rows" :columns="columns" multiple
      :error="broken ? '供应商列表暂时无法加载' : undefined" @retry="broken = false">
      <template #filters><HysCheckbox v-model="onlyActive">仅看启用供应商</HysCheckbox></template>
    </HysRecordPicker>
    <p aria-live="polite">已确认 {{ keys.length }} 家</p>
  </div>
</template>
