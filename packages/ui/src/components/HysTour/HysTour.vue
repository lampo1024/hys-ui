<script setup lang="ts">
import {ref,watch} from 'vue'
import HysModal from '../HysModal/HysModal.vue'
import HysButton from '../HysButton/HysButton.vue'
const props=defineProps<{steps:{title:string;description:string}[];current?:number;closeOnEscape?:boolean}>(),open=defineModel<boolean>({default:false}),emit=defineEmits<{finish:[];close:[];change:[index:number];'update:current':[index:number]}>(),index=ref(props.current||0)
watch(()=>props.current,value=>{if(value!==undefined)index.value=value});watch(open,value=>{if(value)index.value=props.current||0})
function move(value:number){index.value=Math.max(0,Math.min(props.steps.length-1,value));emit('change',index.value);emit('update:current',index.value)}function close(){open.value=false;emit('close')}function next(){if(index.value>=props.steps.length-1){emit('finish');close()}else move(index.value+1)}
</script>
<template><HysModal :open="open" :title="steps[index]?.title||'引导'" :close-on-escape="closeOnEscape!==false" :close-on-mask="false" @close="close"><p>{{steps[index]?.description||'暂无引导步骤'}}</p><template #footer><span>{{steps.length?index+1:0}} / {{steps.length}}</span><HysButton variant="ghost" @click="close">跳过</HysButton><HysButton variant="secondary" :disabled="index===0" @click="move(index-1)">上一步</HysButton><HysButton @click="next">{{index>=steps.length-1?'完成':'下一步'}}</HysButton></template></HysModal></template>
