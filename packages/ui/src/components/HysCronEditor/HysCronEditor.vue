<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed} from 'vue';const model=defineModel<string>({default:'0 0 * * *'});const parts=computed(()=>model.value.trim().split(/\s+/));const valid=computed(()=>parts.value.length===5&&parts.value.every(x=>/^[\d*,\/-]+$/.test(x)));const presets=[['每小时','0 * * * *'],['每天 09:00','0 9 * * *'],['每周一 09:00','0 9 * * 1'],['每月 1 日','0 0 1 * *']];
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-panel"><div class="hys-ui-ent-toolbar"><button type="button" v-for="p in presets" :key="p[1]" @click="model=p[1]">{{p[0]}}</button></div><label>标准五段 Cron 表达式 <input v-model="model" aria-label="Cron 表达式"/></label><small :class="valid?'hys-ui-ent-ok':'hys-ui-ent-error'">{{valid?'基础格式有效（未验证运行语义）':'应为五段表达式'}}</small></div></template>
