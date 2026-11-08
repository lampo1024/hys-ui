<script setup lang="ts">
import {ref} from 'vue'
import {Plus,Minus} from 'lucide-vue-next'
import {HysAccordion,HysButton,HysBadge} from 'hys-ui'
const saved=ref(0)
const items=[{title:'通知偏好',content:'选择需要接收的通知类型。'},{title:'高级选项',content:'更多可选设置。'}]
</script>
<template><div class="demo-content"><HysAccordion :items="items" arrow-placement="left"><template #title="{item,expanded}">{{item.title}} <HysBadge :tone="expanded?'blue':'gray'">{{expanded?'已展开':'未展开'}}</HysBadge></template><template #icon="{expanded}"><component :is="expanded?Minus:Plus" :size="16"/></template><template #extra><HysButton variant="ghost" size="sm" @click="saved++">保存偏好</HysButton></template><template #content="{index,item}"><p>{{item.content}}</p><HysAccordion v-if="index===1" :items="[{title:'嵌套选项',content:'嵌套面板保持独立展开状态。'}]" ghost/></template></HysAccordion><output class="state-output">额外操作已执行 {{saved}} 次，不改变展开状态。</output></div></template>