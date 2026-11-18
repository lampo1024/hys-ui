<script setup lang="ts">
import { ref } from "vue";
import { HysRecordPicker } from "hys-ui";
const selected = ref<(string | number)[]>([]);
const rows = [{id:1, name:"投影仪", area:"会议区"}, {id:2,name:"白板",area:"培训区"}, {id:3,name:"移动音箱",area:"一楼仓库"}];
const columns = [{key:"name",label:"设备"}, {key:"area",label:"存放区域"}];
</script>

<template>
  <div class="demo-stack">
    <HysRecordPicker v-model="selected" :rows="rows" :columns="columns" title="选择可领用设备"
      multiple show-selected selection-filter view-switch :recent-limit="4" :page-size="2">
      <template #card="{ row }"><span>{{ row.name }} · {{ row.area }}</span></template>
    </HysRecordPicker>
    <p role="status">{{ selected.length ? "已确认 " + selected.length + " 台设备" : "尚未领取设备" }}</p>
  </div>
</template>
