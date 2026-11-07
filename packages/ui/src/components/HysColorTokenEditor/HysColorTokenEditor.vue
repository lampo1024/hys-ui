<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import HysColorPicker from '../HysColorPicker/HysColorPicker.vue'
const model=defineModel<Record<string,string>>({default:()=>({primary:'#3674e9',accent:'#22a06b'})})
function set(key:string,value:string){model.value={...model.value,[key]:value}}

</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-panel"><div v-for="(value,key) in model" :key="key" class="hys-ui-ent-token"><label>{{key}}</label><HysColorPicker :model-value="value" :label="'调整 '+key" @update:model-value="set(String(key),$event)"/></div></div></template>
