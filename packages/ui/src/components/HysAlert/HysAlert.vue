<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed,ref,watch} from 'vue';import {X,Info,CircleCheck,TriangleAlert,CircleAlert} from 'lucide-vue-next'
const props=withDefaults(defineProps<{tone?:'info'|'success'|'warning'|'danger';title?:string;description?:string;closable?:boolean;showIcon?:boolean;center?:boolean;visible?:boolean}>(),{tone:'info',visible:undefined})
const emit=defineEmits<{close:[];'update:visible':[value:boolean]}>(),local=ref(true),shown=computed(()=>props.visible??local.value)
watch(()=>props.title,()=>local.value=true)
function close(){local.value=false;emit('update:visible',false);emit('close')}
</script>
<template><div v-if="shown" v-bind="hysRootAttrs" class="hys-ui-ex-alert" :class="'hys-ui-ex-'+tone" :role="tone==='danger'?'alert':'status'" :style="{justifyContent:center?'center':undefined}"><component v-if="showIcon" :is="tone==='success'?CircleCheck:tone==='warning'?TriangleAlert:tone==='danger'?CircleAlert:Info" :size="18"/><div><strong v-if="title||$slots.title"><slot name="title">{{title}}</slot></strong><div><slot>{{description}}</slot></div></div><button v-if="closable" type="button" aria-label="关闭提示" @click="close"><X :size="14"/></button></div></template>
