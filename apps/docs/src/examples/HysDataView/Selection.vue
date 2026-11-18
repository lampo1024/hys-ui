<script setup lang="ts">
import { ref } from "vue";
import { HysDataView, type HysDataViewMode } from "hys-ui";
const mode = ref<HysDataViewMode>("grid");
const keys = ref<(string|number)[]>([]);
const message = ref("");
const data = [{id:"paper",name:"打印纸",group:"耗材"}, {id:"ink",name:"墨盒",group:"耗材"}, {id:"camera",name:"会议摄像头",group:"设备"}];
</script>

<template>
  <div class="demo-stack">
    <HysDataView v-model:view="mode" v-model:selected-keys="keys" :items="data" item-key="id"
      :views="['list','card','grid']" selection-mode="multiple" :group-by="item => item.group"
      :batch-actions="[{key:'quote',label:'加入报价'}]" @batch-action="(action, selected) => message = action + ' · ' + selected.join('、')">
      <template #item="{ item }"><strong>{{ item.name }}</strong></template>
    </HysDataView>
    <p v-if="message" role="status">{{ message }}</p>
  </div>
</template>
