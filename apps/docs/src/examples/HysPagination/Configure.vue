<script setup lang="ts">
import { ref } from 'vue';
import { HysPagination } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const page = ref(1);
const pageSize = ref(12);
const demoConfig = demoReactive<{
    pageSize: number;
    siblingCount: number;
    showSizeChanger: boolean;
    showQuickJumper: boolean;
    showTotal: boolean;
    disabled: boolean;
    loading: boolean;
    compact: boolean;
}>({ "pageSize": 10, "siblingCount": 1, "showSizeChanger": false, "showQuickJumper": false, "showTotal": true, "disabled": false, "loading": false, "compact": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">pageSize<DemoNumber v-model="demoConfig.pageSize" :show-controls="false"/></label><label class="demo-field">siblingCount<DemoNumber v-model="demoConfig.siblingCount" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.showSizeChanger" label="showSizeChanger"/><DemoCheckbox v-model="demoConfig.showQuickJumper" label="showQuickJumper"/><DemoCheckbox v-model="demoConfig.showTotal" label="showTotal"/><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.loading" label="loading"/><DemoCheckbox v-model="demoConfig.compact" label="compact"/></div><div class="demo-content"><HysPagination v-bind="demoConfig" :page="page"  :total="156"   @change="page=$event" @page-size-change="pageSize=$event;page=1"/><output>第 {{page}} 页 · 每页 {{pageSize}} 条</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
