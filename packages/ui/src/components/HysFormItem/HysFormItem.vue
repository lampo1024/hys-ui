<script setup lang="ts">
import {computed,inject,onBeforeUnmount,onMounted,onUpdated,provide,ref,useId,watch} from 'vue'
import {formKey,fieldKey,focusHysField} from '../../composables/formContext'
import {useHysRootAttrs} from '../../config'
const props=defineProps<{label?:string;prop?:string;error?:string;required?:boolean;hint?:string;for?:string}>()
const hysRootAttrs=useHysRootAttrs(),form=inject(formKey,undefined),root=ref<HTMLElement>(),id=useId(),controlId=ref(props.for||id),errorId=id+'-error',hintId=id+'-hint'
const error=computed(()=>props.error||(props.prop?form?.errors.value[props.prop]:'')),invalid=computed(()=>!!error.value)
const required=computed(()=>!!(props.required||(props.prop&&[form?.rules.value[props.prop]||[]].flat().some(rule=>rule.required))))
const describedBy=computed(()=>invalid.value?errorId:props.hint?hintId:undefined)
provide(fieldKey,{id:controlId,label:computed(()=>props.label),error,errorId,describedBy,required})
watch(()=>props.prop?props.prop.split('.').reduce<unknown>((value,key)=>(value as Record<string,unknown>|undefined)?.[key],form?.model.value):undefined,()=>{if(form?.model.value&&!form.resetting.value)validate('change')},{deep:true})
let unregister:(()=>void)|undefined
watch(()=>props.prop,name=>{unregister?.();unregister=name?form?.register(name):undefined},{immediate:true})
onBeforeUnmount(()=>unregister?.())
function getControl(){return(props.for?document.getElementById(props.for):null)||root.value?.querySelector<HTMLElement>('input:not([type="hidden"]):not([hidden]),textarea,select,button[role="combobox"],button[role="switch"],[role="radiogroup"],[role="slider"],[role="button"],[contenteditable][role="textbox"]')}
function focusControl(event:MouseEvent){const element=getControl();if(element&&!element.matches('input,button,textarea,select')){event.preventDefault();focusHysField(element)}}
function sync(){const control=getControl();if(!control)return;if(!control.id)control.id=controlId.value;else controlId.value=control.id;if(control.hasAttribute('data-hys-ui-field-managed'))return;control.setAttribute('aria-invalid',String(invalid.value));if(required.value)control.setAttribute('aria-required','true');else control.removeAttribute('aria-required');const descriptions=new Set((control.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));descriptions.delete(errorId);descriptions.delete(hintId);if(describedBy.value)descriptions.add(describedBy.value);if(descriptions.size)control.setAttribute('aria-describedby',[...descriptions].join(' '));else control.removeAttribute('aria-describedby')}
onMounted(sync);onUpdated(sync)
function validate(trigger:'blur'|'change'){if(!form?.resetting.value&&props.prop)void form?.validateField(props.prop,trigger)}
</script>
<template><div ref="root" v-bind="hysRootAttrs" class="hys-ui-ent-field" @change="!form?.model.value&&validate('change')" @focusout="validate('blur')"><label v-if="label" :for="controlId" @click="focusControl">{{label}} <span v-if="required" aria-hidden="true">*</span></label><div :class="{'hys-ui-ent-invalid':invalid}"><slot :id="controlId" :invalid="invalid" :error="error"/></div><small v-if="error" :id="errorId" role="alert" class="hys-ui-ent-error">{{error}}</small><small v-else-if="hint" :id="hintId">{{hint}}</small></div></template>
