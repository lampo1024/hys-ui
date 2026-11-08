<script setup lang="ts">
import {computed,inject,nextTick,onBeforeUnmount,onMounted,onUpdated,provide,ref,useId,useSlots,watch} from 'vue'
import {CheckCircle2,CircleAlert,LoaderCircle} from 'lucide-vue-next'
import {formKey,fieldKey,formPath,formValue,focusHysField,type HysFormField,type HysFormPath,type HysFormRule,type HysFormStatus,type HysFormTrigger} from '../../composables/formContext'
import {useHysRootAttrs} from '../../config'
import {sameFormValue,snapshotForm} from '../../composables/formValidation'
const props=withDefaults(defineProps<{
  label?:string
  prop?:HysFormPath
  rules?:HysFormRule|HysFormRule[]
  dependencies?:HysFormPath[]
  error?:string
  warning?:string
  status?:HysFormStatus
  required?:boolean
  showRequiredMark?:boolean
  requiredMarkPosition?:'left'|'right'
  hint?:string
  for?:string
  disabled?:boolean
  size?:'sm'|'md'|'lg'
  labelPosition?:'top'|'left'|'right'
  labelWidth?:string|number
  showLabel?:boolean
  showFeedback?:boolean
  feedbackIcon?:boolean
  noStyle?:boolean
  validateTrigger?:HysFormTrigger|HysFormTrigger[]
}>(),{showLabel:undefined,showFeedback:undefined,showRequiredMark:undefined})
const hysRootAttrs=useHysRootAttrs(),form=inject(formKey,undefined),root=ref<HTMLElement>(),control=ref<HTMLElement>(),id=useId(),controlId=ref(props.for||id),errorId=id+'-error',hintId=id+'-hint',warningId=id+'-warning',slots=useSlots()
const path=computed(()=>props.prop===undefined?'':formPath(props.prop)),localRules=computed(()=>[props.rules??[]].flat()),label=computed(()=>props.label)
const error=computed(()=>props.error!==undefined?props.error:path.value?form?.errors.value[path.value]:undefined)
const warning=computed(()=>props.warning!==undefined?props.warning:path.value?form?.warnings.value[path.value]:undefined)
const state=computed(()=>path.value?form?.states.value[path.value]:undefined)
const status=computed(()=>props.status??(error.value?'error':warning.value?'warning':state.value?.status??'idle'))
const invalid=computed(()=>!!error.value||status.value==='error')
const required=computed(()=>!!(props.required||[...(path.value?[form?.rules.value[path.value]??[]].flat():[]),...localRules.value].some(rule=>rule.required)))
const disabled=computed(()=>!!(props.disabled||form?.disabled.value)),size=computed(()=>props.size??form?.size.value??'md')
const showLabel=computed(()=>!props.noStyle&&(props.showLabel??form?.showLabel.value??true)&&(!!props.label||!!slots.label))
const showFeedback=computed(()=>props.showFeedback??form?.showFeedback.value??true)
const showRequiredMark=computed(()=>props.showRequiredMark??form?.showRequiredMark.value??true)
const markPosition=computed(()=>props.requiredMarkPosition??form?.requiredMarkPosition.value??'right')
const labelPosition=computed(()=>props.labelPosition??form?.labelPosition.value??'top')
const labelWidth=computed(()=>typeof props.labelWidth==='number'?props.labelWidth+'px':props.labelWidth??form?.labelWidth.value??'100px')
const trigger=computed<HysFormTrigger|HysFormTrigger[]>(()=>props.validateTrigger??form?.validateTrigger.value??['change','blur'])
const describedBy=computed(()=>[showFeedback.value&&error.value?errorId:showFeedback.value&&warning.value?warningId:undefined,props.hint||slots.hint?hintId:undefined].filter(Boolean).join(' ')||undefined)
provide(fieldKey,{id:controlId,label,error,errorId,describedBy,required,disabled,size})
async function validate(event?:HysFormTrigger){if(form?.resetting.value||disabled.value||!path.value)return true;return await form?.validateField(path.value,event)??true}
function getControl(){return(props.for?document.getElementById(props.for):null)||control.value?.querySelector<HTMLElement>('input:not([type="hidden"]):not([hidden]),textarea,select,button[role="combobox"],button[role="switch"],[role="radiogroup"],[role="slider"],[role="button"],[contenteditable][role="textbox"]')}
function focus(){focusHysField(getControl())}
function focusControl(event:MouseEvent){const element=getControl();if(element&&!element.matches('input,button,textarea,select')){event.preventDefault();focus()}}
function sync(){
  const element=getControl();if(!element)return
  if(props.for)controlId.value=props.for;else if(!element.id)element.id=controlId.value;else controlId.value=element.id
  if(element.hasAttribute('data-hys-ui-field-managed'))return
  element.setAttribute('aria-invalid',String(invalid.value));if(required.value)element.setAttribute('aria-required','true');else element.removeAttribute('aria-required')
  const descriptions=new Set((element.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));descriptions.delete(errorId);descriptions.delete(hintId);descriptions.delete(warningId);describedBy.value?.split(' ').forEach(value=>descriptions.add(value))
  if(descriptions.size)element.setAttribute('aria-describedby',[...descriptions].join(' '));else element.removeAttribute('aria-describedby')
}
function blur(event:FocusEvent){
  if((event.target as HTMLElement).closest('.hys-ui-ent-field')!==root.value)return
  const next=event.relatedTarget as Node|null;if(next&&root.value?.contains(next))return
  if(next){for(const element of root.value?.querySelectorAll<HTMLElement>('[aria-controls]')||[]){const panel=document.getElementById(element.getAttribute('aria-controls')||'')?.closest('[data-hys-ui]');if(panel?.contains(next))return}}
  void validate('blur')
}
const field:HysFormField={path,element:root,rules:localRules,trigger,dependencies:computed(()=>props.dependencies??[]),label,validate,clearValidate:()=>{if(path.value)form?.clearValidate([path.value])},resetField:()=>{if(path.value)form?.resetFields([path.value])},focus}
let unregister:(()=>void)|undefined
let lastRules=snapshotForm(props.rules)
watch(path,name=>{unregister?.();unregister=name?form?.register(field):undefined},{immediate:true,flush:'sync'})
watch(()=>[path.value,formValue(form?.model.value,path.value),...(props.dependencies??[]).map(dependency=>formValue(form?.model.value,dependency))],(next,previous)=>{if(form?.model.value&&!form.resetting.value&&next[0]===previous?.[0])void validate('change')},{deep:true})
watch(()=>props.rules,()=>{if(sameFormValue(props.rules,lastRules))return;lastRules=snapshotForm(props.rules);if(form&&!form.resetting.value){if(form.validateOnRuleChange.value)void validate();else if(path.value)form.cancelField(path.value)}},{deep:true})
watch(()=>props.for,()=>{controlId.value=props.for||id;void nextTick(sync)})
watch(disabled,value=>{if(value)field.clearValidate()})
onMounted(sync);onUpdated(sync);onBeforeUnmount(()=>unregister?.())
defineExpose({validate,clearValidate:field.clearValidate,resetField:field.resetField,focus,path,status,error,warning})
</script>
<template>
  <div ref="root" v-bind="hysRootAttrs" class="hys-ui-ent-field" :class="['hys-ui-form-item-'+labelPosition,'hys-ui-form-item-'+size,{'hys-ui-form-item-no-style':noStyle,'hys-ui-form-item-grid':showLabel&&labelPosition!=='top'}]" :style="{'--hys-ui-form-label-width':labelWidth}" :data-field-path="path||undefined" :data-validation-status="status" :aria-busy="status==='validating'||undefined" @change="!form?.model.value&&validate('change')" @focusout="blur">
    <label v-if="showLabel" :for="controlId" @click="focusControl"><span v-if="required&&showRequiredMark&&markPosition==='left'" class="hys-ui-form-required" aria-hidden="true">*</span><slot name="label" :required="required" :status="status">{{label}}</slot><span v-if="required&&showRequiredMark&&markPosition==='right'" class="hys-ui-form-required" aria-hidden="true">*</span></label>
    <div ref="control" class="hys-ui-form-item-control" :class="{'hys-ui-ent-invalid':invalid,'hys-ui-form-item-warning':status==='warning'}"><slot :id="controlId" :invalid="invalid" :error="error" :warning="warning" :status="status" :disabled="disabled" :size="size"/><span v-if="feedbackIcon&&status!=='idle'" class="hys-ui-form-feedback-icon" :class="'hys-ui-form-feedback-'+status" aria-hidden="true"><LoaderCircle v-if="status==='validating'" :size="15" class="hys-ui-icon-spin"/><CheckCircle2 v-else-if="status==='success'" :size="15"/><CircleAlert v-else :size="15"/></span></div>
    <div v-if="showFeedback&&(error||warning||$slots.feedback)" :id="error?errorId:warning?warningId:undefined" :role="error?'alert':warning?'status':undefined" class="hys-ui-form-item-feedback"><slot name="feedback" :error="error" :warning="warning" :status="status"><small v-if="error" class="hys-ui-ent-error"><slot name="error" :error="error">{{error}}</slot></small><small v-else-if="warning" class="hys-ui-form-warning"><slot name="warning" :warning="warning">{{warning}}</slot></small></slot></div>
    <small v-if="hint||$slots.hint" :id="hintId" class="hys-ui-form-item-hint"><slot name="hint">{{hint}}</slot></small>
    <div v-if="$slots.extra" class="hys-ui-form-item-extra"><slot name="extra" :status="status"/></div>
  </div>
</template>
<style scoped>
.hys-ui-ent-field{min-width:0}.hys-ui-ent-field>label{display:flex;align-items:center;gap:5px;line-height:1.6}.hys-ui-form-item-control{min-width:0;position:relative}.hys-ui-form-item-control:has(>.hys-ui-form-feedback-icon){padding-right:24px}.hys-ui-form-item-grid{display:grid;grid-template-columns:var(--hys-ui-form-label-width) minmax(0,1fr);gap:7px 14px;align-items:start}.hys-ui-form-item-grid>label{margin:0;padding-top:9px}.hys-ui-form-item-right>label{justify-content:flex-end;text-align:right}.hys-ui-form-item-grid>.hys-ui-form-item-feedback,.hys-ui-form-item-grid>.hys-ui-form-item-hint,.hys-ui-form-item-grid>.hys-ui-form-item-extra{grid-column:2}.hys-ui-form-required{color:var(--hys-ui-red,var(--hys-ui-theme-red));font-size:12px}.hys-ui-form-item-feedback small{display:block;margin:5px 0 0;line-height:1.5}.hys-ui-form-item-hint{display:block;margin-top:5px;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));font-size:12px;line-height:1.6}.hys-ui-form-warning,.hys-ui-form-feedback-warning{color:var(--hys-ui-orange,var(--hys-ui-theme-orange,#d97706))}.hys-ui-form-feedback-error{color:var(--hys-ui-red,var(--hys-ui-theme-red))}.hys-ui-form-feedback-success{color:var(--hys-ui-green,var(--hys-ui-theme-green,#16a34a))}.hys-ui-form-feedback-validating{color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}.hys-ui-form-feedback-icon{display:grid;place-items:center;position:absolute;right:0;top:11px}.hys-ui-form-item-sm>label{font-size:12px}.hys-ui-form-item-sm.hys-ui-form-item-grid>label{padding-top:5px}.hys-ui-form-item-lg>label{font-size:15px}.hys-ui-form-item-lg.hys-ui-form-item-grid>label{padding-top:12px}.hys-ui-form-item-no-style{display:contents}.hys-ui-form-item-warning :deep(.hys-ui-input-shell),.hys-ui-form-item-warning :deep(.hys-ui-textarea){border-color:var(--hys-ui-orange,var(--hys-ui-theme-orange,#d97706))}
</style>
<style scoped>.hys-ui-ent-error{color:var(--hys-ui-red,var(--hys-ui-theme-red,#d43f50))}</style>
