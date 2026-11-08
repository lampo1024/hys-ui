<script setup lang="ts">
import {defineComponent,h,ref} from 'vue'
import {HysAccordion,HysInput,HysCheckbox} from 'hys-ui'
const destroy=ref(false)
const DraftField=defineComponent({setup(){const draft=ref('');return()=>h(HysInput,{modelValue:draft.value,'onUpdate:modelValue':value=>draft.value=value,placeholder:'输入后收起、再展开',ariaLabel:'面板内草稿'})}})
</script>
<template><div class="demo-content"><HysCheckbox v-model="destroy" label="收起时销毁内容"/><HysAccordion :items="[{title:'编辑草稿'}]" :default-active="[0]" :destroy-on-hide="destroy"><template #content><DraftField/></template></HysAccordion><p class="scenario-note">关闭 destroyOnHide 后，访问过的内容在收起时保留实例与输入。默认 destroyOnHide=true，与原有销毁行为一致。lazy=false 或单项 forceRender 可提前挂载。</p></div></template>
