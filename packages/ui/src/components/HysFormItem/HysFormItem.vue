<script setup lang="ts">
import {computed,inject,onBeforeUnmount,onMounted,onUpdated,provide,ref,useId,watch} from 'vue'
import {formKey,fieldKey} from '../../composables/formContext'
import {useHysRootAttrs} from '../../config'
const props=defineProps<{label?:string;prop?:string;error?:string;required?:boolean;hint?:string;for?:string}>()
const hysRootAttrs=useHysRootAttrs(),form=inject(formKey,undefined),root=ref<HTMLElement>(),id=useId(),controlId=ref(props.for||id),errorId=id+'-error'
const error=computed(()=>props.error||(props.prop?form?.errors.value[props.prop]:'')),invalid=computed(()=>!!error.value)
const required=computed(()=>!!(props.required||(props.prop&&[form?.rules.value[props.prop]||[]].flat().some(rule=>rule.required))))
provide(fieldKey,{id:controlId,error,errorId,required})
let unregister:(()=>void)|undefined
watch(()=>props.prop,name=>{unregister?.();unregister=name?form?.register(name):undefined},{immediate:true})
onBeforeUnmount(()=>unregister?.())
function sync(){const control=root.value?.querySelector<HTMLElement>('input:not([type="hidden"]),textarea,select,button[role="combobox"],button[role="switch"]');if(!control)return;if(!control.id)control.id=controlId.value;else controlId.value=control.id;control.setAttribute('aria-invalid',String(invalid.value));if(required.value)control.setAttribute('aria-required','true');const descriptions=new Set((control.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));if(invalid.value)descriptions.add(errorId);else descriptions.delete(errorId);if(descriptions.size)control.setAttribute('aria-describedby',[...descriptions].join(' '));else control.removeAttribute('aria-describedby')}
onMounted(sync);onUpdated(sync)
function validate(trigger:'blur'|'change'){if(props.prop)void form?.validateField(props.prop,trigger)}
</script>
<template><div ref="root" v-bind="hysRootAttrs" class="hys-ui-ent-field" @change="validate('change')" @focusout="validate('blur')"><label v-if="label" :for="controlId">{{label}} <span v-if="required" aria-hidden="true">*</span></label><div :class="{'hys-ui-ent-invalid':invalid}"><slot :id="controlId" :invalid="invalid" :error="error"/></div><small v-if="error" :id="errorId" role="alert" class="hys-ui-ent-error">{{error}}</small><small v-else-if="hint">{{hint}}</small></div></template>
