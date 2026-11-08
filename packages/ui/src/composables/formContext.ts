import {computed,inject,type ComputedRef,type InjectionKey,type Ref} from 'vue'
import type {RuleType,ValidateMessages} from 'async-validator'
export type HysFormPath=string|readonly (string|number)[]
export type HysFormPaths=string|readonly HysFormPath[]
export type HysFormTrigger='blur'|'change'
export type HysFormStatus='idle'|'validating'|'success'|'warning'|'error'
export type HysFormRuleType=RuleType
export type HysFormMessages=Partial<ValidateMessages>
export interface HysFormValidationContext {path:string;signal:AbortSignal}
export interface HysFormRule {
  type?:HysFormRuleType
  required?:boolean
  message?:string
  min?:number
  max?:number
  len?:number
  enum?:Array<string|number|boolean|null|undefined>
  whitespace?:boolean
  pattern?:RegExp|string
  transform?:(value:unknown)=>unknown
  fields?:HysFormRules
  defaultField?:HysFormRule|HysFormRule[]
  trigger?:HysFormTrigger|HysFormTrigger[]
  level?:'error'|'warning'
  validator?:(value:unknown,model:Record<string,unknown>,context:HysFormValidationContext)=>boolean|string|Error|void|Promise<boolean|string|Error|void>
}
export interface HysFormRules {[path:string]:HysFormRule|HysFormRule[]}
export interface HysFormValidationResult {valid:boolean;cancelled:boolean;values:Record<string,unknown>;errors:Record<string,string>;warnings:Record<string,string>}
export interface HysFormFieldState {status:HysFormStatus;message:string;warning:string;validating:boolean}
export interface HysFormField {
  path:ComputedRef<string>
  element:Ref<HTMLElement|undefined>
  rules:ComputedRef<HysFormRule[]>
  trigger:ComputedRef<HysFormTrigger|HysFormTrigger[]>
  dependencies?:ComputedRef<readonly HysFormPath[]>
  label:ComputedRef<string|undefined>
  validate:(trigger?:HysFormTrigger)=>Promise<boolean>
  clearValidate:()=>void
  resetField:()=>void
  focus:()=>void
}
export interface HysFormContext {
  model:ComputedRef<Record<string,unknown>|undefined>
  resetting:Ref<boolean>
  errors:Ref<Record<string,string>>
  warnings:Ref<Record<string,string>>
  states:Ref<Record<string,HysFormFieldState>>
  rules:ComputedRef<HysFormRules>
  disabled:ComputedRef<boolean>
  size:ComputedRef<'sm'|'md'|'lg'>
  labelPosition:ComputedRef<'top'|'left'|'right'>
  labelWidth:ComputedRef<string>
  showLabel:ComputedRef<boolean>
  showFeedback:ComputedRef<boolean>
  showRequiredMark:ComputedRef<boolean>
  requiredMarkPosition:ComputedRef<'left'|'right'>
  validateTrigger:ComputedRef<HysFormTrigger|HysFormTrigger[]>
  validateOnRuleChange:ComputedRef<boolean>
  register:(field:HysFormField)=>()=>void
  validateField:(name:HysFormPath,trigger?:HysFormTrigger)=>Promise<boolean>
  cancelField:(name:HysFormPath)=>void
  clearValidate:(names?:HysFormPaths)=>void
  resetFields:(names?:HysFormPaths)=>void
}
export const formKey:InjectionKey<HysFormContext>=Symbol('hys-ui-form')
export interface HysFieldContext {
  id:Ref<string>
  label:ComputedRef<string|undefined>
  error:ComputedRef<string|undefined>
  errorId:string
  describedBy:ComputedRef<string|undefined>
  required:ComputedRef<boolean>
  disabled?:ComputedRef<boolean>
  size?:ComputedRef<'sm'|'md'|'lg'>
}
export const fieldKey:InjectionKey<HysFieldContext>=Symbol('hys-ui-field')
export function useHysControlState(props:{disabled?:boolean;size?:'sm'|'md'|'lg'}){
  const form=inject(formKey,undefined),field=inject(fieldKey,undefined)
  return {disabled:computed(()=>!!(props.disabled||form?.disabled.value||field?.disabled?.value)),size:computed(()=>props.size??field?.size?.value??form?.size.value??'md'),label:computed(()=>field?.label.value)}
}
export function formPath(path:HysFormPath):string{return Array.isArray(path)?path.map(String).join('.'):String(path).replace(/\[(?:"([^"\]]+)"|'([^'\]]+)'|(\d+))\]/g,(_match,double,single,index)=>'.'+(double??single??index)).replace(/^\./,'')}
export function formValue(model:Record<string,unknown>|undefined,path:HysFormPath):unknown{return formPath(path).split('.').reduce<unknown>((value,key)=>value!=null?Object.prototype.hasOwnProperty.call(Object(value),key)?(value as Record<string,unknown>)[key]:undefined:undefined,model)}
export function setFormValue(model:Record<string,unknown>,path:HysFormPath,value:unknown){const parts=formPath(path).split('.');if(parts.some(part=>['__proto__','prototype','constructor'].includes(part)))return;const last=parts.pop()!;let parent=model;for(let i=0;i<parts.length;i++){const key=parts[i];if(!parent[key]||typeof parent[key]!=='object')parent[key]=/^\d+$/.test(parts[i+1]??last)?[]:{};parent=parent[key] as Record<string,unknown>}parent[last]=value}
export function focusHysField(control:HTMLElement|null|undefined){
  if(!control||control.closest('[inert],fieldset[disabled]')||control.getAttribute('aria-disabled')==='true')return
  const target=control.matches('input:not([type="hidden"]):not([hidden]),button,textarea,select,a[href],[tabindex],[contenteditable="true"]')?control:control.querySelector<HTMLElement>('input:checked:not(:disabled),input:not(:disabled):not([type="hidden"]):not([hidden]),button:not(:disabled),[tabindex]:not([tabindex="-1"])')
  target?.focus()
}
