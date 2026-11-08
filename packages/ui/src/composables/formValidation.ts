import AsyncValidator from 'async-validator'
import type {RuleItem,Rules,ValidateError} from 'async-validator'
import {toRaw,unref} from 'vue'
import type {HysFormMessages,HysFormRule,HysFormValidationContext} from './formContext'
const Schema=(AsyncValidator as unknown as {default?:typeof AsyncValidator}).default??AsyncValidator

export function snapshotForm(value:unknown,seen=new WeakMap<object,unknown>()):unknown{
  const raw=toRaw(unref(value));if(!raw||typeof raw!=='object')return raw
  if(raw instanceof Date)return new Date(raw)
  if(raw instanceof RegExp)return new RegExp(raw.source,raw.flags)
  if(seen.has(raw))return seen.get(raw)
  if(!Array.isArray(raw)&&Object.getPrototypeOf(raw)!==Object.prototype&&Object.getPrototypeOf(raw)!==null)return raw
  const result:Record<string,unknown>|unknown[]=Array.isArray(raw)?[]:{};seen.set(raw,result)
  for(const [key,item] of Object.entries(raw))Object.defineProperty(result,key,{value:snapshotForm(item,seen),writable:true,enumerable:true,configurable:true})
  return result
}
export function sameFormValue(a:unknown,b:unknown,seen=new WeakMap<object,object>()):boolean{
  a=toRaw(a);b=toRaw(b);if(Object.is(a,b))return true
  if(a instanceof Date&&b instanceof Date)return a.getTime()===b.getTime()
  if(a instanceof RegExp&&b instanceof RegExp)return a.source===b.source&&a.flags===b.flags
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return false
  if(seen.get(a)===b)return true;seen.set(a,b)
  if(Array.isArray(a)!==Array.isArray(b)||Object.getPrototypeOf(a)!==Object.getPrototypeOf(b))return false
  if(!Array.isArray(a)&&![Object.prototype,null].includes(Object.getPrototypeOf(a)))return false
  const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(key=>Object.prototype.hasOwnProperty.call(b,key)&&sameFormValue((a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key],seen))
}
function inferredType(value:unknown):RuleItem['type']{return value instanceof Date?'date':Array.isArray(value)?'array':value&&typeof value==='object'?'object':typeof value==='number'?'number':typeof value==='boolean'?'boolean':'string'}
function descriptor(rules:HysFormRule[],value:unknown,model:Record<string,unknown>,context:HysFormValidationContext):RuleItem[]{
  return rules.flatMap(rule=>{
    const {validator,trigger:_trigger,level:_level,fields,defaultField,...rest}=rule
    const result:RuleItem[]=[]
    // Built-in constraints and custom validators must both run. async-validator
    // otherwise treats a custom validator as a replacement for built-in rules.
    const builtin:RuleItem={...rest,type:rest.type??(rest.enum?'enum':inferredType(value))}
    if(fields){const nested:Rules={};for(const [key,child] of Object.entries(fields))nested[key]=descriptor([child].flat(),(value as Record<string,unknown>|undefined)?.[key],model,context);builtin.fields=nested}
    if(defaultField)builtin.defaultField=descriptor([defaultField].flat(),Array.isArray(value)?value[0]:undefined,model,context)
    if(Object.keys(rest).some(key=>key!=='message')||fields||defaultField||!validator)result.push(builtin)
    if(validator)result.push({asyncValidator:async(item,next)=>{if(context.signal.aborted)return;const outcome=await validator(next,model,{...context,path:item.fullField??context.path});if(context.signal.aborted)return;if(outcome===false)throw Error(rule.message||'校验未通过');if(typeof outcome==='string')throw Error(outcome);if(outcome instanceof Error)throw outcome}})
    return result
  })
}
const defaultMessages:HysFormMessages={default:'校验未通过',required:'此项不能为空',enum:'请选择允许的值',whitespace:'不能只输入空白字符',types:{string:'请输入文本',number:'请输入数字',boolean:'请输入布尔值',method:'应为函数',regexp:'正则表达式无效',integer:'请输入整数',float:'请输入有效数值',array:'应为数组',object:'应为对象',date:'日期无效',email:'邮箱格式不正确',url:'链接格式不正确',hex:'颜色格式不正确'},string:{len:(_field,len)=>'长度应为 '+len+' 个字符',min:(_field,min)=>'长度至少为 '+min+' 个字符',max:(_field,max)=>'长度最多为 '+max+' 个字符',range:(_field,min,max)=>'长度应为 '+min+'–'+max+' 个字符'},number:{len:'数值不符合要求',min:'数值过小',max:'数值过大',range:'超出允许范围'},array:{len:'项目数量不符合要求',min:'项目数量过少',max:'项目数量过多',range:'项目数量超出允许范围'},pattern:{mismatch:'格式不正确'},date:{format:'日期格式不正确',parse:'日期无法解析',invalid:'日期无效'}}
export function runFormRules(name:string,value:unknown,rules:HysFormRule[],model:Record<string,unknown>,messages?:HysFormMessages,context:HysFormValidationContext={path:name,signal:new AbortController().signal}):string|Promise<string>{
  if(!rules.length)return ''
  try{
    const validator=new Schema({[name]:descriptor(rules,value,model,context)})
    validator.messages(defaultMessages);if(messages)validator.messages(messages)
    let complete=false,message='',resolveResult!:(message:string)=>void
    const result=new Promise<string>(resolve=>{resolveResult=resolve})
    const validation=validator.validate({[name]:snapshotForm(value)},{firstFields:true,suppressWarning:true,suppressValidatorError:true},errors=>{message=errors?.[0]?.message||'';complete=true;resolveResult(message)})
    // The callback is our result channel; consume the engine's rejected promise.
    void validation.catch(()=>{})
    return complete?message:result
  }catch(error){const errors=(error as {errors?:ValidateError[]})?.errors;return errors?.[0]?.message||(error instanceof Error?error.message:'校验失败')}
}
