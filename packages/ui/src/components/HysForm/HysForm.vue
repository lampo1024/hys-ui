<script setup lang="ts">
import {computed,nextTick,onActivated,onBeforeUnmount,onDeactivated,provide,ref,shallowRef,watch} from 'vue'
import {formKey,formPath,formValue,setFormValue,focusHysField,type HysFormField,type HysFormFieldState,type HysFormMessages,type HysFormPath,type HysFormPaths,type HysFormRule,type HysFormRules,type HysFormTrigger,type HysFormValidationResult} from '../../composables/formContext'
import {runFormRules,sameFormValue,snapshotForm} from '../../composables/formValidation'
import {useHysRootAttrs} from '../../config'
const props=withDefaults(defineProps<{
  model?:Record<string,unknown>
  rules?:HysFormRules
  validate?:(context:{signal:AbortSignal})=>boolean|Promise<boolean>
  validateMessages?:HysFormMessages
  validateOnRuleChange?:boolean
  validateTrigger?:HysFormTrigger|HysFormTrigger[]
  initialValues?:Record<string,unknown>
  loading?:boolean
  disabled?:boolean
  inline?:boolean
  size?:'sm'|'md'|'lg'
  labelPosition?:'top'|'left'|'right'
  labelWidth?:string|number
  showLabel?:boolean
  showFeedback?:boolean
  showRequiredMark?:boolean
  requiredMarkPosition?:'left'|'right'
  scrollToError?:boolean|ScrollIntoViewOptions
  focusOnError?:boolean
}>(),{rules:()=>({}),validateOnRuleChange:true,validateTrigger:()=>['change','blur'],size:'md',labelPosition:'top',labelWidth:'100px',showLabel:true,showFeedback:true,showRequiredMark:true,requiredMarkPosition:'right',scrollToError:false,focusOnError:true})
const emit=defineEmits<{submit:[values:Record<string,unknown>];invalid:[result:HysFormValidationResult];reset:[names:string[]];validate:[name:string,valid:boolean,message:string];validation:[result:HysFormValidationResult]}>()
const hysRootAttrs=useHysRootAttrs(),root=ref<HTMLFormElement>(),errors=ref<Record<string,string>>({}),warnings=ref<Record<string,string>>({}),states=ref<Record<string,HysFormFieldState>>({}),resetting=ref(false),validating=ref(false)
const registered=shallowRef<HysFormField[]>([]),generations=new Map<string,number>(),baselines=new Map<string,unknown>(),removed=new Set<string>()
type FieldResult={valid:boolean;cancelled:boolean}
const pendingFields=new Map<string,{promise:Promise<FieldResult>;value:unknown;full:boolean;epoch:number;version:number;token:number;signal:AbortSignal;cancel:()=>void}>()
const completedFields=new Map<string,{result:FieldResult;value:unknown;epoch:number;version:number;token:number}>()
const normalizedRules=computed(()=>Object.fromEntries(Object.entries(props.rules).map(([key,rules])=>[formPath(key),rules])))
const disabled=computed(()=>!!(props.disabled||props.loading)),labelWidth=computed(()=>typeof props.labelWidth==='number'?props.labelWidth+'px':props.labelWidth)
let initial=snapshotForm(props.initialValues??props.model??{}) as Record<string,unknown>,live=true,lifetime=0,sequence=0,batch=0,submission=0,modelVersion=0
let lastRules=snapshotForm(props.rules)
let batchController:AbortController|undefined
const stateFor=(name:string):HysFormFieldState=>({status:errors.value[name]?'error':warnings.value[name]?'warning':'idle',message:errors.value[name]||'',warning:warnings.value[name]||'',validating:false})
const getField=(path:HysFormPath)=>registered.value.find(field=>field.path.value===formPath(path))
const getFields=()=>[...registered.value]
const rulesFor=(name:string):HysFormRule[]=>[normalizedRules.value[name]??[]].flat().concat(registered.value.filter(field=>field.path.value===name).flatMap(field=>field.rules.value))
function knownNames(){return [...new Set([...registered.value.map(field=>field.path.value),...Object.keys(normalizedRules.value),...Object.keys(errors.value),...Object.keys(warnings.value),...generations.keys()])].filter(name=>!!name&&!removed.has(name))}
function namesFor(paths:HysFormPaths|undefined,defaults:string[]){if(paths===undefined)return [...new Set(defaults)];const requested=(typeof paths==='string'?[paths]:paths).map(formPath),known=knownNames();return [...new Set(requested.flatMap(name=>[name,...known.filter(key=>key.startsWith(name+'.'))]))]}
function cancelField(name:string){generations.set(name,++sequence);pendingFields.get(name)?.cancel();pendingFields.delete(name);completedFields.delete(name);states.value={...states.value,[name]:stateFor(name)}}
function cancelBatch(){batch++;validating.value=false;batchController?.abort();batchController=undefined}
function cancelAll(){lifetime++;cancelBatch();submission++;for(const entry of pendingFields.values())entry.cancel();pendingFields.clear();completedFields.clear();for(const name of generations.keys())cancelField(name)}
function clearValidate(paths?:HysFormPaths){cancelBatch();for(const name of namesFor(paths,knownNames())){cancelField(name);delete errors.value[name];delete warnings.value[name];states.value={...states.value,[name]:stateFor(name)}}}
function validateOne(name:string,trigger?:HysFormTrigger):Promise<{valid:boolean;cancelled:boolean}>{
  const previous=pendingFields.get(name)
  // A queued change watcher must not supersede a full validation that already
  // checks the same value. Explicit validate calls still start a fresh run.
  if(trigger&&previous?.full&&!previous.signal.aborted&&previous.epoch===lifetime&&previous.version===modelVersion&&sameFormValue(previous.value,formValue(props.model,name)))return previous.promise
  previous?.cancel()
  if(!trigger)completedFields.delete(name)
  const controller=new AbortController();let resolveCancellation!:(result:{valid:boolean;cancelled:boolean})=>void
  const cancellation=new Promise<{valid:boolean;cancelled:boolean}>(resolve=>{resolveCancellation=resolve})
  const entry={promise:Promise.race([runOne(name,trigger,controller.signal),cancellation]),value:snapshotForm(formValue(props.model,name)),full:!trigger,epoch:lifetime,version:modelVersion,token:generations.get(name)??0,signal:controller.signal,cancel:()=>{controller.abort();resolveCancellation({valid:false,cancelled:true})}}
  pendingFields.set(name,entry)
  void entry.promise.then(result=>{if(entry.full&&!result.cancelled&&!entry.signal.aborted&&entry.token===generations.get(name))completedFields.set(name,{result,value:entry.value,epoch:entry.epoch,version:entry.version,token:entry.token});if(pendingFields.get(name)===entry)pendingFields.delete(name)})
  return entry.promise
}
async function runOne(name:string,trigger:HysFormTrigger|undefined,signal:AbortSignal):Promise<{valid:boolean;cancelled:boolean}>{
  if(!live)return {valid:false,cancelled:true}
  const field=getField(name),triggerAllowed=field?.trigger.value??props.validateTrigger
  if(trigger&&(![triggerAllowed].flat().includes(trigger)||disabled.value||resetting.value))return {valid:!errors.value[name],cancelled:false}
  const allRules=rulesFor(name),rules=allRules.filter(rule=>!trigger||!rule.trigger||[rule.trigger].flat().includes(trigger))
  // A change event must not erase an error produced only by blur rules.
  if(trigger&&allRules.length&&!rules.length)return {valid:!errors.value[name],cancelled:false}
  const token=++sequence,epoch=lifetime,model=snapshotForm(props.model??{}) as Record<string,unknown>,value=formValue(model,name)
  const dependencies=(field?.dependencies?.value??[]).map(path=>({path,value:snapshotForm(formValue(model,path))}))
  generations.set(name,token);states.value={...states.value,[name]:{...stateFor(name),status:'validating',validating:true}}
  const current=()=>live&&!signal.aborted&&epoch===lifetime&&generations.get(name)===token&&sameFormValue(value,formValue(props.model,name))&&dependencies.every(item=>sameFormValue(item.value,formValue(props.model,item.path)))
  let message='',warning=''
  try{
    const outcome=runFormRules(name,value,rules.filter(rule=>rule.level!=='warning'),model,props.validateMessages,{path:name,signal})
    message=typeof outcome==='string'?outcome:await outcome
    if(!message&&current()){const notice=runFormRules(name,value,rules.filter(rule=>rule.level==='warning'),model,props.validateMessages,{path:name,signal});warning=typeof notice==='string'?notice:await notice}
    if(!current())return {valid:false,cancelled:true}
    if(message){if(errors.value[name]!==message)errors.value={...errors.value,[name]:message}}else delete errors.value[name]
    if(warning){if(warnings.value[name]!==warning)warnings.value={...warnings.value,[name]:warning}}else delete warnings.value[name]
    states.value={...states.value,[name]:{status:message?'error':warning?'warning':'success',message,warning,validating:false}}
    emit('validate',name,!message,message)
    return {valid:!message,cancelled:false}
  }finally{if(generations.get(name)===token&&states.value[name]?.validating)states.value={...states.value,[name]:stateFor(name)}}
}
async function validateField(path:HysFormPath,trigger?:HysFormTrigger){return (await validateOne(formPath(path),trigger)).valid}
async function validateResult(paths?:HysFormPaths):Promise<HysFormValidationResult>{
  batchController?.abort();const controller=new AbortController();batchController=controller
  const ticket=++batch,epoch=lifetime,version=modelVersion,values=snapshotForm(props.model??{}) as Record<string,unknown>,names=namesFor(paths,knownNames())
  const result:HysFormValidationResult={valid:false,cancelled:false,values,errors:{},warnings:{}}
  if(!live){result.cancelled=true;return result}
  validating.value=true
  try{
    const results=await Promise.all(names.map(name=>validateOne(name)))
    // Field rules can update while slots render during validation. Follow the
    // latest complete check for the same value instead of reporting a cancelled
    // older check as a validation error. A changed form snapshot still cancels.
    for(let index=0;index<results.length;index++)while(results[index].cancelled&&live&&epoch===lifetime&&ticket===batch&&version===modelVersion){
      const name=names[index],pending=pendingFields.get(name),completed=completedFields.get(name),value=formValue(values,name)
      if(pending?.full&&!pending.signal.aborted&&pending.epoch===epoch&&pending.version===version&&sameFormValue(pending.value,value)){results[index]=await pending.promise;continue}
      if(completed&&completed.epoch===epoch&&completed.version===version&&completed.token===generations.get(name)&&sameFormValue(completed.value,value))results[index]=completed.result
      break
    }
    if(!live||epoch!==lifetime||ticket!==batch||version!==modelVersion||results.some(item=>item.cancelled)){result.cancelled=true;return result}
    const fieldErrors=Object.fromEntries(names.filter(name=>errors.value[name]).map(name=>[name,errors.value[name]])),fieldWarnings=Object.fromEntries(names.filter(name=>warnings.value[name]).map(name=>[name,warnings.value[name]]))
    result.errors=fieldErrors;result.warnings=fieldWarnings;result.valid=results.every(item=>item.valid)
    if(result.valid&&paths===undefined&&props.validate){
      let abort:(()=>void)|undefined
      const cancelled=new Promise<boolean>(resolve=>{abort=()=>resolve(false);controller.signal.addEventListener('abort',abort,{once:true});if(controller.signal.aborted)resolve(false)})
      try{result.valid=await Promise.race([props.validate({signal:controller.signal}),cancelled])}catch{result.valid=false}finally{if(abort)controller.signal.removeEventListener('abort',abort)}
    }
    if(!live||controller.signal.aborted||epoch!==lifetime||ticket!==batch||version!==modelVersion){result.valid=false;result.cancelled=true;return result}
    emit('validation',result);return result
  }finally{if(ticket===batch)validating.value=false;if(batchController===controller)batchController=undefined}
}
async function validate(paths?:HysFormPaths){return (await validateResult(paths)).valid}
const validateFields=validate
function resetFields(paths?:HysFormPaths){
  batch++;submission++;validating.value=false;resetting.value=true
  const names=namesFor(paths,registered.value.length?registered.value.map(field=>field.path.value):Object.keys(initial))
  if(props.model)for(const name of names)setFormValue(props.model,name,snapshotForm(baselines.has(name)?baselines.get(name):formValue(initial,name)))
  clearValidate(paths);emit('reset',names);void nextTick(()=>{resetting.value=false})
}
function captureInitialValues(paths?:HysFormPaths){if(paths===undefined){initial=snapshotForm(props.model??{}) as Record<string,unknown>;baselines.clear()}for(const name of namesFor(paths,registered.value.map(field=>field.path.value)))baselines.set(name,snapshotForm(formValue(props.model,name)))}
function scrollToField(path:HysFormPath,options:ScrollIntoViewOptions={block:'nearest',behavior:'auto'}){getField(path)?.element.value?.scrollIntoView(options)}
function focusField(path:HysFormPath){getField(path)?.focus()}
async function submit(){
  if(!live||disabled.value||validating.value)return
  const ticket=++submission,epoch=lifetime,result=await validateResult()
  if(!live||epoch!==lifetime||ticket!==submission||result.cancelled||disabled.value)return
  if(result.valid)emit('submit',result.values)
  else{emit('invalid',result);await nextTick();const first=Object.keys(result.errors)[0];if(first&&props.scrollToError)scrollToField(first,typeof props.scrollToError==='object'?props.scrollToError:{block:'nearest',behavior:'auto'});if(props.focusOnError){if(first&&getField(first))focusField(first);else focusHysField(root.value?.querySelector<HTMLElement>('[aria-invalid="true"]'))}}
}
function register(field:HysFormField){
  const name=field.path.value;removed.delete(name)
  if(!baselines.has(name)){const value=formValue(initial,name);baselines.set(name,snapshotForm(value===undefined?formValue(props.model,name):value))}
  registered.value=[...registered.value,field]
  return()=>{registered.value=registered.value.filter(item=>item!==field);if(!registered.value.some(item=>item.path.value===name)){removed.add(name);clearValidate([name]);if(formValue(initial,name)===undefined)baselines.delete(name)}}
}
provide(formKey,{model:computed(()=>props.model),resetting,errors,warnings,states,rules:normalizedRules,disabled,size:computed(()=>props.size),labelPosition:computed(()=>props.labelPosition),labelWidth,showLabel:computed(()=>props.showLabel),showFeedback:computed(()=>props.showFeedback),showRequiredMark:computed(()=>props.showRequiredMark),requiredMarkPosition:computed(()=>props.requiredMarkPosition),validateTrigger:computed(()=>props.validateTrigger),validateOnRuleChange:computed(()=>props.validateOnRuleChange),validateField,cancelField:path=>cancelField(formPath(path)),register,clearValidate,resetFields})
watch(()=>props.model,()=>{modelVersion++},{deep:true,flush:'sync'})
watch(()=>props.model,()=>{cancelAll();initial=snapshotForm(props.initialValues??props.model??{}) as Record<string,unknown>;baselines.clear();clearValidate()})
watch(()=>props.initialValues,values=>{if(values){initial=snapshotForm(values) as Record<string,unknown>;baselines.clear()}},{deep:true})
watch(()=>props.rules,()=>{if(sameFormValue(props.rules,lastRules))return;lastRules=snapshotForm(props.rules);cancelAll();if(props.validateOnRuleChange&&live&&!disabled.value)void nextTick().then(()=>{if(live&&!disabled.value)void validate()})},{deep:true})
watch(disabled,value=>{if(value)cancelAll()},{flush:'sync'})
onActivated(()=>{live=true})
onDeactivated(()=>{live=false;cancelAll()})
onBeforeUnmount(()=>{live=false;cancelAll()})
defineExpose({validate,validateFields,validateResult,validateField,clearValidate,resetFields,captureInitialValues,scrollToField,focusField,getField,getFields,errors,warnings,states,validating})
</script>
<template><form ref="root" v-bind="hysRootAttrs" class="hys-ui-ent-form" :class="['hys-ui-form-'+labelPosition,'hys-ui-form-size-'+size,{'hys-ui-form-inline':inline}]" :style="{'--hys-ui-form-label-width':labelWidth}" novalidate :aria-busy="loading||validating||undefined" @submit.prevent="submit" @reset.prevent="resetFields()"><fieldset :disabled="disabled||loading" :inert="disabled||loading"><slot :errors="errors" :warnings="warnings" :validating="validating"/><div v-if="$slots.actions" class="hys-ui-ent-form-actions"><slot name="actions" :validating="validating" :reset="resetFields" :errors="errors" :warnings="warnings"/></div></fieldset></form></template>
<style scoped>
fieldset{border:0;padding:0;margin:0;min-width:0}.hys-ui-form-inline fieldset{display:flex;align-items:flex-start;flex-wrap:wrap;gap:16px}.hys-ui-form-inline :deep(.hys-ui-ent-field){margin-bottom:0}
</style>
