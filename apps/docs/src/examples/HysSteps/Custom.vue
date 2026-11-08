<script setup lang="ts">
import {ref} from 'vue'
import {UserRound,ClipboardCheck,Send} from 'lucide-vue-next'
import {HysSteps,HysBadge} from 'hys-ui'
const current=ref(1),icons=[UserRound,ClipboardCheck,Send]
const items=[{title:'申请',subtitle:'09:30',description:'提交申请资料'},{title:'审核',subtitle:'处理中',description:'等待审核结果'},{title:'发放',description:'审核完成后处理',disabled:true}]
</script>
<template><div class="demo-content"><HysSteps v-model:current="current" :items="items" vertical clickable><template #icon="{index}"><component :is="icons[index]" :size="15"/></template><template #title="{item,status}">{{item.title}} <HysBadge v-if="status==='process'" size="sm">当前</HysBadge></template><template #description="{item,index}"><p>{{item.description}}</p><span v-if="index===1">预计 1 个工作日完成。</span></template></HysSteps><p class="scenario-note">可为单项指定 status、subtitle 与 disabled，并通过 icon、title、subtitle、description 插槽展示业务信息。方向键、Home 和 End 可在允许访问的步骤之间切换。</p></div></template>