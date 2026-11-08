<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import {computed,inject,nextTick,onMounted,ref,useAttrs,useId,watch} from 'vue'
import {useHysRootAttrs} from '../../config'
import {fieldKey} from '../../composables/formContext'
defineOptions({inheritAttrs:false})
const props=withDefaults(defineProps<{modelValue?:string;label?:string;placeholder?:string;rows?:number;maxlength?:number;disabled?:boolean;readonly?:boolean;error?:string;showCount?:boolean;autosize?:boolean|{minRows?:number;maxRows?:number};resize?:'none'|'both'|'horizontal'|'vertical'}>(),{modelValue:'',rows:4,showCount:true,resize:'vertical'})
const {disabled:controlDisabled}=useHysControlState(props)

const emit=defineEmits<{'update:modelValue':[value:string];input:[value:string];change:[value:string];focus:[event:FocusEvent];blur:[event:FocusEvent]}>(),hysRootAttrs=useHysRootAttrs(),input=ref<HTMLTextAreaElement>(),composing=ref(false),attrs=useAttrs()
const field=inject(fieldKey,undefined),errorId=useId(),validationError=computed(()=>props.error||field?.error.value)
async function resize(){await nextTick();const el=input.value;if(!el||!props.autosize)return;const options=typeof props.autosize==='object'?props.autosize:{},style=getComputedStyle(el),line=parseFloat(style.lineHeight)||21,padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+2;el.style.height='auto';el.style.height=Math.min((options.maxRows??Infinity)*line+padding,Math.max((options.minRows??1)*line+padding,el.scrollHeight+2))+'px';el.style.overflowY=el.scrollHeight>el.clientHeight?'auto':'hidden'}
function update(event:Event){if(composing.value||controlDisabled.value||props.readonly)return;const value=(event.target as HTMLTextAreaElement).value;emit('update:modelValue',value);emit('input',value);resize()}
watch(()=>[props.modelValue,props.autosize],resize,{deep:true});onMounted(resize)
defineExpose({input,focus:()=>input.value?.focus(),blur:()=>input.value?.blur(),select:()=>input.value?.select(),resize})
</script>
<template><label v-bind="hysRootAttrs" class="hys-ui-ex-field" :class="attrs.class" :style="attrs.style as any"><span v-if="label">{{label}}</span><textarea ref="input" v-bind="Object.fromEntries(Object.entries(attrs).filter(([key])=>!['class','style'].includes(key)))" class="hys-ui-ex-control" :value="modelValue" :rows="rows" :maxlength="maxlength" :placeholder="placeholder" :disabled="controlDisabled" :readonly="readonly" :id="(attrs.id as string)||field?.id.value" data-hys-ui-field-managed :aria-label="(attrs['aria-label'] as string)||label||field?.label.value" :aria-invalid="!!validationError||undefined" :aria-required="field?.required.value||undefined" :aria-describedby="[error?errorId:field?.describedBy.value,attrs['aria-describedby']].filter(Boolean).join(' ')||undefined" :style="{resize:autosize?'none':props.resize}" @input="update" @compositionstart="composing=true" @compositionend="composing=false;update($event)" @change="emit('change',($event.target as HTMLTextAreaElement).value)" @focus="emit('focus',$event)" @blur="emit('blur',$event)"/><small v-if="error" :id="errorId" class="hys-ui-ex-error" role="alert">{{error}}</small><small v-else-if="showCount&&maxlength">{{modelValue.length}} / {{maxlength}}</small></label></template>
