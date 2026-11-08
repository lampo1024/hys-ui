<script setup lang="ts">
import { ref } from 'vue';
import { HysNotificationCenter } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const toast = ref('');
const notices = ref([{ id: '1', title: '代码审查待处理', detail: '请及时审核', read: false, time: '刚刚' }, { id: '2', title: '迭代已完成', detail: 'Sprint 12', read: false, time: '昨天' }]);
const demoConfig = demoReactive<{
    title: string;
    emptyText: string;
    disabled: boolean;
}>({ "title": "自定义title", "emptyText": "自定义emptyText", "disabled": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>标题</span><code>title</code></span><DemoInput v-model="demoConfig.title"/></label>
<label class="demo-field"><span class="demo-control-label"><span>空数据提示</span><code>emptyText</code></span><DemoInput v-model="demoConfig.emptyText"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div></div></section></div><div class="demo-content"><section class="ent-gallery-section"><HysNotificationCenter v-bind="demoConfig" :items="notices" @read="id=>notices=notices.map(n=>({...n,read:n.id===id?true:n.read}))" @read-all="notices=notices.map(n=>({...n,read:true}))"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
