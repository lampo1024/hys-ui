<script setup lang="ts">
import {ref} from 'vue'
import {HysAccordion,HysButton,type HysAccordionKey} from 'hys-ui'
const open=ref<HysAccordionKey[]>(['security'])
const items=ref([{id:'profile',title:'个人资料',content:'维护个人资料。'},{id:'security',title:'安全设置',content:'设置登录验证方式。'},{id:'notice',title:'通知设置',content:'维护通知渠道。'}])
function reorder(){items.value=[...items.value].reverse()}
</script>
<template><div class="demo-content"><div class="demo-row"><HysButton variant="secondary" @click="reorder">反转显示顺序</HysButton><HysButton variant="ghost" @click="open=items.map(item=>item.id)">全部展开</HysButton><HysButton variant="ghost" @click="open=[]">全部收起</HysButton></div><HysAccordion v-model="open" :items="items" multiple/><output class="state-output">展开项：{{open}}</output><p class="scenario-note">使用稳定 id 时，重排数据不会展开其他条目。未提供 id 的条目继续使用索引，兼容已有用法。每项 id 应唯一。</p></div></template>