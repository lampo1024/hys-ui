<script setup lang="ts">
import {defineComponent,h,ref} from 'vue'
import {HysTabs,HysInput,HysCheckbox,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>('one'),destroy=ref(false),lazy=ref(true)
const items=[{value:'one',label:'草稿一'},{value:'two',label:'草稿二'},{value:'three',label:'草稿三'}]
const DraftEditor=defineComponent({props:{name:String},setup(props){const draft=ref('');return()=>h('div',{class:'demo-content'},[h('p',props.name+' 的独立输入状态'),h(HysInput,{modelValue:draft.value,'onUpdate:modelValue':value=>draft.value=value,placeholder:'输入内容，再切换页签',ariaLabel:props.name+'草稿'})])}})
</script>
<template><div class="demo-content"><div class="demo-row"><HysCheckbox v-model="destroy" label="离开时销毁内容"/><HysCheckbox v-model="lazy" label="首次访问时才挂载"/></div><HysTabs v-model="active" :items="items" :destroy-on-hide="destroy" :lazy="lazy"><template #panel="{item}"><DraftEditor :name="item.label"/></template></HysTabs><p class="scenario-note">panel 插槽为每项建立独立组件实例。默认延迟挂载并保留草稿；启用销毁后，再次进入会重新创建内容。普通默认插槽继续接收 active，由调用方管理内容。</p></div></template>