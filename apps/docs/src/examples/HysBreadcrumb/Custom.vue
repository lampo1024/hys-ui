<script setup lang="ts">
import {ref} from 'vue'
import {Home,ChevronRight} from 'lucide-vue-next'
import {HysBreadcrumb,HysButton} from 'hys-ui'
const selected=ref('组件详情')
const items=[{label:'首页',href:'home'},{label:'组件文档',href:'components'},{label:'组件详情'}]
</script>
<template><div class="demo-content"><HysBreadcrumb :items="items" aria-label="文档导航"><template #separator><ChevronRight :size="14"/></template><template #link="{item}"><HysButton variant="link" size="sm" @click="selected=item.label"><Home v-if="item.href==='home'" :size="14"/>{{item.label}}</HysButton></template></HysBreadcrumb><output class="state-output">选择的层级：{{selected}}</output><p class="scenario-note">link 插槽可接入宿主路由或自定义操作，组件无需依赖 Vue Router。item 插槽用于自定义默认标签内容；separator 插槽可获取当前 item 和 index。</p></div></template>