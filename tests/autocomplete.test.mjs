import {test,afterEach} from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true})
for(const name of ['window','document','Document','ShadowRoot','Node','Element','HTMLElement','SVGElement','HTMLInputElement','HTMLTextAreaElement','HTMLButtonElement','HTMLSelectElement','HTMLFormElement','Event','FocusEvent','MouseEvent','KeyboardEvent','CompositionEvent','MutationObserver'])globalThis[name]=dom.window[name]
globalThis.getComputedStyle=window.getComputedStyle.bind(window)
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window)
window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}})
HTMLElement.prototype.getBoundingClientRect=function(){return {x:20,y:20,left:20,top:20,right:320,bottom:60,width:300,height:40,toJSON(){return {}}}}
HTMLElement.prototype.getClientRects=function(){return [this.getBoundingClientRect()]}
HTMLElement.prototype.scrollIntoView=function(){}
if(!('inert' in HTMLElement.prototype))Object.defineProperty(HTMLElement.prototype,'inert',{configurable:true,get(){return this.hasAttribute('inert')},set(value){this.toggleAttribute('inert',!!value)}})
const {createApp,h,reactive,ref,nextTick,KeepAlive,defineComponent}=await import('vue')
const ui=await import('../packages/ui/dist/index.js'),mounts=new Set()
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const settle=async()=>{await nextTick();await pause(0);await nextTick()}
async function mount(values={},slots={},accept=true,Component=ui.HysAutocomplete){
 const props=reactive(values),events={},element=ref(),host=document.createElement('div');document.body.append(host)
 const listeners=Object.fromEntries((Array.isArray(Component.emits)?Component.emits:Object.keys(Component.emits||{})).map(name=>['on'+name[0].toUpperCase()+name.slice(1),(...args)=>{(events[name]??=[]).push(args);if(accept&&name.startsWith('update:'))props[name.slice(7)]=args[0]}]))
 const app=createApp({setup(){ui.provideHysConfig({motion:'off'});return()=>h(Component,{...props,...listeners,ref:element},slots)}})
 app.mount(host);const item={props,events,host,get vm(){return element.value},find:selector=>host.querySelector(selector),unmount(){app.unmount();host.remove();mounts.delete(item)}};mounts.add(item);await settle();return item
}
const key=async(el,key,options={})=>{el.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options}));await settle()}
const input=async(entry,value)=>{const el=entry.find('input,textarea');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));await settle()}
const popup=()=>document.querySelector('.hys-ui-autocomplete-popup')
const options=()=>[...document.querySelectorAll('.hys-ui-autocomplete-option')]
afterEach(async()=>{for(const item of [...mounts])item.unmount();await settle();document.body.innerHTML=''})

test('Autocomplete allows free text without selecting or opening on mount',async()=>{
 const entry=await mount({defaultValue:'自由输入',options:['Vue','TypeScript']});assert.equal(entry.find('input').value,'自由输入');assert.equal(popup(),null);await input(entry,'任意文字');assert.equal(entry.props.modelValue,'任意文字');assert.equal(entry.events.search.at(-1)[0],'任意文字');assert.equal(options().length,0);await key(entry.find('input'),'Enter');assert.equal(entry.events.select,undefined);assert.equal(popup(),null)
})
test('Local suggestions filter labels and values case insensitively and retain raw items',async()=>{
 const raw={value:'vue',label:'Vue Framework',count:12},entry=await mount({options:[raw,{value:'React',label:'Library'}]});await input(entry,'VUE');assert.equal(options().length,1);assert.equal(options()[0].textContent.trim(),'Vue Framework');options()[0].click();await settle();assert.equal(entry.props.modelValue,'vue');assert.equal(entry.events.select[0][0].count,12);assert.equal(entry.events.select[0][1],'vue');assert.equal(popup(),null)
})
test('Custom filter, case sensitive mode, disabled groups and field keys work',async()=>{
 const entry=await mount({valueKey:'id',labelKey:'title',caseSensitive:true,options:[{label:'Languages',options:[{id:'a',title:'Alpha'},{id:'b',title:'Beta',disabled:true}]},{label:'Closed',disabled:true,children:[{id:'c',title:'Gamma'}]}]});await input(entry,'alpha');assert.equal(options().length,0);entry.props.filterOption=false;await settle();assert.equal(options().length,3);assert.equal(document.querySelectorAll('.hys-ui-autocomplete-group').length,2);await key(entry.find('input'),'ArrowDown');assert.equal(entry.vm.highlightedIndex,0);await key(entry.find('input'),'ArrowDown');assert.equal(entry.vm.highlightedIndex,0);await key(entry.find('input'),'Enter');assert.equal(entry.props.modelValue,'a');entry.props.filterOption=(query,item)=>typeof item!=='string'&&item.id===query;await input(entry,'b');assert.equal(options().length,1);assert.equal(options()[0].getAttribute('aria-disabled'),'true')
})
test('Malformed option entries are ignored while empty values remain selectable',async()=>{
 const entry=await mount({options:[null,3,[],false,{value:'',label:'Clear choice'},'Good']});await entry.vm.open();await settle();assert.equal(options().length,2);options()[0].click();await settle();assert.equal(entry.events.select[0][1],'')
})
test('Default open respects controlled false and controlled hosts may veto changes',async()=>{
 const entry=await mount({open:false,defaultOpen:true,modelValue:'keep',options:['new']},{},false);assert.equal(popup(),null);await entry.vm.open();await settle();assert.equal(popup(),null);assert.equal(entry.events['update:open'].at(-1)[0],true);entry.props.open=true;await settle();assert(popup());await entry.vm.select('new');assert.equal(entry.find('input').value,'keep');assert.equal(entry.events.select,undefined);entry.vm.close();await settle();assert(popup());entry.props.open=false;await settle();assert.equal(popup(),null)
})
test('Keyboard navigation skips disabled items, loops and exposes active descendant',async()=>{
 const entry=await mount({options:['Alpha',{value:'Blocked',disabled:true},'Gamma'],triggerOnFocus:false});const el=entry.find('input');el.focus();await settle();assert.equal(popup(),null);await key(el,'ArrowDown');assert.equal(entry.vm.highlightedIndex,0);assert.equal(el.getAttribute('aria-activedescendant'),options()[0].id);await key(el,'ArrowDown');assert.equal(entry.vm.highlightedIndex,2);await key(el,'ArrowDown');assert.equal(entry.vm.highlightedIndex,0);await key(el,'End');assert.equal(entry.vm.highlightedIndex,2);await key(el,'Home');assert.equal(entry.vm.highlightedIndex,0);await key(el,'Enter');assert.equal(entry.props.modelValue,'Alpha');assert.equal(popup(),null)
})
test('Backfill previews keyboard choices without mutating model and Escape restores input',async()=>{
 const entry=await mount({defaultValue:'a',options:['Alpha','Amber'],backfill:true});await entry.vm.open();await settle();await key(entry.find('input'),'ArrowDown');assert.equal(entry.find('input').value,'Alpha');assert.equal(entry.events['update:modelValue'],undefined);await key(entry.find('input'),'Escape');assert.equal(entry.find('input').value,'a')
})
test('Unmatched Enter, Tab selection, append and clear-after-select have explicit behavior',async()=>{
 const entry=await mount({options:['@mail.test'],defaultValue:'alex',append:true,filterOption:false,selectOnTab:true});await key(entry.find('input'),'ArrowDown');await key(entry.find('input'),'Tab');assert.equal(entry.props.modelValue,'alex@mail.test');entry.props.append=false;entry.props.clearAfterSelect=true;await settle();await entry.vm.select('Chosen');assert.equal(entry.props.modelValue,'');assert.equal(entry.events.select.at(-1)[1],'Chosen');entry.props.clearAfterSelect=false;entry.props.selectWhenUnmatched=true;await input(entry,'Custom');await key(entry.find('input'),'Enter');assert.equal(entry.events.select.at(-1)[1],'Custom')
})
test('Clear emits one update/input/change and never reopens with an empty search',async()=>{
 const entry=await mount({defaultValue:'Alpha',options:['Alpha','Beta'],clearable:true});entry.find('input').focus();await settle();assert(popup());const button=entry.host.querySelector('button');assert(button);button.click();await settle();assert.equal(entry.events['update:modelValue'].length,1);assert.equal(entry.events.input.length,1);assert.equal(entry.events.change.length,1);assert.equal(entry.events.clear.length,1);assert.equal(entry.events.search,undefined);assert.equal(popup(),null);assert.equal(entry.find('input').value,'')
})
test('IME updates only after composition ends and duplicate final input is suppressed',async()=>{
 const entry=await mount({options:['中文','中国']});const el=entry.find('input');el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));await input(entry,'中');assert.equal(entry.events.input,undefined);await key(el,'Enter',{isComposing:true});assert.equal(entry.events.select,undefined);el.dispatchEvent(new CompositionEvent('compositionend',{data:'中',bubbles:true}));await settle();el.dispatchEvent(new Event('input',{bubbles:true}));await settle();assert.equal(entry.props.modelValue,'中');assert.equal(entry.events.input.length,1);assert.equal(entry.events.search.length,1);assert.equal(options().length,2)
})
test('Clearing an unfocused input does not reopen suggestions when the input regains focus',async()=>{
 const entry=await mount({defaultValue:'Alpha',options:['Alpha'],clearable:true});assert.notEqual(document.activeElement,entry.find('input'));entry.find('button').click();await settle();assert.equal(entry.find('input').value,'');assert.equal(popup(),null)
})
test('Callbacks, returned arrays and Promises all provide suggestions',async()=>{
 for(const fetchSuggestions of [(q,done)=>done([q+' callback']),q=>[q+' array'],async q=>[q+' promise']]){const entry=await mount({fetchSuggestions,debounce:0});await input(entry,'Vue');assert.equal(options().length,1);assert(options()[0].textContent.includes('Vue'));entry.unmount()}
})
test('Debouncing cancels superseded searches and getData is immediate even when closed',async()=>{
 const calls=[],entry=await mount({debounce:50,fetchSuggestions:q=>{calls.push(q);return [q]}});await input(entry,'a');await input(entry,'ab');assert.equal(calls.length,0);await pause(65);await settle();assert.deepEqual(calls,['ab']);entry.vm.close();await settle();await entry.vm.getData();await settle();assert.deepEqual(calls,['ab','ab'])
})
test('Late callbacks cannot overwrite newer queries and aborted signals are observable',async()=>{
 const requests=[],entry=await mount({debounce:0,fetchSuggestions:(query,done,context)=>requests.push({query,done,context})});await input(entry,'old');await input(entry,'new');assert.equal(requests[0].context.signal.aborted,true);requests[1].done(['New result']);await settle();requests[0].done(['Old result']);await settle();assert.equal(options()[0].textContent.trim(),'New result');assert.equal(entry.vm.loading,false);entry.vm.close();await settle();assert.equal(requests[1].context.signal.aborted,true)
})
test('Only the first successful result per request is accepted',async()=>{
 const entry=await mount({debounce:0,fetchSuggestions:(_q,done)=>{done(['First']);done(['Second']);return ['Third']}});await entry.vm.open();await settle();assert.equal(options()[0].textContent.trim(),'First')
})
test('Rejected requests including falsey errors support immediate retry',async()=>{
 let count=0;const entry=await mount({debounce:300,fetchSuggestions:()=>++count===1?Promise.reject(undefined):Promise.resolve(['Recovered'])});await entry.vm.getData();await settle();assert.equal(entry.events.searchError.length,1);assert(popup().textContent.includes('建议加载失败'));assert.equal(entry.vm.loading,false);await entry.vm.retry();await settle();assert.equal(options()[0].textContent.trim(),'Recovered')
})
test('Remote results are not filtered twice, and inline provider identity changes do not restart work',async()=>{
 let calls=0;const entry=await mount({debounce:0,fetchSuggestions:()=>{calls++;return ['Server synonyms']}});await input(entry,'different');assert.equal(options().length,1);entry.props.fetchSuggestions=()=>{calls++;return ['Latest']};await settle();assert.equal(calls,1);await entry.vm.getData();await settle();assert.equal(calls,2);assert.equal(options()[0].textContent.trim(),'Latest')
})
test('Minimum query length and getShow prevent requests and close active popups',async()=>{
 let calls=0;const entry=await mount({minQueryLength:2,debounce:0,fetchSuggestions:()=>{calls++;return ['Result']}});await input(entry,'a');assert.equal(calls,0);assert.equal(popup(),null);await input(entry,'ab');assert.equal(calls,1);entry.props.getShow=q=>q.length>3;await settle();assert.equal(popup(),null);await input(entry,'abcd');assert.equal(calls,2)
})
test('Custom input, templates, loading and popup header/footer slots share state',async()=>{
 let done;const entry=await mount({debounce:0,fetchSuggestions:(_q,cb)=>done=cb},{input:({value,setValue,inputProps})=>h(ui.HysTextarea,{...inputProps,modelValue:value,'onUpdate:modelValue':setValue}),loading:()=>h('i','Custom loading'),header:({query})=>h('b','Query '+query),footer:({options})=>h('small','Found '+options.length),default:({item})=>h('strong','Choice '+item)});await input(entry,'Term');assert(entry.find('textarea'));assert.equal(entry.find('textarea').getAttribute('role'),'combobox');assert(popup().textContent.includes('Custom loading'));done(['Result']);await settle();assert.equal(popup().querySelector('strong').textContent,'Choice Result');assert(popup().textContent.includes('Found 1'));assert(popup().textContent.includes('Query Term'))
})
test('Focus can move to footer actions without closing; leaving the component closes it',async()=>{
 const entry=await mount({options:['A']},{footer:()=>h('button','Footer action')});entry.find('input').focus();await settle();popup().querySelector('button').focus();await settle();assert(popup());assert.equal(entry.events.blur,undefined);const outside=document.createElement('button');document.body.append(outside);outside.focus();await settle();assert.equal(popup(),null);assert.equal(entry.events.blur.length,1)
})
test('Disabled, readonly, form sizes and form resets propagate to autocomplete',async()=>{
 const model=reactive({name:'Alpha'}),form=ref(),disabled=ref(false),Wrapper=defineComponent({setup:()=>()=>h(ui.HysForm,{ref:form,model,size:'sm',disabled:disabled.value},()=>h(ui.HysFormItem,{prop:'name',label:'Name'},()=>h(ui.HysAutocomplete,{modelValue:model.name,'onUpdate:modelValue':v=>model.name=v,options:['Alpha','Beta'],clearable:true})))}),entry=await mount({}, {},true,Wrapper);const el=entry.find('input');el.focus();await settle();assert(popup().classList.contains('hys-ui-autocomplete-sm'));await input(entry,'B');assert.equal(model.name,'B');await form.value.resetFields();await settle();assert.equal(el.value,'Alpha');assert.equal(popup(),null);disabled.value=true;await settle();assert(el.disabled);entry.unmount();const ro=await mount({readonly:true,options:['A']});ro.find('input').focus();await settle();assert.equal(popup(),null);await ro.vm.select('A');assert.equal(ro.events.select,undefined)
})
test('Options arriving asynchronously can highlight the first enabled entry',async()=>{
 const entry=await mount({options:[],highlightFirst:true});await entry.vm.open();await settle();entry.props.options=[{value:'Disabled',disabled:true},'Loaded'];await settle();assert.equal(entry.vm.highlightedIndex,1);assert.equal(entry.vm.suggestions.length,2)
})
test('Tab selection survives overlay listeners and lets focus leave the input',async()=>{
 const entry=await mount({options:['Alpha','Beta'],selectOnTab:true});const el=entry.find('input');el.focus();await settle();await key(el,'ArrowDown');assert.equal(entry.vm.highlightedIndex,0);await key(el,'Tab');assert.equal(entry.props.modelValue,'Alpha');assert.equal(popup(),null)
})
test('Tab reaches popup actions and returns to the surrounding document',async()=>{
 const entry=await mount({options:['Alpha']},{footer:()=>h('button','Action')});const el=entry.find('input'),after=document.createElement('button');document.body.append(after);el.focus();await settle();await key(el,'Tab');const action=popup().querySelector('button');assert.equal(document.activeElement,action);await key(action,'Tab');assert.equal(document.activeElement,after);assert.equal(popup(),null);el.focus();await settle();await key(el,'Tab');await key(popup().querySelector('button'),'Tab',{shiftKey:true});assert.equal(document.activeElement,el);assert.equal(popup(),null)
})
test('Clicking an already focused input reopens suggestions after Escape',async()=>{
 const entry=await mount({options:['Alpha']});const el=entry.find('input');el.focus();await settle();await key(el,'Escape');assert.equal(popup(),null);el.click();await settle();assert(popup())
})
test('Unmount and cached-page deactivation abort work and remove panels',async()=>{
 const state=reactive({visible:true}),requests=[],Wrapper=defineComponent({setup:()=>()=>h(KeepAlive,null,()=>state.visible?h(ui.HysAutocomplete,{debounce:0,fetchSuggestions:(_q,done,{signal})=>requests.push({done,signal})}):h('div','Other'))}),entry=await mount({}, {},true,Wrapper);entry.find('input').focus();await settle();assert(popup());state.visible=false;await settle();assert.equal(popup(),null);assert(requests[0].signal.aborted);requests[0].done(['Stale']);await settle();assert.equal(popup(),null);state.visible=true;await settle();entry.find('input').focus();await settle();assert(popup());entry.unmount();await settle();assert.equal(popup(),null);assert(requests.at(-1).signal.aborted)
})
test('Cached-page deactivation releases position observers without recreating them',async()=>{
 const previous=globalThis.ResizeObserver,active=new Set();globalThis.ResizeObserver=class{observe(){active.add(this)}disconnect(){active.delete(this)}};
 let entry;try{const state=reactive({visible:true}),Wrapper=defineComponent({setup:()=>()=>h(KeepAlive,null,()=>state.visible?h(ui.HysAutocomplete,{options:['Alpha']}):h('div','Other'))});entry=await mount({}, {},true,Wrapper);entry.find('input').focus();await settle();assert(active.size>0);state.visible=false;await settle();assert.equal(active.size,0);state.visible=true;await settle();assert(active.size>0);entry.unmount();await settle();assert.equal(active.size,0)}finally{entry?.unmount();if(previous===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=previous}
})
