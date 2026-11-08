<script setup lang="ts">
import {ref} from 'vue'
import {HysTabs,HysCheckbox,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>('edit'),dirty=ref(true),message=ref('请先取消“存在未保存修改”，再切换页签。')
const items=[{label:'编辑内容',value:'edit',content:'当前正在编辑的内容。'},{label:'预览',value:'preview',content:'内容预览。'},{label:'发布设置',value:'settings',content:'维护发布设置。'}]
async function beforeLeave(next:HysTabValue,current:HysTabValue){message.value='正在检查 '+current+' → '+next;await new Promise(resolve=>setTimeout(resolve,400));if(dirty.value){message.value='切换已阻止：请先保存修改。';return false}message.value='检查通过';return true}
</script>
<template><div class="demo-content"><HysCheckbox v-model="dirty" label="存在未保存修改"/><HysTabs v-model="active" :items="items" :before-leave="beforeLeave"/><output class="state-output" aria-live="polite">{{message}} · 当前：{{active}}</output><p class="scenario-note">beforeLeave 可返回 false 或 Promise。连续点击只接受最近一次请求；切换期间禁用控件、更新受控值或离开页面后，旧结果不会覆盖新状态。</p></div></template>