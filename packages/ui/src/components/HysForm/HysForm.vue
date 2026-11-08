<script setup lang="ts">
import {computed,nextTick,provide,ref,toRaw,unref} from 'vue'
import {formKey,type HysFormRule} from '../../composables/formContext'
import {useHysRootAttrs} from '../../config'
const props=withDefaults(defineProps<{model?:Record<string,unknown>;rules?:Record<string,HysFormRule|HysFormRule[]>;validate?:()=>boolean|Promise<boolean>;loading?:boolean;disabled?:boolean;inline?:boolean;labelPosition?:'top'|'left'|'right';labelWidth?:string}>(),{rules:()=>({}),labelPosition:'top',labelWidth:'100px'})
const emit=defineEmits<{submit:[];invalid:[];reset:[]}>(),hysRootAttrs=useHysRootAttrs(),errors=ref<Record<string,string>>({}),validating=ref(false),resetting=ref(false),root=ref<HTMLFormElement>()
const fields=new Map<string,number>(),generation=new Map<string,number>()
function snapshot(value:unknown,seen=new WeakMap<object,unknown>()):unknown{const raw=toRaw(unref(value));if(!raw||typeof raw!=='object')return raw;if(raw instanceof Date)return new Date(raw);if(seen.has(raw))return seen.get(raw);if(!Array.isArray(raw)&&Object.getPrototypeOf(raw)!==Object.prototype&&Object.getPrototypeOf(raw)!==null)return raw;const result:Record<string,unknown>|unknown[]=Array.isArray(raw)?[]:{};seen.set(raw,result);for(const[key,item]of Object.entries(raw))(result as Record<string,unknown>)[key]=snapshot(item,seen);return result}
const initial=snapshot(props.model||{}) as Record<string,unknown>
function valueAt(model:Record<string,unknown>,key:string):unknown{return key.split('.').reduce<unknown>((value,part)=>(value as Record<string,unknown>|undefined)?.[part],model)}
async function validateField(name:string,trigger?:'blur'|'change'){
 const run=(generation.get(name)||0)+1;generation.set(name,run)
 const rules=[props.rules[name]||[]].flat().filter(rule=>!trigger||!rule.trigger||[rule.trigger].flat().includes(trigger)),value=valueAt(props.model||{},name)
 let message=''
 for(const rule of rules){
  const empty=value==null||value===''||(Array.isArray(value)&&!value.length)
  try{
   if(rule.required&&empty)message=rule.message||'此项不能为空'
   if(!empty&&rule.pattern){rule.pattern.lastIndex=0;if(!rule.pattern.test(String(value)))message=rule.message||'格式不正确'}
   const length=typeof value==='number'?value:(value as {length?:number})?.length
   if(!empty&&length!==undefined&&((rule.min!==undefined&&length<rule.min)||(rule.max!==undefined&&length>rule.max)))message=rule.message||'超出允许范围'
   if(!message&&rule.validator){const result=await rule.validator(value,props.model||{});if(result===false||typeof result==='string')message=typeof result==='string'?result:rule.message||'校验未通过'}
  }catch(error){message=error instanceof Error?error.message:rule.message||'校验失败'}
  if(message)break
 }
 if(generation.get(name)===run){if(message)errors.value={...errors.value,[name]:message};else{const next={...errors.value};delete next[name];errors.value=next}}
 return !message
}
function clearValidate(names?:string|string[]){const keys=names?[names].flat():[...new Set([...Object.keys(errors.value),...generation.keys()])];for(const name of keys){generation.set(name,(generation.get(name)||0)+1);delete errors.value[name]}}
async function validate(){validating.value=true;try{const names=[...new Set([...Object.keys(props.rules),...fields.keys()])];const results=await Promise.all(names.map(name=>validateField(name)));return results.every(Boolean)&&(!props.validate||await props.validate())}catch{return false}finally{validating.value=false}}
function resetFields(){resetting.value=true;if(props.model){for(const name of fields.size?fields.keys():Object.keys(props.model)){const parts=name.split('.'),last=parts.pop()!;let parent=props.model;for(const part of parts)parent=(parent[part]??={}) as Record<string,unknown>;parent[last]=snapshot(valueAt(initial,name))}}clearValidate();emit('reset');void nextTick(()=>{resetting.value=false})}
async function submit(){if(props.loading||props.disabled||validating.value)return;if(await validate())emit('submit');else{emit('invalid');await nextTick();root.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()}}
provide(formKey,{model:computed(()=>props.model),resetting,errors,rules:computed(()=>props.rules),validateField,register(name){fields.set(name,(fields.get(name)||0)+1);return()=>{const n=(fields.get(name)||1)-1;if(n)fields.set(name,n);else fields.delete(name)}}})
defineExpose({validate,validateField,clearValidate,resetFields,errors,validating})
</script>
<template><form ref="root" v-bind="hysRootAttrs" class="hys-ui-ent-form" :class="['hys-ui-form-'+labelPosition,{'hys-ui-form-inline':inline}]" :style="{'--hys-ui-form-label-width':labelWidth}" novalidate @submit.prevent="submit" @reset.prevent="resetFields"><fieldset :disabled="disabled||loading" :inert="disabled||loading"><slot/><div class="hys-ui-ent-form-actions"><slot name="actions" :validating="validating" :reset="resetFields"/></div></fieldset></form></template>
<style scoped>
fieldset{border:0;padding:0;margin:0;min-width:0}.hys-ui-form-inline fieldset{display:flex;align-items:flex-start;flex-wrap:wrap;gap:16px}.hys-ui-form-left :deep(.hys-ui-ent-field),.hys-ui-form-right :deep(.hys-ui-ent-field){display:grid;grid-template-columns:var(--hys-ui-form-label-width) minmax(0,1fr);gap:8px 14px;align-items:start}.hys-ui-form-right :deep(.hys-ui-ent-field>label){text-align:right}.hys-ui-form-left :deep(.hys-ui-ent-field>small),.hys-ui-form-right :deep(.hys-ui-ent-field>small){grid-column:2}
</style>
