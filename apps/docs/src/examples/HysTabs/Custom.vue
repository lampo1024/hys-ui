<script setup lang="ts">
import {ref} from 'vue'
import {Inbox,Settings,FileText} from 'lucide-vue-next'
import {HysTabs,HysBadge,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>('messages')
const items=[{value:'messages',label:'消息'},{value:'files',label:'文件'},{value:'settings',label:'设置'}]
const icons={messages:Inbox,files:FileText,settings:Settings}
</script>
<template><div class="demo-content"><HysTabs v-model="active" :items="items" stretch type="segment"><template #label="{item}"><component :is="icons[item.value as keyof typeof icons]" :size="15"/>{{item.label}}<HysBadge v-if="item.value==='messages'" :value="3"/></template><template #panel="{item}"><p>{{item.label}}内容区域</p></template><template #suffix><HysBadge>已同步</HysBadge></template></HysTabs><p class="scenario-note">label、panel、prefix、suffix、add-icon 和 close-icon 插槽用于组合图标、计数、内容和附加操作。插槽内容继承组件主题。</p></div></template>