import type {ComputedRef,InjectionKey,Ref} from 'vue'
export interface HysFormRule {required?:boolean;message?:string;min?:number;max?:number;pattern?:RegExp;trigger?:'blur'|'change'|('blur'|'change')[];validator?:(value:unknown,model:Record<string,unknown>)=>boolean|string|void|Promise<boolean|string|void>}
export interface HysFormContext {model:ComputedRef<Record<string,unknown>|undefined>;resetting:Ref<boolean>;errors:Ref<Record<string,string>>;rules:ComputedRef<Record<string,HysFormRule|HysFormRule[]>>;register:(name:string)=>()=>void;validateField:(name:string,trigger?:'blur'|'change')=>Promise<boolean>}
export const formKey:InjectionKey<HysFormContext>=Symbol('hys-ui-form')
export interface HysFieldContext {id:Ref<string>;label:ComputedRef<string|undefined>;error:ComputedRef<string|undefined>;errorId:string;describedBy:ComputedRef<string|undefined>;required:ComputedRef<boolean>}
export const fieldKey:InjectionKey<HysFieldContext>=Symbol('hys-ui-field')

export function focusHysField(control:HTMLElement|null|undefined){
 if(!control||control.closest('[inert],fieldset[disabled]')||control.getAttribute('aria-disabled')==='true')return
 const target=control.matches('input,button,textarea,select,a[href],[tabindex],[contenteditable="true"]')?control:control.querySelector<HTMLElement>('input:checked:not(:disabled),input:not(:disabled):not([hidden]),button:not(:disabled),[tabindex]:not([tabindex="-1"])')
 target?.focus()
}
