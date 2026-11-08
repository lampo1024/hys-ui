<script setup lang="ts">
import { ref } from 'vue';
import { HysSkeleton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const events = ref('');
;
const demoConfig = demoReactive<{
    lines: number;
    loading: boolean;
    active: boolean;
    avatar: boolean;
    avatarSize: number;
    title: boolean;
}>({ "lines": 3, "loading": true, "active": true, "avatar": false, "avatarSize": 40, "title": true });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">lines<DemoNumber v-model="demoConfig.lines" :show-controls="false"/></label>
<label class="demo-field">avatarSize<DemoNumber v-model="demoConfig.avatarSize" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><small>加载状态</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.active" label="active"/></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.avatar" label="avatar"/></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.title" label="title"/></div></div></section></div><div class="demo-content"><HysSkeleton v-bind="demoConfig" /><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
