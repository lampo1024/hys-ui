<script setup lang="ts">
import { ref } from 'vue';
import { HysPagination } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const page = ref(1);
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
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>每页条数</span><code>pageSize</code></span><DemoNumber v-model="demoConfig.pageSize" :show-controls="false"/></label>
<label class="demo-field"><span class="demo-control-label"><span>相邻页数</span><code>siblingCount</code></span><DemoNumber v-model="demoConfig.siblingCount" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showSizeChanger" label="showSizeChanger"/><small>显示每页条数</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showQuickJumper" label="showQuickJumper"/><small>显示页码跳转</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showTotal" label="showTotal"/><small>显示总数</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><small>加载状态</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.compact" label="compact"/><small>紧凑布局</small></div></div></section></div><div class="demo-content"><HysPagination v-bind="demoConfig" v-model:page="page" v-model:page-size="demoConfig.pageSize" :total="156"/><output>第 {{page}} 页 · 每页 {{demoConfig.pageSize}} 条</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
