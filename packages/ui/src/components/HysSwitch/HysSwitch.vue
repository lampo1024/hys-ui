<script setup lang="ts">
import {ref} from 'vue'
import {LoaderCircle} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
const props=defineProps<{modelValue:boolean;disabled?:boolean;loading?:boolean;activeText?:string;inactiveText?:string;ariaLabel?:string;beforeChange?:()=>boolean|Promise<boolean>}>(),emit=defineEmits<{'update:modelValue':[value:boolean];change:[value:boolean];error:[error:unknown]}>(),hysRootAttrs=useHysRootAttrs(),pending=ref(false)
async function toggle(){if(props.disabled||props.loading||pending.value)return;pending.value=true;try{if(props.beforeChange&&await props.beforeChange()===false)return;emit('update:modelValue',!props.modelValue);emit('change',!props.modelValue)}catch(error){emit('error',error)}finally{pending.value=false}}
</script>
<template><span v-bind="hysRootAttrs" class="hys-ui-switch-wrap"><button type="button" role="switch" :aria-label="ariaLabel||activeText||inactiveText||'切换'" :aria-checked="modelValue" :aria-busy="loading||pending" class="hys-ui-switch" :class="{'hys-ui-on':modelValue}" :disabled="disabled||loading||pending" @click="toggle"><span><LoaderCircle v-if="loading||pending" class="hys-ui-icon-spin" :size="12"/></span></button><span v-if="activeText||inactiveText">{{modelValue?activeText:inactiveText}}</span></span></template>
<style scoped>.hys-ui-switch-wrap{display:inline-flex;align-items:center;gap:8px}.hys-ui-switch>span{display:grid;place-items:center}</style>
