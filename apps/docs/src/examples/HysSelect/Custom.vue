<script setup lang="ts">
import { ref } from 'vue'
import { HysAvatar,HysBadge,HysSelect } from 'hys-ui'
const value=ref('lisa')
const members=[{label:'Lisa',value:'lisa',role:'前端开发',tone:'blue' as const},{label:'Keller',value:'keller',role:'产品设计',tone:'purple' as const},{label:'Amy',value:'amy',role:'质量保障',tone:'green' as const}]
const details=(value:string)=>members.find(item=>item.value===value)!
</script>
<template><div><label class="select-demo-field"><span>成员信息与自定义选中内容</span><HysSelect v-model="value" :options="members" aria-label="自定义成员选项">
<template #label="{selected}"><span v-if="selected[0]" class="select-demo-member"><HysAvatar :name="selected[0].label" :size="24"/><span>{{selected[0].label}}</span></span></template>
<template #option="{option}"><span class="select-demo-member"><HysAvatar :name="option.label" :size="26"/><span>{{option.label}}</span><HysBadge :tone="details(option.value).tone">{{details(option.value).role}}</HysBadge></span></template>
<template #footer><p class="select-demo-footer">选中图标与完整选中状态由组件管理。</p></template>
</HysSelect></label><output class="state-output">当前成员：{{value}}</output></div></template>
