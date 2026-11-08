<script setup lang="ts">
import {ref,watch,onActivated,onDeactivated,onBeforeUnmount} from 'vue'
import {LoaderCircle} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
const props=defineProps<{modelValue:boolean;disabled?:boolean;loading?:boolean;activeText?:string;inactiveText?:string;ariaLabel?:string;beforeChange?:(next:boolean)=>boolean|void|Promise<boolean|void>}>(),emit=defineEmits<{'update:modelValue':[value:boolean];change:[value:boolean];error:[error:unknown]}>(),hysRootAttrs=useHysRootAttrs(),pending=ref(false)
let generation=0,active=true
function invalidate(){generation++;pending.value=false}
watch(()=>[props.disabled,props.loading,props.modelValue],invalidate,{flush:'sync'})
onActivated(()=>{active=true});onDeactivated(()=>{active=false;invalidate()});onBeforeUnmount(()=>{active=false;invalidate()})
async function toggle(){if(!active||props.disabled||props.loading||pending.value)return;const token=++generation,next=!props.modelValue;pending.value=true;try{if(props.beforeChange&&await props.beforeChange(next)===false)return;if(!active||token!==generation||props.disabled||props.loading)return;emit('update:modelValue',next);emit('change',next)}catch(error){if(active&&token===generation)emit('error',error)}finally{if(token===generation)pending.value=false}}
</script>
<template><span v-bind="hysRootAttrs" class="hys-ui-switch-wrap"><button type="button" role="switch" :aria-label="ariaLabel||activeText||inactiveText||'切换'" :aria-checked="modelValue" :aria-busy="loading||pending" class="hys-ui-switch" :class="{'hys-ui-on':modelValue}" :disabled="disabled||loading||pending" @click="toggle"><span><LoaderCircle v-if="loading||pending" class="hys-ui-icon-spin" :size="12"/></span></button><span v-if="activeText||inactiveText">{{modelValue?activeText:inactiveText}}</span></span></template>
<style scoped>.hys-ui-switch-wrap{display:inline-flex;align-items:center;gap:8px}.hys-ui-switch>span{display:grid;place-items:center}</style>
