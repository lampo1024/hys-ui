import {test,afterEach} from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true})
for(const name of ['window','document','Document','ShadowRoot','Node','Element','HTMLElement','SVGElement','HTMLInputElement','HTMLTextAreaElement','HTMLButtonElement','HTMLSelectElement','HTMLFormElement','Event','FocusEvent','MouseEvent','KeyboardEvent','MutationObserver'])globalThis[name]=dom.window[name]
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window)
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window)
globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window)
window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}})
HTMLElement.prototype.getBoundingClientRect=function(){return {x:20,y:20,left:20,top:20,right:320,bottom:60,width:300,height:40,toJSON(){return {}}}}
HTMLElement.prototype.getClientRects=function(){return [this.getBoundingClientRect()]}
HTMLElement.prototype.scrollIntoView=function(){}
if(!('inert' in HTMLElement.prototype))Object.defineProperty(HTMLElement.prototype,'inert',{configurable:true,get(){return this.hasAttribute('inert')},set(value){this.toggleAttribute('inert',!!value)}})
const {createApp,h,reactive,ref,nextTick,KeepAlive,defineComponent}=await import('vue')
const ui=await import('../packages/ui/dist/index.js')
const mounts=new Set()
async function mount(Component,values={},slots={}){
 const props=reactive(values),events={},element=ref(),host=document.createElement('div');document.body.append(host)
 const listeners=Object.fromEntries((Array.isArray(Component.emits)?Component.emits:Object.keys(Component.emits||{})).map(name=>['on'+name[0].toUpperCase()+name.slice(1),(...args)=>{(events[name]??=[]).push(args);if(name.startsWith('update:'))props[name.slice(7)]=args[0]}]))
 const app=createApp({setup(){ui.provideHysConfig({motion:'off'});return()=>h(Component,{...props,...listeners,ref:element},typeof slots==='string'?{default:()=>slots}:slots)}})
 app.mount(host);const item={props,events,host,get vm(){return element.value},find:(selector)=>host.querySelector(selector),all:selector=>[...host.querySelectorAll(selector)],unmount(){app.unmount();host.remove();mounts.delete(item)}};mounts.add(item);await nextTick();return item
}
const fire=async(element,type,options={})=>{assert(element,'Missing target for '+type);const EventClass=type.startsWith('key')?KeyboardEvent:type==='click'?MouseEvent:Event;element.dispatchEvent(new EventClass(type,{bubbles:true,cancelable:true,...options}));await nextTick()}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
afterEach(async()=>{for(const item of [...mounts])item.unmount();await nextTick();document.body.innerHTML='';document.body.style.cssText=''})

test('Button defaults to non-submitting native type; loading suppresses action',async()=>{const button=await mount(ui.HysButton,{},'Save');assert.equal(button.find('button').type,'button');await fire(button.find('button'),'click');assert.equal(button.events.click.length,1);button.props.loading=true;await nextTick();await fire(button.find('button'),'click');assert.equal(button.events.click.length,1);assert.equal(button.find('button').getAttribute('aria-busy'),'true')})
test('Button disabled links cannot navigate; blank links have safe rel and slots',async()=>{const button=await mount(ui.HysButton,{href:'https://example.com',target:'_blank',disabled:true},{icon:()=>h('i','Icon'),default:()=> 'Link'});assert.equal(button.find('a').getAttribute('href'),null);await fire(button.find('a'),'click');assert(!button.events.click);button.props.disabled=false;await nextTick();assert.equal(button.find('a').rel,'noopener noreferrer');assert(button.find('i'));button.vm.focus();assert.equal(document.activeElement,button.find('a'))})
test('Input forwards native attributes, composition, clear and password visibility',async()=>{const input=await mount(ui.HysInput,{modelValue:'abc',id:'native-field',name:'username',clearable:true,type:'password',showPassword:true});const field=input.find('input');assert.equal(field.id,'native-field');assert.equal(field.name,'username');await fire(field,'compositionstart');field.value='中文';await fire(field,'input');assert(!input.events.input);await fire(field,'compositionend');assert.equal(input.props.modelValue,'中文');await fire(input.find('[aria-label="显示密码"]'),'click');assert.equal(field.type,'text');await fire(input.find('[aria-label="清空输入"]'),'click');assert.equal(input.props.modelValue,'');assert.equal(input.events.clear.length,1)})
test('Readonly Input never offers a clearing action',async()=>{const input=await mount(ui.HysInput,{modelValue:'fixed',readonly:true,clearable:true});assert(input.find('input').readOnly);assert(!input.find('[aria-label="清空输入"]'))})

test('Input formats displayed text, publishes raw values and keeps native form data unformatted',async()=>{
 const entry=await mount(ui.HysInput,{modelValue:'1234',name:'amount',formatter:value=>value?'$ '+value.replace(/\B(?=(\d{3})+(?!\d))/g,','):'',parser:value=>value.replace(/[$,\s]/g,'')});const control=entry.find('input:not([type="hidden"])');assert.equal(control.value,'$ 1,234');control.value='$ 2,500';await fire(control,'input');assert.equal(entry.props.modelValue,'2500');assert.equal(entry.events.input.at(-1)[0],'2500');assert.equal(entry.find('input[type="hidden"]').value,'2500');assert.equal(control.name,'');await fire(control,'change');await fire(control,'blur');assert.deepEqual(entry.events.change,[['2500']])
})
test('Input supports uncontrolled defaults and controlled hosts can reject updates',async()=>{
 const requests=[],Wrapper=defineComponent({setup(){return()=>h(ui.HysInput,{modelValue:'fixed','onUpdate:modelValue':value=>requests.push(value)})}}),controlled=await mount(Wrapper);controlled.find('input').value='attempt';await fire(controlled.find('input'),'input');assert.deepEqual(requests,['attempt']);assert.equal(controlled.find('input').value,'fixed');controlled.unmount()
 const value=await mount(ui.HysInput,{defaultValue:'Initial'});assert.equal(value.find('input').value,'Initial');value.vm.clear();await nextTick();assert.equal(value.find('input').value,'')
})
test('Input grapheme limits preserve emoji families, combining characters and native minimum validity',async()=>{
 const entry=await mount(ui.HysInput,{modelValue:'',maxlength:2,minlength:2,countGraphemes:true,showCount:true});const control=entry.find('input');assert.equal(control.getAttribute('maxlength'),null);control.value='👨‍👩‍👧‍👦e\u0301😀';await fire(control,'input');assert.equal(entry.props.modelValue,'👨‍👩‍👧‍👦e\u0301');assert.equal(entry.find('.hys-ui-input-count').textContent,'2 / 2');assert(control.validity.valid);control.value='😀';await fire(control,'input');assert(control.validity.customError);assert(document.getElementById(control.getAttribute('aria-describedby')))
})
test('Input accepts custom count strategies, count output and zero-length boundaries',async()=>{
 const entry=await mount(ui.HysInput,{modelValue:'',maxlength:4,countGraphemes:value=>Array.from(value).reduce((n,char)=>n+(char.charCodeAt(0)>127?2:1),0),showCount:{formatter:({count,maxLength})=>`${count} of ${maxLength}`},countPosition:'outside'});entry.find('input').value='中ab文';await fire(entry.find('input'),'input');assert.equal(entry.props.modelValue,'中ab');assert.equal(entry.find('.hys-ui-input-count-outside').textContent,'4 of 4');entry.props.maxlength=0;await nextTick();entry.find('input').value='x';await fire(entry.find('input'),'input');assert.equal(entry.props.modelValue,'')
})
test('Input keeps IME drafts intact, publishes composition once and rejects filtered input safely',async()=>{
 const entry=await mount(ui.HysInput,{modelValue:'',maxlength:2,countGraphemes:true,allowInput:value=>!value.includes('!')});const control=entry.find('input');await fire(control,'compositionstart');control.value='中文输入';await fire(control,'input');assert.equal(entry.events.input,undefined);assert.equal(control.value,'中文输入');await fire(control,'compositionend');assert.equal(entry.props.modelValue,'中文');await fire(control,'input');assert.equal(entry.events.input.length,1);control.value='中文!';await fire(control,'input');assert.equal(control.value,'中文');assert.equal(entry.props.modelValue,'中文')
})
test('Input icon props and custom clear/password slots share accessible actions',async()=>{
 const Icon=defineComponent({setup:()=>()=>h('b',{'data-custom-icon':''},'Icon')}),entry=await mount(ui.HysInput,{modelValue:'secret',type:'password',showPassword:true,clearable:true,clearIcon:Icon,prefixIcon:Icon,suffixIcon:Icon},{'password-icon':({visible})=>h('span',visible?'Visible':'Hidden')});assert.equal(entry.all('[data-custom-icon]').length,3);assert.equal(entry.find('[aria-label="显示密码"]').textContent,'Hidden');entry.vm.focus();entry.vm.setSelectionRange(1,3);await fire(entry.find('[aria-label="显示密码"]'),'click');assert.equal(entry.find('input').type,'text');assert.equal(entry.find('input').selectionStart,1);await fire(entry.find('[aria-label="清空输入"]'),'click');assert.equal(entry.props.modelValue,'');assert.equal(entry.events.change.at(-1)[0],'')
})
test('Input textarea mode and standalone Textarea share rows, counters, labels and forwarded slots',async()=>{
 const entry=await mount(ui.HysInput,{modelValue:'Note',type:'textarea',rows:3,label:'Notes',showCount:true,clearable:true},{'clear-icon':()=>h('b','Reset')});assert.equal(entry.find('textarea').rows,3);assert.equal(entry.find('label').htmlFor,entry.find('textarea').id);assert.equal(entry.vm.textarea,entry.find('textarea'));assert.equal(entry.find('[aria-label="清空输入"]').textContent,'Reset');entry.unmount()
 const standalone=await mount(ui.HysTextarea,{modelValue:'Long',maxlength:10,label:'Description'},{count:({count})=>h('span',`Length ${count}`)});assert.equal(standalone.find('textarea').rows,4);assert.equal(standalone.find('.hys-ui-input-count').textContent,'Length 4');assert.equal(standalone.vm.input,standalone.find('textarea'));assert(standalone.find('textarea').labels.length)
})
test('Input parser failures and reset during composition never publish stale text',async()=>{
 const model=reactive({text:'Base'}),form=await mount(ui.HysForm,{model},{default:()=>h(ui.HysFormItem,{prop:'text',label:'Text'},()=>h(ui.HysInput,{modelValue:model.text,parser:value=>{if(value.includes('!'))throw Error('Invalid');return value},'onUpdate:modelValue':value=>model.text=value}))});const control=form.find('input');control.value='!';await fire(control,'input');assert.equal(control.value,'Base');await fire(control,'compositionstart');control.value='草稿';await fire(control,'input');form.vm.resetFields();await nextTick();await fire(control,'compositionend');assert.equal(control.value,'Base');assert.equal(model.text,'Base')
})
test('Input reset wins when a clear update and form reset happen in the same event',async()=>{
 const model=reactive({text:''}),form=await mount(ui.HysForm,{model},{default:()=>h(ui.HysFormItem,{prop:'text'},()=>h(ui.HysInput,{modelValue:model.text,'onUpdate:modelValue':value=>model.text=value}))});const input=form.find('input');input.value='Changed';await fire(input,'input');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));form.vm.resetFields();await nextTick();await nextTick();assert.equal(model.text,'');assert.equal(input.value,'')
})
test('Textarea autosize grows, caps and shrinks, then releases its size observer on cached-page leave',async()=>{
 const Previous=globalThis.ResizeObserver,observers=new Set();globalThis.ResizeObserver=class{constructor(callback){this.callback=callback}observe(){observers.add(this)}disconnect(){observers.delete(this)}}
 try{
  const visible=ref(true),value=ref('one'),automatic=ref(true),Page=defineComponent({setup(){return()=>h(ui.HysInput,{type:'textarea',modelValue:value.value,autosize:automatic.value?{minRows:2,maxRows:3}:false})}}),Wrapper=defineComponent({setup(){return()=>h(KeepAlive,{},()=>visible.value?h(Page):null)}}),view=await mount(Wrapper),area=view.find('textarea');Object.defineProperty(area,'scrollHeight',{get:()=>area.value.split('\n').length*21,configurable:true});await pause(35);const initial=parseFloat(area.style.height);value.value='a\nb\nc\nd\ne';await nextTick();await pause(35);const capped=parseFloat(area.style.height);assert(capped>initial&&capped<=63);assert.equal(area.style.overflowY,'auto');value.value='one';await nextTick();await pause(35);assert.equal(parseFloat(area.style.height),initial);assert.equal(area.style.overflowY,'hidden');assert.equal(observers.size,1);visible.value=false;await nextTick();assert.equal(observers.size,0);visible.value=true;await nextTick();await nextTick();assert.equal(observers.size,1);automatic.value=false;await nextTick();await pause(35);assert.equal(area.style.height,'')
 }finally{for(const item of [...mounts])item.unmount();globalThis.ResizeObserver=Previous}
})
test('Held password viewing hides on release, disabled state and cached-page leave',async()=>{
 const visible=ref(true),disabled=ref(false),Page=defineComponent({setup(){return()=>h(ui.HysInput,{modelValue:'Secret',type:'password',showPassword:true,showPasswordOn:'mousedown',disabled:disabled.value})}}),Wrapper=defineComponent({setup(){return()=>h(KeepAlive,{},()=>visible.value?h(Page):null)}}),view=await mount(Wrapper)
 const hold=async()=>{const event=new Event('pointerdown',{bubbles:true,cancelable:true});Object.defineProperty(event,'button',{value:0});view.find('[aria-label="显示密码"]').dispatchEvent(event);await nextTick();assert.equal(view.find('input').type,'text')}
 await hold();document.dispatchEvent(new Event('pointerup'));await nextTick();assert.equal(view.find('input').type,'password');await hold();disabled.value=true;await nextTick();assert.equal(view.find('input').type,'password');disabled.value=false;await nextTick();await hold();visible.value=false;await nextTick();document.dispatchEvent(new Event('pointerup'));visible.value=true;await nextTick();assert.equal(view.find('input').type,'password');assert.equal(view.find('input').value,'Secret');assert.equal(view.find('input').autocomplete,'')
})
test('NumberInput has precise stepping, bounds, hidden controls and readonly',async()=>{const input=await mount(ui.HysNumberInput,{modelValue:.1,step:.2,min:0,max:.5});await fire(input.find('[aria-label="增加"]'),'click');assert.equal(input.props.modelValue,.3);await fire(input.find('[aria-label="增加"]'),'click');assert.equal(input.props.modelValue,.5);assert(input.find('[aria-label="增加"]').disabled);input.props.showControls=false;await nextTick();assert.equal(input.all('button').length,0);input.props.readonly=true;await nextTick();await fire(input.find('input'),'keydown',{key:'ArrowDown'});assert.equal(input.props.modelValue,.5);input.props.readonly=false;input.props.modelValue=1;input.props.step=1;input.props.max=10;await nextTick();const field=input.find('input');field.value='2.5';await fire(field,'change');assert.equal(input.props.modelValue,2.5);input.props.modelValue=0;input.props.step=1e-7;await nextTick();await fire(field,'keydown',{key:'ArrowUp'});assert.equal(input.props.modelValue,1e-7);field.value='0.25';await fire(field,'input');assert.equal(input.events.input.at(-1)[0],.25);assert.equal(input.props.modelValue,1e-7);field.value='';await fire(field,'input');assert.equal(input.events.input.at(-1)[0],null)})

test('NumberInput empty state, default values and clear policies remain distinct from zero',async()=>{
 const number=await mount(ui.HysNumberInput,{defaultValue:0,clearable:true});assert.equal(number.find('input').value,'0');await fire(number.find('[aria-label="清空数值"]'),'click');assert.equal(number.props.modelValue,null);assert.equal(number.find('input').value,'')
 number.props.min=5;number.props.max=20;number.props.valueOnClear='min';number.props.modelValue=8;await nextTick();await fire(number.find('[aria-label="清空数值"]'),'click');assert.equal(number.props.modelValue,5);number.props.valueOnClear='max';await nextTick();await fire(number.find('[aria-label="清空数值"]'),'click');assert.equal(number.props.modelValue,20)
})

test('NumberInput decimal steps avoid binary drift, preserve precision and use bounded strict grids',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:1.005,precision:2,step:.01});await fire(number.find('input'),'change');assert.equal(number.props.modelValue,1.01);assert.equal(number.find('input').value,'1.01')
 number.props.modelValue=-1.005;await nextTick();await fire(number.find('input'),'change');assert.equal(number.props.modelValue,-1.01)
 number.props.modelValue=.2;number.props.step=.2;number.props.min=.15;number.props.max=.9;number.props.stepStrictly=true;await nextTick();number.find('input').value='1';await fire(number.find('input'),'change');assert.equal(number.props.modelValue,.8);assert(number.find('[aria-label="增加"]').disabled)
 number.props.min=.11;number.props.max=.19;await nextTick();assert(number.find('[aria-label="增加"]').disabled);assert(number.find('[aria-label="减少"]').disabled);number.find('input').value='.15';await fire(number.find('input'),'change');assert.equal(number.props.modelValue,.8);assert.equal(number.events.invalid.at(-1)[0].reason,'range')
})

test('NumberInput string mode preserves high precision and exponent values across steps',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:'9007199254740993.0000000000000001',step:'0.0000000000000001',stringMode:true});await fire(number.find('[aria-label="增加"]'),'click');assert.equal(number.props.modelValue,'9007199254740993.0000000000000002');assert.equal(number.events.step.at(-1)[1].offset,'0.0000000000000001')
 number.props.modelValue='1e-20';number.props.step='1e-20';await nextTick();await fire(number.find('[aria-label="减少"]'),'click');assert.equal(number.props.modelValue,'0');assert.equal(number.find('input').getAttribute('role'),'spinbutton')
})

test('NumberInput formatter/parser separates displayed text from raw model and native form values',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:1000,formatter:value=>value===null?'':'$ '+String(value).replace(/\B(?=(\d{3})+(?!\d))/g,','),parser:text=>text.replace(/[$,\s]/g,''),name:'amount'})
 assert.equal(number.find('input:not([type="hidden"])').value,'$ 1,000');const input=number.find('input:not([type="hidden"])');input.value='$ 2,500';await fire(input,'input');assert.equal(number.props.modelValue,1000);assert.equal(number.events.input.at(-1)[0],2500);await fire(input,'change');assert.equal(number.props.modelValue,2500);assert.equal(number.find('input[type="hidden"]').value,'2500');assert.equal(input.name,'')
})

test('NumberInput keeps incomplete drafts, commits on Enter/blur and can revert with Escape',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:4,parser:text=>text});const input=number.find('input');input.value='-';await fire(input,'input');assert.equal(number.props.modelValue,4);assert.equal(input.value,'-');await fire(input,'keydown',{key:'Escape'});assert.equal(input.value,'4')
 input.value='8.5';await fire(input,'input');await fire(input,'keydown',{key:'Enter'});assert.equal(number.props.modelValue,8.5);assert.equal(number.events.pressEnter.length,1);await fire(input,'change');await fire(input,'blur');assert.equal(number.events.change.length,1)
 input.value='bad';await fire(input,'input');await fire(input,'blur');assert.equal(number.props.modelValue,8.5);assert.equal(input.value,'8.5');assert.equal(number.events.invalid.at(-1)[0].reason,'parse')
})

test('NumberInput live updates preserve typing and controlled parents can veto a requested value',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:1,updateOnInput:true,parser:text=>text});const input=number.find('input');input.value='1.';await fire(input,'input');assert.equal(input.value,'1.');input.value='1.2';await fire(input,'input');assert.equal(number.props.modelValue,1.2);assert.equal(input.value,'1.2')
 number.unmount();const requests=[],Wrapper=defineComponent({setup(){return()=>h(ui.HysNumberInput,{modelValue:3,updateOnInput:true,'onUpdate:modelValue':value=>requests.push(value)})}}),controlled=await mount(Wrapper);controlled.find('input').value='4';await fire(controlled.find('input'),'input');await nextTick();assert.deepEqual(requests,[4]);assert.equal(controlled.find('input').value,'3')
})

test('NumberInput validates candidate values, filters raw input and honors keyboard configuration',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:2,validator:value=>value===null||Number(value)%2===0,allowInput:text=>/^-?\d*$/.test(text),keyboard:false});const input=number.find('input');input.value='abc';await fire(input,'input');assert.equal(input.value,'2');input.value='3';await fire(input,'input');await fire(input,'change');assert.equal(number.props.modelValue,2);assert.equal(number.events.invalid.at(-1)[0].reason,'validator')
 await fire(input,'keydown',{key:'ArrowUp'});assert.equal(number.props.modelValue,2);number.props.keyboard={ArrowDown:false};number.props.step=2;await nextTick();await fire(input,'keydown',{key:'ArrowUp'});assert.equal(number.props.modelValue,4);await fire(input,'keydown',{key:'ArrowDown'});assert.equal(number.props.modelValue,4)
})

test('NumberInput right/hidden controls, status and forwarded native attributes share field context',async()=>{
 const form=await mount(ui.HysForm,{model:{count:1},size:'lg'},{default:()=>h(ui.HysFormItem,{label:'Quantity',prop:'count',status:'error',help:'Server feedback'},()=>h(ui.HysNumberInput,{modelValue:1,controlsPosition:'right',id:'quantity',name:'quantity',placeholder:'Enter quantity',autocomplete:'off'}))})
 const input=form.find('input:not([type="hidden"])');assert.equal(input.id,'quantity');assert.equal(input.getAttribute('aria-invalid'),'true');assert.equal(input.placeholder,'Enter quantity');assert.equal(input.autocomplete,'off');assert(form.find('.hys-ui-number-lg'));assert(form.find('.hys-ui-number-controls'));assert.equal(form.find('label').htmlFor,'quantity');assert.equal(document.getElementById(input.getAttribute('aria-describedby')).textContent,'Server feedback')
})

test('NumberInput form reset discards an uncommitted draft even when model value did not change',async()=>{
 const model=reactive({count:1}),form=await mount(ui.HysForm,{model},{default:()=>h(ui.HysFormItem,{label:'Count',prop:'count'},()=>h(ui.HysNumberInput,{modelValue:model.count,'onUpdate:modelValue':value=>model.count=value}))})
 const input=form.find('input');input.value='9';await fire(input,'input');assert.equal(model.count,1);form.vm.resetFields();await nextTick();assert.equal(input.value,'1')
})

test('NumberInput bound changes never silently mutate host data and contradictory bounds block actions',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:10,min:0,max:20});number.props.max=5;await nextTick();assert.equal(number.props.modelValue,10);assert.equal(number.events.change,undefined);assert.equal(number.find('input').getAttribute('aria-invalid'),'true');await fire(number.find('[aria-label="减少"]'),'click');assert.equal(number.props.modelValue,5)
 number.props.min=8;await nextTick();await fire(number.find('[aria-label="增加"]'),'click');assert.equal(number.props.modelValue,5);assert(number.find('[aria-label="增加"]').disabled)
})

test('NumberInput long-press repetition stops at bounds and is cleaned when a cached page leaves',async()=>{
 const visible=ref(true),value=ref(0),Page=defineComponent({setup(){return()=>h(ui.HysNumberInput,{modelValue:value.value,repeatDelay:5,repeatInterval:20,max:3,'onUpdate:modelValue':next=>value.value=next})}}),Wrapper=defineComponent({setup(){return()=>h(KeepAlive,{},()=>visible.value?h(Page):null)}}),wrapper=await mount(Wrapper)
 const event=new Event('pointerdown',{bubbles:true,cancelable:true});Object.defineProperty(event,'button',{value:0});wrapper.find('[aria-label="增加"]').dispatchEvent(event);await pause(75);assert.equal(value.value,3);visible.value=false;await nextTick();const before=value.value;await pause(60);assert.equal(value.value,before)
 visible.value=true;await nextTick();value.value=0;await nextTick();const another=new Event('pointerdown',{bubbles:true,cancelable:true});Object.defineProperty(another,'button',{value:0});wrapper.find('[aria-label="增加"]').dispatchEvent(another);visible.value=false;await nextTick();const stopped=value.value;await pause(60);assert.equal(value.value,stopped)
})

test('NumberInput wheel is opt-in, focus-scoped and Home/End leave unbounded text editing alone',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:2});const input=number.find('input');input.focus();let event=new window.WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true});input.dispatchEvent(event);await nextTick();assert.equal(event.defaultPrevented,true);assert.equal(number.props.modelValue,2)
 number.props.wheel=true;await nextTick();event=new window.WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true});input.dispatchEvent(event);await nextTick();assert.equal(number.props.modelValue,3);input.blur();event=new window.WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true});input.dispatchEvent(event);assert.equal(event.defaultPrevented,false)
 number.props.formatter=value=>String(value);await nextTick();await fire(input,'keydown',{key:'Home'});await fire(input,'keydown',{key:'End'});assert.equal(number.props.modelValue,3)
})

test('NumberInput rejects disallowed composition text without corrupting the previous draft',async()=>{
 const number=await mount(ui.HysNumberInput,{modelValue:2,allowInput:text=>/^\d*$/.test(text)}),input=number.find('input');await fire(input,'compositionstart');input.value='中文';await fire(input,'input');assert.equal(number.events.input,undefined);await fire(input,'compositionend');assert.equal(input.value,'2');assert.equal(number.props.modelValue,2)
})
test('Select filters, skips disabled options and closes single selection',async()=>{const select=await mount(ui.HysSelect,{modelValue:'a',filterable:true,options:[{value:'a',label:'Alpha'},{value:'b',label:'Blocked',disabled:true},{value:'c',label:'Charlie'}]});await fire(select.find('[role="combobox"]'),'click');await pause(20);const search=document.querySelector('[aria-label="搜索选项"]');assert(search);search.value='Charlie';await fire(search,'input');const options=[...document.querySelectorAll('[role="option"]')];assert.equal(options.length,1);await fire(options[0],'click');assert.equal(select.props.modelValue,'c');assert(!document.querySelector('[role="listbox"]'))})
test('Multiple Select toggles entries and stays open; clear emits empty array',async()=>{const select=await mount(ui.HysSelect,{modelValue:[],multiple:true,clearable:true,options:[{value:'a',label:'One'},{value:'b',label:'Two'}]});await fire(select.find('[role="combobox"]'),'click');await pause(20);await fire(document.querySelector('[role="option"]'),'click');assert.deepEqual([...select.props.modelValue],['a']);assert(document.querySelector('[role="listbox"]'));await fire(select.find('[aria-label="清空选择"]'),'click');assert.deepEqual([...select.props.modelValue],[])})

test('Select distinguishes zero, false, empty strings and numeric versus text identities',async()=>{
 const select=await mount(ui.HysSelect,{modelValue:0,emptyValues:[null,undefined],options:[{label:'Zero',value:0},{label:'False',value:false},{label:'Empty',value:''},{label:'Text zero',value:'0'}],clearable:true,clearValue:null})
 assert.equal(select.find('[role="combobox"]').textContent.trim(),'Zero');await fire(select.find('[role="combobox"]'),'click');assert.equal(document.querySelectorAll('[role="option"]').length,4)
 const options=[...document.querySelectorAll('[role="option"]')];assert.equal(options[0].getAttribute('aria-selected'),'true');assert.equal(options[3].getAttribute('aria-selected'),'false');await fire(options[1],'click');assert.equal(select.props.modelValue,false)
 await fire(select.find('[role="combobox"]'),'click');await fire(document.querySelectorAll('[role="option"]')[2],'click');assert.equal(select.props.modelValue,'');assert(select.host.textContent.includes('Empty'))
 await fire(select.find('[aria-label="清空选择"]'),'click');assert.equal(select.props.modelValue,null);assert.equal(select.events.change.at(-1)[1],undefined)
})

test('Select uncontrolled defaults and value-key object identities survive data replacement',async()=>{
 const select=await mount(ui.HysSelect,{defaultValue:{id:1,name:'Original'},valueKey:'id',options:[{label:'One',value:{id:1,name:'One'}},{label:'Two',value:{id:2,name:'Two'}}]})
 assert(select.host.textContent.includes('One'));select.props.options=[{label:'Updated',value:{id:1,name:'Replaced'}},{label:'Two',value:{id:2,name:'Two'}}];await nextTick();assert(select.host.textContent.includes('Updated'))
 await fire(select.find('[role="combobox"]'),'click');assert.equal(document.querySelectorAll('[aria-selected="true"]').length,1);await fire(document.querySelectorAll('[role="option"]')[1],'click');assert.equal(select.props.modelValue.id,2);assert.equal(select.events.change.at(-1)[1].label,'Two')
})

test('Grouped options use custom data fields, inherit disabled groups and search individual labels',async()=>{
 const select=await mount(ui.HysSelect,{modelValue:null,filterable:true,fieldNames:{label:'name',value:'id',options:'children',disabled:'blocked'},options:[{name:'Team A',children:[{id:1,name:'Alice'},{id:2,name:'Amy'}]},{name:'Team B',blocked:true,children:[{id:3,name:'Bob'}]}]})
 await fire(select.find('[role="combobox"]'),'click');await pause(0);assert.equal(document.querySelectorAll('.hys-ui-select-group').length,2);assert(document.querySelectorAll('[role="option"]')[2].disabled)
 const search=document.querySelector('[aria-label="搜索选项"]');search.value='Amy';await fire(search,'input');assert.equal(document.querySelectorAll('.hys-ui-select-group').length,1);assert.equal(document.querySelectorAll('[role="option"]').length,1);await fire(document.querySelector('[role="option"]'),'click');assert.equal(select.props.modelValue,2)
})

test('Select enforces multiple limits but keeps deselection and removable tags available',async()=>{
 const select=await mount(ui.HysSelect,{modelValue:[0],multiple:true,multipleLimit:2,maxTagCount:1,options:[{label:'Zero',value:0},{label:'One',value:1},{label:'Two',value:2}]})
 await fire(select.find('[role="combobox"]'),'click');await fire(document.querySelectorAll('[role="option"]')[1],'click');assert.deepEqual([...select.props.modelValue],[0,1]);assert(document.querySelectorAll('[role="option"]')[2].disabled);assert(!document.querySelectorAll('[role="option"]')[0].disabled);assert(select.host.textContent.includes('+1'))
 await fire(select.find('[aria-label="移除 Zero"]'),'click');assert.deepEqual([...select.props.modelValue],[1]);assert.equal(select.events.removeTag.at(-1)[0],0);assert(!document.querySelectorAll('[role="option"]')[2].disabled)
})

test('Readonly Select cannot change via options, token input or Backspace',async()=>{
 const select=await mount(ui.HysSelect,{modelValue:['A'],multiple:true,readonly:true,allowCreate:true,tokenSeparators:[','],options:[{label:'A',value:'A'}]})
 await fire(select.find('[role="combobox"]'),'click');await pause(0);assert(document.querySelector('[role="option"]').disabled);const search=document.querySelector('[aria-label="搜索选项"]');search.value='B,';await fire(search,'input');await fire(search,'keydown',{key:'Backspace'});assert.deepEqual([...select.props.modelValue],['A']);assert(!select.find('[aria-label="移除 A"]'))
})

test('Select creates options on commit, deduplicates separator input and respects limits',async()=>{
 let calls=0;const select=await mount(ui.HysSelect,{modelValue:[],multiple:true,allowCreate:true,multipleLimit:3,tokenSeparators:[',',';'],createOption:label=>{calls++;return {label,value:label.toLowerCase()}},options:[]})
 await fire(select.find('[role="combobox"]'),'click');const search=document.querySelector('[aria-label="搜索选项"]');search.value='Alpha';await fire(search,'input');assert.equal(calls,0);await fire(search,'keydown',{key:'Enter'});assert.deepEqual([...select.props.modelValue],['alpha']);assert.equal(calls,1)
 search.value='Beta;Beta,Gamma,Delta,';await fire(search,'input');assert.deepEqual([...select.props.modelValue],['alpha','beta','gamma']);assert.equal(select.events.create.length,3);assert.equal(select.events.reject.at(-1)[1],'limit');assert.equal(search.value,'')
})

test('Select composition defers search requests and created token commits',async()=>{
 const select=await mount(ui.HysSelect,{modelValue:[],multiple:true,allowCreate:true,tokenSeparators:[','],options:[]})
 await fire(select.find('[role="combobox"]'),'click');const input=document.querySelector('[aria-label="搜索选项"]');await fire(input,'compositionstart');input.value='中文,';await fire(input,'input');await fire(input,'keydown',{key:'Enter',isComposing:true});assert.equal(select.events.search,undefined);assert.deepEqual([...select.props.modelValue],[])
 await fire(input,'compositionend');assert.deepEqual([...select.props.modelValue],['中文']);assert.equal(select.events.create.length,1)
})

test('Select controlled open requests can be vetoed and external changes remain authoritative',async()=>{
 const shown=ref(false),requests=[],Wrapper=defineComponent({setup(){return()=>h(ui.HysSelect,{open:shown.value,options:[{label:'One',value:1}],'onUpdate:open':value=>requests.push(value)})}}),select=await mount(Wrapper)
 await fire(select.find('[role="combobox"]'),'click');assert.equal(document.querySelector('[role="listbox"]'),null);assert.deepEqual(requests,[true])
 shown.value=true;await nextTick();await nextTick();assert(document.querySelector('[role="listbox"]'));await fire(document,'keydown',{key:'Escape'});assert(document.querySelector('[role="listbox"]'));assert.equal(requests.at(-1),false)
 shown.value=false;await nextTick();assert.equal(document.querySelector('[role="listbox"]'),null)
})

test('Select controlled search and stable sorting do not mutate host options',async()=>{
 const search=ref('B'),updates=[],options=[{label:'Beta',value:'b'},{label:'Alpha',value:'a'}],Wrapper=defineComponent({setup(){return()=>h(ui.HysSelect,{defaultOpen:true,filterable:true,searchValue:search.value,options,filterSort:(a,b)=>a.label.localeCompare(b.label),'onUpdate:searchValue':value=>updates.push(value)})}})
 const select=await mount(Wrapper);await pause(0);const input=document.querySelector('[aria-label="搜索选项"]');assert.equal(input.value,'B');assert.equal(document.querySelectorAll('[role="option"]').length,1)
 input.value='A';await fire(input,'input');assert.equal(updates.at(-1),'A');assert.equal(document.querySelectorAll('[role="option"]').length,1);search.value='';await nextTick();assert.equal(document.querySelector('[role="option"]').textContent,'Alpha');assert.equal(options[0].label,'Beta')
})

test('Select remote method aborts stale work, preserves selected labels and can retry failures',async()=>{
 const pending=[],select=await mount(ui.HysSelect,{modelValue:1,filterable:true,options:[{label:'Original',value:1}],remoteMethod:(query,{signal})=>new Promise((resolve,reject)=>pending.push({query,signal,resolve,reject}))})
 await fire(select.find('[role="combobox"]'),'click');await pause(0);assert.equal(pending.length,1);const input=document.querySelector('[aria-label="搜索选项"]');input.value='New';await fire(input,'input');assert.equal(pending[0].signal.aborted,true)
 pending[0].resolve([{label:'Stale',value:0}]);pending[1].resolve([{label:'Server alias',value:2}]);await pause(0);assert.equal(document.querySelector('[role="option"]').textContent,'Server alias');assert(select.host.textContent.includes('Original'))
 input.value='Failure';await fire(input,'input');pending.at(-1).reject(Error('Offline'));await pause(0);assert(document.querySelector('.hys-ui-select-retry'));await fire(document.querySelector('.hys-ui-select-retry'),'click');pending.at(-1).resolve([{label:'Recovered',value:3}]);await pause(0);assert.equal(document.querySelector('[role="option"]').textContent,'Recovered');assert.equal(select.events.searchError.length,1)
 select.vm.close();await nextTick();assert.equal(document.querySelector('[role="listbox"]'),null)
})

test('Switching a Select from failed remote search to local options clears obsolete errors',async()=>{
 const select=await mount(ui.HysSelect,{defaultOpen:true,remoteMethod:async()=>{throw Error('Offline')},options:[{label:'Local option',value:0}]});await pause(0);assert(document.querySelector('.hys-ui-select-retry'))
 select.props.remoteMethod=undefined;await nextTick();await nextTick();assert.equal(document.querySelector('.hys-ui-select-retry'),null);assert.equal(document.querySelector('[role="option"]').textContent,'Local option')
})

test('Select debounce timers and remote callbacks are cleaned on cached-page leave',async()=>{
 const shown=ref(true),signals=[],Page=defineComponent({setup(){return()=>h(ui.HysSelect,{defaultOpen:true,filterable:true,debounce:10,remoteMethod:(_query,{signal})=>{signals.push(signal);return new Promise(()=>{})}})}}),Wrapper=defineComponent({setup(){return()=>h(KeepAlive,{},()=>shown.value?h(Page):null)}})
 await mount(Wrapper);shown.value=false;await nextTick();await pause(20);assert.equal(signals.length,0);assert.equal(document.querySelector('[role="listbox"]'),null)
 shown.value=true;await nextTick();const trigger=document.querySelector('[role="combobox"]');await fire(trigger,'click');await pause(20);assert.equal(signals.length,1);shown.value=false;await nextTick();assert.equal(signals[0].aborted,true)
})

test('Virtual Select bounds DOM rows while End and Home reveal real active descendants',async()=>{
 const options=Array.from({length:10000},(_,index)=>({value:index,label:'Option '+index})),select=await mount(ui.HysSelect,{modelValue:0,options,listHeight:210})
 await fire(select.find('[role="combobox"]'),'click');await pause(0);assert(document.querySelectorAll('[role="option"]').length<25)
 await fire(select.find('[role="combobox"]'),'keydown',{key:'End'});assert.equal(document.getElementById(select.find('[role="combobox"]').getAttribute('aria-activedescendant')).textContent,'Option 9999');assert(document.querySelectorAll('[role="option"]').length<25)
 await fire(select.find('[role="combobox"]'),'keydown',{key:'Home'});assert.equal(document.getElementById(select.find('[role="combobox"]').getAttribute('aria-activedescendant')).textContent,'Option 0');await fire(select.find('[role="combobox"]'),'keydown',{key:'End'});await fire(select.find('[role="combobox"]'),'keydown',{key:'Enter'});assert.equal(select.props.modelValue,9999)
})

test('Select supports local popup mounting and native form data without duplicate visible controls',async()=>{
 const select=await mount(ui.HysSelect,{modelValue:[0,false],multiple:true,name:'selection',appendTo:false,options:[{label:'Zero',value:0},{label:'False',value:false}]})
 await fire(select.find('[role="combobox"]'),'click');assert(select.find('[role="listbox"]'));assert.deepEqual(select.all('input[type="hidden"]').map(input=>[input.name,input.value]),[['selection','0'],['selection','false']]);select.props.disabled=true;await nextTick();assert(select.all('input').every(input=>input.disabled));assert(!select.find('[role="listbox"]'))
})

test('Wrapping labels open custom Select controls without activating the clear action',async()=>{
 const value=ref('a'),Wrapper=defineComponent({setup(){return()=>h('label',{},[h('span','Role label'),h(ui.HysSelect,{modelValue:value.value,clearable:true,options:[{value:'a',label:'Alpha'}],'onUpdate:modelValue':next=>value.value=next})])}}),select=await mount(Wrapper)
 await fire(select.find('[role="combobox"]'),'click');assert.equal(value.value,'a');assert(document.querySelector('[role="listbox"]'));assert.equal(select.find('[role="combobox"]').getAttribute('aria-label'),'Role label')
 await fire(document,'keydown',{key:'Escape'});await fire(select.find('label>span'),'click');assert(document.querySelector('[role="listbox"]'));assert.equal(value.value,'a')
})

test('Duplicate selected values display one tag and reselecting a single value does not emit change',async()=>{
 const select=await mount(ui.HysSelect,{modelValue:[1,1],options:[{value:1,label:'One'}]});assert.equal(select.all('.hys-ui-select-tag').length,1);select.unmount()
 const single=await mount(ui.HysSelect,{modelValue:1,options:[{value:1,label:'One'}]});await fire(single.find('[role="combobox"]'),'click');await fire(document.querySelector('[role="option"]'),'click');assert.equal(single.events.change,undefined);assert.equal(single.events.select.length,1)
})

test('Select renders error, warning and success states with required form semantics',async()=>{
 const select=await mount(ui.HysSelect,{status:'success',modelValue:1,options:[{label:'One',value:1}]});assert(select.find('.hys-ui-select-success'));assert.equal(select.find('[role="combobox"]').getAttribute('aria-invalid'),'false');select.props.status='error';await nextTick();assert(select.find('.hys-ui-select-error'));assert.equal(select.find('[role="combobox"]').getAttribute('aria-invalid'),'true');select.props.status='warning';await nextTick();assert(select.find('.hys-ui-select-warning'))
})

test('Appending virtual options preserves scroll position and never leaves dangling active IDs',async()=>{
 const options=Array.from({length:300},(_,value)=>({value,label:'Item '+value})),select=await mount(ui.HysSelect,{modelValue:0,options})
 await fire(select.find('[role="combobox"]'),'click');await pause(0);const list=document.querySelector('[role="listbox"]');list.scrollTop=840;await fire(list,'scroll');assert.equal(select.find('[role="combobox"]').getAttribute('aria-activedescendant'),null)
 select.props.options=[...options,...Array.from({length:50},(_,index)=>({value:300+index,label:'Item '+(300+index)}))];await nextTick();await nextTick();assert.equal(list.scrollTop,840);assert(document.querySelectorAll('[role="option"]').length<30)
 await fire(select.find('[role="combobox"]'),'keydown',{key:'End'});const active=select.find('[role="combobox"]').getAttribute('aria-activedescendant');assert.equal(document.getElementById(active).textContent,'Item 349')
})

test('Select custom footer buttons retain their own keyboard actions',async()=>{
 let actions=0;const select=await mount(ui.HysSelect,{defaultOpen:true,modelValue:0,options:[{label:'One',value:0},{label:'Two',value:1}]},{footer:()=>h('button',{onClick:()=>actions++},'Load more')});await pause(0)
 const footer=document.querySelector('.hys-ui-select-footer button'),event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});footer.dispatchEvent(event);await nextTick();assert.equal(event.defaultPrevented,false);assert.equal(select.events.change,undefined);await fire(footer,'click');assert.equal(actions,1);assert(document.querySelector('[role="listbox"]'))
})
test('Form supports required, async rules, reset and isolated field errors',async()=>{const model=reactive({name:''});const form=await mount(ui.HysForm,{model,rules:{name:[{required:true,message:'Name required'},{validator:async value=>value==='bad'?'Rejected':true}]}},{default:()=>h(ui.HysFormItem,{label:'Name',prop:'name'},()=>h(ui.HysInput,{modelValue:model.name}))});assert.equal(await form.vm.validate(),false);assert.equal(form.vm.errors.name,'Name required');form.props.model.name='bad';assert.equal(await form.vm.validate(),false);assert.equal(form.vm.errors.name,'Rejected');form.props.model.name='good';assert.equal(await form.vm.validate(),true);form.vm.resetFields();assert.equal(form.props.model.name,'');assert.deepEqual({...form.vm.errors},{})})
test('Form stale async results do not replace newer errors',async()=>{let finish;const form=await mount(ui.HysForm,{model:{name:'old'},rules:{name:{validator:value=>value==='old'?new Promise(resolve=>finish=resolve):'New error'}}});const old=form.vm.validateField('name');form.props.model.name='new';await form.vm.validateField('name');finish('Old error');await old;assert.equal(form.vm.errors.name,'New error')})

test('Form handles typed constraints, enum false, whitespace and non-mutating transforms',async()=>{
 const form=await mount(ui.HysForm,{model:{email:'bad',age:17,count:[1],role:false,name:'   ',trimmed:' ok '},rules:{email:{type:'email'},age:{type:'integer',min:18},count:{type:'array',len:2},role:{type:'enum',enum:[false,true]},name:{whitespace:true},trimmed:{transform:value=>String(value).trim(),len:2}}})
 assert.equal(await form.vm.validate(),false)
 assert.deepEqual(Object.keys(form.vm.errors).sort(),['age','count','email','name'])
 assert.equal(form.props.model.trimmed,' ok ')
 Object.assign(form.props.model,{email:'user@example.com',age:21,count:[1,2],name:'Name'});assert.equal(await form.vm.validate(),true)
})

test('Form built-in constraints run before a combined custom validator',async()=>{
 let calls=0
 const form=await mount(ui.HysForm,{model:{name:''},rules:{name:{required:true,message:'Required',validator:value=>{calls++;return value==='allowed'||'Not allowed'}}}})
 assert.equal(await form.vm.validate(),false);assert.equal(form.vm.errors.name,'Required');assert.equal(calls,0)
 form.props.model.name='other';assert.equal(await form.vm.validate(),false);assert.equal(form.vm.errors.name,'Not allowed')
 form.props.model.name='allowed';assert.equal(await form.vm.validate(),true)
})

test('Form supports nested descriptor rules and dot, array and bracket field paths',async()=>{
 const form=await mount(ui.HysForm,{model:{profile:{email:'invalid'},contacts:[{name:''}],roles:['one','bad']},rules:{'profile.email':{type:'email',message:'Email'},'contacts[0].name':{required:true,message:'Contact'},roles:{type:'array',defaultField:{type:'enum',enum:['one','two'],message:'Role'}}}})
 assert.equal(await form.vm.validateField(['profile','email']),false);assert.equal(form.vm.errors['profile.email'],'Email')
 assert.equal(await form.vm.validateField('contacts[0].name'),false);assert.equal(form.vm.errors['contacts.0.name'],'Contact')
 assert.equal(await form.vm.validateField('roles'),false);assert.equal(form.vm.errors.roles,'Role')
 form.props.rules={profile:{type:'object',fields:{email:{type:'email',message:'Nested email'}}}};await nextTick();assert.equal(await form.vm.validateField('profile'),false);assert.equal(form.vm.errors.profile,'Nested email')
})

test('Form warning rules inform without preventing submission',async()=>{
 const form=await mount(ui.HysForm,{model:{name:'short'},rules:{name:{min:8,level:'warning',message:'Consider a longer name'}}},{default:()=>h(ui.HysFormItem,{prop:'name',label:'Name',feedbackIcon:true},()=>h(ui.HysInput,{modelValue:'short'}))})
 await fire(form.find('form'),'submit');await pause(5)
 assert.equal(form.events.submit.length,1);assert.equal(form.vm.warnings.name,'Consider a longer name');assert.equal(form.vm.states.name.status,'warning');assert(!form.vm.errors.name)
 assert.equal(form.find('input').getAttribute('aria-invalid'),null);assert.equal(form.find('[role="status"]').textContent,'Consider a longer name')
})

test('Form trigger filtering preserves an existing blur-only error',async()=>{
 const form=await mount(ui.HysForm,{model:{name:''},rules:{name:{required:true,trigger:'blur',message:'Required on blur'}}})
 await form.vm.validateField('name','blur');assert.equal(form.vm.errors.name,'Required on blur')
 form.props.model.name='fixed';await form.vm.validateField('name','change');assert.equal(form.vm.errors.name,'Required on blur')
 await form.vm.validateField('name','blur');assert.equal(form.vm.errors.name,undefined)
})

test('Form pointer submission avoids blur layout shifts while keyboard blur and full validation still run',async()=>{
 let calls=0;
 const form=await mount(ui.HysForm,{model:{name:''},rules:{name:{trigger:'blur',validator:()=>{calls++;return 'Required'}}},scrollToError:false,focusOnError:false},{default:()=>[h(ui.HysFormItem,{prop:'name',label:'Name'},()=>h(ui.HysInput,{modelValue:''})),h(ui.HysButton,{nativeType:'submit'},()=>h('span','Save'))]});
 const field=form.find('input'),button=form.find('button[type="submit"]');
 field.focus();button.querySelector('span').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:0}));button.focus();await nextTick();await pause(5);
 assert.equal(calls,0);assert.equal(form.vm.errors.name,undefined);
 await fire(form.find('form'),'submit');await pause(5);assert.equal(calls,1);assert.equal(form.events.invalid.length,1);assert.equal(form.vm.errors.name,'Required');
 form.vm.clearValidate();field.focus();button.focus();await pause(5);assert.equal(calls,2);assert.equal(form.vm.errors.name,'Required');
 form.vm.clearValidate();field.focus();button.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:2}));button.focus();await pause(5);assert.equal(calls,3);
})

test('FormItem merges local rules, supports dependent fields and exposes field methods',async()=>{
 const model=reactive({password:'secret',confirm:'secret'}),form=await mount(ui.HysForm,{model,rules:{confirm:{min:4}}},{default:()=>[h(ui.HysFormItem,{prop:'password',label:'Password'},()=>h(ui.HysInput,{modelValue:model.password})),h(ui.HysFormItem,{prop:'confirm',label:'Confirm',dependencies:['password'],rules:{validator:(value,values)=>value===values.password||'Does not match'}},()=>h(ui.HysInput,{modelValue:model.confirm}))]})
 assert.equal(await form.vm.validate(),true);assert.equal(form.vm.getFields().length,2)
 model.password='changed';await nextTick();await pause(5);assert.equal(form.vm.errors.confirm,'Does not match')
 const field=form.vm.getField('confirm');assert.equal(field.path.value,'confirm');field.focus();assert.equal(document.activeElement,form.all('input')[1])
 field.clearValidate();assert.equal(form.vm.errors.confirm,undefined)
})

test('Form partial validation and reset preserve unrelated errors, null values and captured baselines',async()=>{
 const model=reactive({user:{name:'Initial',email:''},optional:null}),form=await mount(ui.HysForm,{model,rules:{'user.name':{required:true},'user.email':{required:true,message:'Email required'}}},{default:()=>[h(ui.HysFormItem,{prop:['user','name'],label:'Name'},()=>h(ui.HysInput,{modelValue:model.user.name})),h(ui.HysFormItem,{prop:'optional'},()=>h(ui.HysInput,{modelValue:String(model.optional??'')}))]})
 assert.equal(await form.vm.validate(),false);assert.equal(await form.vm.validateFields(['user.name']),true);assert.equal(form.vm.errors['user.email'],'Email required')
 model.user.name='Changed';model.optional='changed';form.vm.resetFields(['optional']);assert.equal(model.optional,null);assert.equal(model.user.name,'Changed')
 form.vm.captureInitialValues(['user.name']);model.user.name='Later';form.vm.resetFields(['user.name']);assert.equal(model.user.name,'Changed');assert.equal(form.vm.errors['user.email'],'Email required')
 form.vm.clearValidate(['user']);assert.deepEqual({...form.vm.errors},{})
})

test('Form removed dynamic fields cancel pending checks and leave the remaining form usable',async()=>{
 const visible=ref(true);let finish
 const form=await mount(ui.HysForm,{model:{extra:''},rules:{extra:{validator:()=>new Promise(resolve=>finish=resolve)}}},{default:()=>visible.value?h(ui.HysFormItem,{prop:'extra',label:'Extra'},()=>h(ui.HysInput,{modelValue:''})):null})
 const pending=form.vm.validateField('extra');visible.value=false;await nextTick();finish('Old error');assert.equal(await pending,false)
 assert.equal(form.vm.errors.extra,undefined);assert.equal(form.vm.getFields().length,0);assert.equal(await form.vm.validate(),true)
})

test('Form concurrent validation keeps the latest run and pending state',async()=>{
 const pending=[],form=await mount(ui.HysForm,{model:{name:'first'},rules:{name:{validator:()=>new Promise(resolve=>pending.push(resolve))}}})
 const first=form.vm.validate();const second=form.vm.validate();assert.equal(form.vm.validating,true)
 pending[0]('Old error');assert.equal(await first,false);assert.equal(form.vm.validating,true)
 pending[1](true);assert.equal(await second,true);assert.equal(form.vm.validating,false);assert.equal(form.events.validation.length,1);assert.deepEqual({...form.vm.errors},{})
})

test('Form submit does not emit success or failure for edited, reset or disabled pending data',async()=>{
 for(const action of ['edit','reset','disable']){
  let finish
  const form=await mount(ui.HysForm,{model:{name:'initial'},rules:{name:{validator:()=>new Promise(resolve=>finish=resolve)}}})
  await fire(form.find('form'),'submit')
  if(action==='edit')form.props.model.name='new';else if(action==='reset')form.vm.resetFields();else form.props.disabled=true
  await nextTick();finish(true);await pause(5);assert(!form.events.submit,action);assert(!form.events.invalid,action);assert.equal(form.vm.validating,false);form.unmount()
 }
})

test('Form cached-page deactivation suppresses obsolete submission and permits a fresh request',async()=>{
 const visible=ref(true),pending=[],submitted=[],host=document.createElement('div');document.body.append(host)
 const Cached=defineComponent({setup(){return()=>h(ui.HysForm,{model:{name:'value'},rules:{name:{validator:()=>new Promise(resolve=>pending.push(resolve))}},onSubmit:value=>submitted.push(value)},()=>h(ui.HysFormItem,{prop:'name'},()=>h(ui.HysInput,{modelValue:'value'})))}})
 const app=createApp({setup(){ui.provideHysConfig({motion:'off'});return()=>h(KeepAlive,null,{default:()=>visible.value?h(Cached):h('p','Away')})}})
 try{app.mount(host);await nextTick();await fire(host.querySelector('form'),'submit');visible.value=false;await nextTick();pending[0](true);await pause(5);assert.equal(submitted.length,0);visible.value=true;await nextTick();await fire(host.querySelector('form'),'submit');pending.at(-1)(true);await pause(5);assert.equal(submitted.length,1)}finally{app.unmount();host.remove()}
})

test('Disabled form state blocks native and custom handlers, including an already-open select',async()=>{
 const changed=[],form=await mount(ui.HysForm,{disabled:false,model:{name:'fixed'}},{default:()=>[h(ui.HysInput,{modelValue:'fixed','onUpdate:modelValue':value=>changed.push(value)}),h(ui.HysNumberInput,{modelValue:1,'onUpdate:modelValue':value=>changed.push(value)}),h(ui.HysSwitch,{modelValue:false,'onUpdate:modelValue':value=>changed.push(value)}),h(ui.HysCheckbox,{modelValue:false,'onUpdate:modelValue':value=>changed.push(value)}),h(ui.HysSelect,{modelValue:'a',options:[{label:'A',value:'a'},{label:'B',value:'b'}],'onUpdate:modelValue':value=>changed.push(value)})]})
 await fire(form.find('[role="combobox"]'),'click');await pause(10);const option=document.querySelectorAll('[role="option"]')[1];assert(option)
 form.props.disabled=true;await nextTick();assert(!document.querySelector('[role="listbox"]'));assert(form.all('input,button').every(element=>element.disabled))
 await fire(option,'click');form.find('input[type="text"]').value='changed';await fire(form.find('input[type="text"]'),'input');await fire(form.find('[aria-label="增加"]'),'click');await fire(form.find('[role="switch"]'),'click');await fire(form.find('input[type="checkbox"]'),'change');assert.deepEqual(changed,[])
 form.props.disabled=false;await nextTick();await fire(form.find('[aria-label="增加"]'),'click');assert.deepEqual(changed,[2])
})

test('Disabling a form during a tree drag clears the target and prevents a stale drop',async()=>{
 const drops=[],form=await mount(ui.HysForm,{disabled:false},{default:()=>h(ui.HysTree,{nodes:[{id:'a',label:'A'},{id:'b',label:'B'}],draggable:true,'onNode-drop':value=>drops.push(value)})})
 const drag=async(element,type)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(event,{clientY:{value:40},dataTransfer:{value:{setData(){},effectAllowed:'move'}}});element.dispatchEvent(event);await nextTick()}
 const rows=form.all('[role="treeitem"]');await drag(rows[0],'dragstart');await drag(rows[1],'dragover');assert(rows[1].hasAttribute('data-drop-position'))
 form.props.disabled=true;await nextTick();assert(!rows[1].hasAttribute('data-drop-position'));await drag(rows[1],'drop');assert.deepEqual(drops,[])
})

test('Form size and disabled state inherit with field and explicit control overrides',async()=>{
 const form=await mount(ui.HysForm,{size:'sm'},{default:()=>[h(ui.HysFormItem,{label:'Small'},()=>h(ui.HysInput,{modelValue:''})),h(ui.HysFormItem,{label:'Large',size:'lg',disabled:true},()=>h(ui.HysInput,{modelValue:'',disabled:false})),h(ui.HysFormItem,{label:'Explicit',size:'lg'},()=>h(ui.HysInput,{modelValue:'',size:'md'})),h(ui.HysButton,null,()=> 'Action')]})
 assert(form.all('.hys-ui-input-wrap')[0].classList.contains('hys-ui-input-sm'));assert(form.all('.hys-ui-input-wrap')[1].classList.contains('hys-ui-input-lg'));assert(form.all('input')[1].disabled);assert(form.all('.hys-ui-input-wrap')[2].classList.contains('hys-ui-input-md'));assert(form.find('button').classList.contains('hys-ui-btn-sm'))
})

test('Select floating options keep the effective size when the open form changes size',async()=>{
 const form=await mount(ui.HysForm,{size:'sm'},{default:()=>h(ui.HysSelect,{modelValue:'a',filterable:true,options:[{label:'A',value:'a'}]})})
 await fire(form.find('[role="combobox"]'),'click');await pause(10)
 const panel=document.querySelector('.hys-ui-select-options');assert(panel.classList.contains('hys-ui-select-popup-sm'));assert.equal(panel.dataset.size,'sm');assert.equal(panel.querySelector('[role="option"] svg').getAttribute('width'),'13')
 form.props.size='lg';await nextTick();await nextTick();assert.equal(document.querySelector('.hys-ui-select-options'),panel);assert(panel.classList.contains('hys-ui-select-popup-lg'));assert.equal(panel.dataset.size,'lg');assert.equal(panel.querySelector('[role="option"] svg').getAttribute('width'),'17')
})

test('Composite form controls use the field label before their generic accessible label',async()=>{
 const form=await mount(ui.HysForm,{}, {default:()=>[h(ui.HysFormItem,{label:'Age'},()=>h(ui.HysNumberInput,{modelValue:18})),h(ui.HysFormItem,{label:'Access'},()=>h(ui.HysRadioGroup,{modelValue:'a',options:[{label:'A',value:'a'}]})),h(ui.HysFormItem,{label:'Choice'},()=>h(ui.HysSelect,{modelValue:'a',options:[{label:'A',value:'a'}]}))]})
 assert.equal(form.find('input[type="number"]').getAttribute('aria-label'),'Age');assert.equal(form.find('[role="radiogroup"]').getAttribute('aria-label'),'Access');assert.equal(form.find('[role="combobox"]').getAttribute('aria-label'),'Choice')
})

test('FormItem feedback slots retain valid ARIA references and custom labels',async()=>{
 const form=await mount(ui.HysForm,{model:{name:''},rules:{name:{required:true,message:'Required'}}},{default:()=>h(ui.HysFormItem,{prop:'name',label:'Name',hint:'Hint',showRequiredMark:false},{label:()=>h('strong','Custom label'),default:()=>h(ui.HysInput,{modelValue:''}),feedback:({error})=>h('em',error)})})
 await form.vm.validate();await nextTick();const input=form.find('input'),ids=input.getAttribute('aria-describedby').split(' ');assert.equal(ids.length,2);for(const id of ids)assert.equal(document.querySelectorAll('[id="'+id+'"]').length,1)
 assert.equal(document.getElementById(ids[0]).textContent,'Required');assert.equal(form.find('label strong').textContent,'Custom label');assert.equal(form.find('label').htmlFor,input.id);assert(!form.find('.hys-ui-form-required'))
})

test('Form scroll and rule-change methods target registered fields without global selectors',async()=>{
 const form=await mount(ui.HysForm,{model:{name:''},rules:{name:{required:true,message:'Old'}}},{default:()=>h(ui.HysFormItem,{prop:'name',label:'Name'},()=>h(ui.HysInput,{modelValue:''}))})
 let options;form.find('[data-field-path="name"]').scrollIntoView=value=>options=value
 form.vm.scrollToField('name',{block:'center'});assert.equal(options.block,'center')
 await form.vm.validate();form.props.rules={name:{validator:()=>true}};await nextTick();await pause(5);assert.equal(form.vm.errors.name,undefined)
})

test('Form clears pending validation immediately and aborts the custom validator signal',{timeout:1500},async()=>{
 let signal
 const form=await mount(ui.HysForm,{model:{name:'value'},rules:{name:{validator:(_value,_model,context)=>{signal=context.signal;return new Promise(()=>{})}}}})
 const pending=form.vm.validateField('name');assert.equal(signal.aborted,false);form.vm.clearValidate(['name'])
 assert.equal(await pending,false);assert.equal(signal.aborted,true);assert.equal(form.vm.states.name.validating,false)
})

test('Form cancels legacy whole-form async validation during reset',{timeout:1500},async()=>{
 let signal
 const form=await mount(ui.HysForm,{model:{name:'value'},validate:context=>{signal=context.signal;return new Promise(()=>{})}})
 const pending=form.vm.validate();await nextTick();assert(signal);form.vm.resetFields()
 assert.equal(await pending,false);assert.equal(signal.aborted,true);assert.equal(form.vm.validating,false)
})

test('Equivalent rule objects from rerendering do not cancel an active check',async()=>{
 let finish,signal
 const validator=(_value,_model,context)=>{signal=context.signal;return new Promise(resolve=>finish=resolve)}
 const form=await mount(ui.HysForm,{model:{name:'value'},rules:{name:{validator}}})
 const pending=form.vm.validate();form.props.rules={name:{validator}};await nextTick();assert.equal(signal.aborted,false);finish(true);assert.equal(await pending,true)
})

test('Disabling rule-change validation applies to local field rules and preserves existing feedback',async()=>{
 const rules=reactive({required:true,message:'Required'})
 const form=await mount(ui.HysForm,{model:{name:''},validateOnRuleChange:false},{default:()=>h(ui.HysFormItem,{label:'Name',prop:'name',rules},()=>h(ui.HysInput,{modelValue:''}))})
 await form.vm.validate();rules.required=false;await nextTick();await pause(5);assert.equal(form.vm.errors.name,'Required')
 assert.equal(await form.vm.validate(),true);assert.equal(form.vm.errors.name,undefined)
})

test('Form field reads are snapshots; partial writes merge objects and preserve null',async()=>{
 const model=reactive({profile:{name:'Before',email:'keep@example.com'},roles:['a'],date:new Date('2026-11-01')})
 const form=await mount(ui.HysForm,{model})
 const snapshot=form.vm.getFieldsValue();snapshot.profile.name='outside';snapshot.date.setUTCDate(2);assert.equal(model.profile.name,'Before');assert.equal(model.date.getUTCDate(),1)
 const profile=model.profile;form.vm.setFieldsValue({profile:{name:'After'},roles:['b']});await nextTick();assert.equal(model.profile,profile);assert.equal(model.profile.email,'keep@example.com');assert.deepEqual([...model.roles],['b'])
 form.vm.setFieldValue(['profile','name'],null);assert.equal(model.profile.name,null);assert.deepEqual(form.vm.getFieldsValue([['profile','name']]),{profile:{name:null}})
 form.vm.setFieldsValue(JSON.parse('{"__proto__":{"polluted":true},"constructor":{"polluted":true}}'));assert.equal({}.polluted,undefined)
})

test('Form service feedback supports multiple errors and is cleared without changing values',async()=>{
 const form=await mount(ui.HysForm,{model:{name:'Kept'}},{default:()=>h(ui.HysFormItem,{prop:'name',label:'Name'},()=>h(ui.HysInput,{modelValue:'Kept'}))})
 form.vm.setFields([{name:'name',errors:['Already exists','Choose another'],warnings:['Suggestion']}]);await nextTick()
 assert.equal(form.find('input').getAttribute('aria-invalid'),'true');assert(form.find('[role="alert"]').textContent.includes('Choose another'));const messages=form.vm.getFieldError('name');messages.push('outside');assert.equal(form.vm.getFieldError('name').length,2)
 form.vm.clearValidate(['name']);await nextTick();assert.deepEqual(form.vm.getFieldError('name'),[]);assert.equal(form.props.model.name,'Kept');assert(!form.find('[role="alert"]'))
})

test('Form explicit initial values and per-field baselines do not change the current record',async()=>{
 const item=ref(),form=await mount(ui.HysForm,{model:{name:'Current',email:'Original'}},{default:()=>[h(ui.HysFormItem,{ref:item,prop:'name',label:'Name'},()=>h(ui.HysInput,{modelValue:'Current'})),h(ui.HysFormItem,{prop:'email',label:'Email'},()=>h(ui.HysInput,{modelValue:'Original'}))]})
 form.vm.setInitialValues({name:'Reset',email:'Saved'});assert.equal(form.props.model.name,'Current');form.vm.resetFields(['name']);assert.equal(form.props.model.name,'Reset');assert.equal(form.props.model.email,'Original')
 await nextTick();item.value.setInitialValue('Field baseline');form.vm.setFieldValue('name','Edited');form.vm.resetFields(['name']);assert.equal(form.props.model.name,'Field baseline')
})

test('Form supports Promise and callback validation and imperative submission',async()=>{
 const form=await mount(ui.HysForm,{model:{name:''},rules:{name:{required:true,message:'Required'}}})
 let details;assert.equal(await form.vm.validate((valid,result)=>{assert.equal(valid,false);details=result}),false);assert.equal(details.errors.name,'Required')
 form.vm.setFieldValue('name','Ready');await nextTick();assert.equal(await form.vm.validateField('name',(valid,result)=>{assert.equal(valid,true);assert.equal(result.values.name,'Ready')}),true)
 const result=await form.vm.submit();assert.equal(result.valid,true);assert.equal(form.events.submit[0][0].name,'Ready')
})

test('Programmatic form writes cancel an in-flight submission without emitting stale results',async()=>{
 let finish;const form=await mount(ui.HysForm,{model:{name:'Old'},rules:{name:{validator:()=>new Promise(resolve=>finish=resolve)}}})
 let called=false;const pending=form.vm.validate(()=>{called=true});form.vm.setFieldValue('name','New');assert.equal(await pending,false);finish(true);await pause(0);assert.equal(called,false);assert(!form.events.validation)
})

test('Form can collect all rule errors and apply per-field first-error overrides',async()=>{
 let called=0;const form=await mount(ui.HysForm,{model:{name:'x',short:'x'},validateFirst:false,rules:{name:[{min:3,message:'Too short'},{pattern:/^[A-Z]+$/,message:'Use capitals'},{validator:()=>{called++;return 'Unavailable'}}],short:[{min:3,message:'Only first'},{validator:()=>{throw Error('Never run')}}]}},{default:()=>h(ui.HysFormItem,{prop:'short',label:'Short',validateFirst:true},()=>h(ui.HysInput,{modelValue:'x'}))})
 const result=await form.vm.validateResult();assert.equal(result.valid,false);assert.equal(called,1);assert.deepEqual(result.errorMessages.name,['Too short','Use capitals','Unavailable']);assert.deepEqual(form.vm.getFieldError('short'),['Only first'])
})

test('Callback validators support success, failure, rejection and cancellation',async()=>{
 let signal,callback;const form=await mount(ui.HysForm,{model:{name:'a'},rules:{name:{asyncValidator:(_value,done,_model,context)=>{callback=done;signal=context.signal}}}})
 let pending=form.vm.validate();callback('From server');assert.equal(await pending,false);assert.equal(form.vm.errors.name,'From server')
 pending=form.vm.validate();callback();assert.equal(await pending,true)
 pending=form.vm.validate();form.vm.clearValidate();assert.equal(await pending,false);assert.equal(signal.aborted,true);callback('Too late');await pause(0);assert.equal(form.vm.errors.name,undefined)
 form.props.rules={name:{asyncValidator:async()=>{throw Error('Rejected')}}};await nextTick();assert.equal(await form.vm.validate(),false);assert.equal(form.vm.errors.name,'Rejected')
})

test('Nested descriptor rules reach mounted leaf fields and their required semantics',async()=>{
 const model=reactive({profile:{email:''},contacts:[{name:''}]})
 const form=await mount(ui.HysForm,{model,rules:{profile:{type:'object',fields:{email:{required:true,type:'email',message:'Email required'}}},contacts:{type:'array',defaultField:{type:'object',fields:{name:{required:true,message:'Name required'}}}}}},{default:()=>[h(ui.HysFormItem,{prop:['profile','email'],label:'Email'},()=>h(ui.HysInput,{modelValue:model.profile.email})),h(ui.HysFormItem,{prop:['contacts',0,'name'],label:'Contact'},()=>h(ui.HysInput,{modelValue:model.contacts[0].name}))]})
 assert.equal(form.all('.hys-ui-form-required').length,2);assert.equal(await form.vm.validateField(['profile','email']),false);assert.equal(form.vm.errors['profile.email'],'Email required');assert.equal(await form.vm.validateField(['contacts',0,'name']),false)
 model.profile.email='person@example.com';model.contacts[0].name='Name';await nextTick();assert.equal(await form.vm.validate(),true)
})

test('Default-member rules infer each heterogeneous member separately',async()=>{
 const form=await mount(ui.HysForm,{model:{values:['text',42,true]},rules:{values:{type:'array',defaultField:{required:true}}}})
 assert.equal(await form.vm.validate(),true);form.props.model.values[1]=null;assert.equal(await form.vm.validate(),false)
})

test('Nested transforms infer from the transformed values and never mutate the host record',async()=>{
 let calls=0;const form=await mount(ui.HysForm,{model:{data:'{"age":24}',members:['1',2]},rules:{data:{type:'object',transform:value=>{calls++;return JSON.parse(value)},fields:{age:{min:18}}},members:{type:'array',defaultField:{transform:value=>Number(value),min:1}}}})
 assert.equal(await form.vm.validate(),true);assert.equal(calls,1);assert.equal(form.props.model.data,'{"age":24}');assert.deepEqual([...form.props.model.members],['1',2])
 form.props.model.data='{"age":15}';assert.equal(await form.vm.validate(),false)
})

test('Form conditional fields preserve data by default and can opt out individually',async()=>{
 const shown=ref(true),form=await mount(ui.HysForm,{model:{keep:'Kept',remove:'Removed'}},{default:()=>shown.value?[h(ui.HysFormItem,{prop:'keep'},()=>h(ui.HysInput,{modelValue:'Kept'})),h(ui.HysFormItem,{prop:'remove',preserve:false},()=>h(ui.HysInput,{modelValue:'Removed'}))]:[]})
 shown.value=false;await nextTick();assert.equal(form.props.model.keep,'Kept');assert.equal(Object.hasOwn(form.props.model,'remove'),false);assert.equal(form.vm.getFields().length,0)
})

test('Explicit error status reaches managed controls without requiring an error message',async()=>{
 const form=await mount(ui.HysForm,{feedbackIcon:true},{default:()=>[h(ui.HysFormItem,{label:'Input',status:'error'},()=>h(ui.HysInput)),h(ui.HysFormItem,{label:'Text',status:'error'},()=>h(ui.HysTextarea))]})
 assert.equal(form.find('input').getAttribute('aria-invalid'),'true');assert.equal(form.find('textarea').getAttribute('aria-invalid'),'true');assert(form.find('.hys-ui-input-shell-error'));assert.equal(form.all('.hys-ui-form-feedback-icon').length,2)
})

test('Help, extra, optional marks and feedback overrides preserve accessible references',async()=>{
 const form=await mount(ui.HysForm,{optionalMark:'Optional',inlineFeedback:true,feedbackIcon:true},{default:()=>[h(ui.HysFormItem,{label:'Name',status:'error',help:'Use a unique name',extra:'Public name',hint:'Hint'},()=>h(ui.HysInput)),h(ui.HysFormItem,{label:'Hidden feedback',help:'Hidden',showFeedback:false,feedbackIcon:false},()=>h(ui.HysInput))]})
 const input=form.find('input');for(const id of input.getAttribute('aria-describedby').split(' '))assert(document.getElementById(id));assert.equal(form.find('[role="alert"]').textContent,'Use a unique name');assert(form.find('.hys-ui-form-item-extra').textContent.includes('Public name'));assert.equal(form.all('.hys-ui-form-optional').length,2);assert.equal(form.all('.hys-ui-form-feedback-icon').length,1)
})

test('Multiple controls have a named group rather than duplicate generated control IDs',async()=>{
 const form=await mount(ui.HysForm,{}, {default:()=>h(ui.HysFormItem,{label:'Full name'},()=>[h(ui.HysInput,{ariaLabel:'First'}),h(ui.HysInput,{ariaLabel:'Last'})])})
 await nextTick();const group=form.find('[role="group"]');assert(group);assert.equal(document.getElementById(group.getAttribute('aria-labelledby')).textContent,'Full name');assert.equal(form.all('input[id]').length,0);assert.equal(form.all('label[for]').length,0)
})

test('Custom controls can read field context and trigger checks without native event plumbing',async()=>{
 const Custom=defineComponent({setup(){const field=ui.useHysFormItemContext();return()=>h('button',{'data-hys-ui-field-managed':'',id:field.id.value,disabled:field.disabled.value,'aria-invalid':field.invalid.value,'aria-describedby':field.describedBy.value,onClick:()=>field.validate('change')},field.label.value)}})
 const form=await mount(ui.HysForm,{model:{choice:''},rules:{choice:{required:true,message:'Choose'}},size:'sm'},{default:()=>h(ui.HysFormItem,{label:'Choice',prop:'choice'},()=>h(Custom))})
 await fire(form.find('button'),'click');assert.equal(form.vm.errors.choice,'Choose');assert.equal(form.find('button').getAttribute('aria-invalid'),'true');form.props.disabled=true;await nextTick();assert(form.find('button').disabled)
})

test('Cached forms disconnect layout observers and reconnect without growing registrations',async()=>{
 const previous=globalThis.ResizeObserver,observers=[]
 globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;this.active=false;observers.push(this)}observe(){this.active=true}disconnect(){this.active=false}}
 try{
  const shown=ref(true),position=ref('right'),FormPage=defineComponent({setup(){return()=>h(ui.HysForm,{model:{name:''},labelPosition:position.value,labelWidth:'auto'},()=>h(ui.HysFormItem,{label:'Name',prop:'name'},()=>h(ui.HysInput)))}})
  const Wrapper=defineComponent({setup(){return()=>h(KeepAlive,{},()=>shown.value?h(FormPage):null)}}),wrapper=await mount(Wrapper)
  await nextTick();assert(observers.some(observer=>observer.active))
  for(let index=0;index<3;index++){position.value='left';shown.value=false;await nextTick();await nextTick();assert.equal(observers.filter(observer=>observer.active).length,0);shown.value=true;await nextTick();await nextTick();assert.equal(observers.filter(observer=>observer.active).length,2)}
  wrapper.unmount();await nextTick();assert.equal(observers.filter(observer=>observer.active).length,0)
 }finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver}
})

test('Editing one field in a large form only validates that field',async()=>{
 const model=reactive(Object.fromEntries(Array.from({length:120},(_,index)=>['f'+index,'Initial']))),counts={}
 const rules=Object.fromEntries(Object.keys(model).map(name=>[name,{validator:()=>{counts[name]=(counts[name]??0)+1;return true}}]))
 const form=await mount(ui.HysForm,{model,rules},{default:()=>Object.keys(model).map(name=>h(ui.HysFormItem,{prop:name,label:name},()=>h(ui.HysInput,{modelValue:model[name]})))})
 model.f42='Changed';await nextTick();await pause(0);assert.deepEqual(counts,{f42:1});assert.equal(form.vm.getFields().length,120)
})

test('Hidden labels do not reserve implicit grid columns and field state remains inspectable',async()=>{
 const field=ref(),form=await mount(ui.HysForm,{layout:'horizontal',showLabel:false,labelCol:{span:6},wrapperCol:{span:18},size:'sm'},{default:()=>h(ui.HysFormItem,{ref:field,label:'Name',status:'error',error:'Required'},()=>h(ui.HysInput))})
 assert.equal(form.find('.hys-ui-form-item-body').style.gridColumn,'');assert.equal(field.value.size,'sm');assert.equal(field.value.validateMessage,'Required');assert.equal(field.value.validateState,'error')
})
test('Tabs keyboard skips disabled items',async()=>{const tabs=await mount(ui.HysTabs,{modelValue:'a',items:[{value:'a',label:'A'},{value:'b',label:'B',disabled:true},{value:'c',label:'C'}]});await fire(tabs.find('[role="tablist"]'),'keydown',{key:'ArrowRight'});assert.equal(tabs.props.modelValue,'c');assert.equal(tabs.all('[role="tab"]')[2].getAttribute('tabindex'),'0')})

test('Tabs support uncontrolled numeric values and manual keyboard activation',async()=>{
 const tabs=await mount(ui.HysTabs,{defaultValue:0,activation:'manual',items:[{value:0,label:'Zero'},{value:1,label:'Blocked',disabled:true},{value:2,label:'Two'}]})
 const buttons=tabs.all('[role="tab"]');assert.equal(buttons[0].getAttribute('aria-selected'),'true')
 buttons[0].focus();await fire(buttons[0],'keydown',{key:'ArrowRight'})
 assert.equal(document.activeElement,buttons[2]);assert(!tabs.events.change)
 await fire(buttons[2],'keydown',{key:'Enter'});assert.equal(tabs.events.change.at(-1)[0],2)
 await fire(buttons[2],'keydown',{key:'Home'});assert.equal(document.activeElement,buttons[0]);assert.equal(tabs.events.change.length,1)
 await fire(buttons[0],'keydown',{key:' '});assert.equal(tabs.events.change.at(-1)[0],0)
})

test('Tabs latest guard wins; rejected, externally superseded and disabled requests cannot switch',async()=>{
 const pending=new Map(),tabs=await mount(ui.HysTabs,{modelValue:'a',items:[{value:'a',label:'A'},{value:'b',label:'B'},{value:'c',label:'C'}],beforeLeave:value=>new Promise(resolve=>pending.set(value,resolve))})
 await fire(tabs.all('[role="tab"]')[1],'click');await fire(tabs.all('[role="tab"]')[2],'click')
 pending.get('b')(true);await pause(0);assert.equal(tabs.props.modelValue,'a')
 pending.get('c')(true);await pause(0);assert.equal(tabs.props.modelValue,'c');assert.equal(tabs.events.change.length,1)
 tabs.props.beforeLeave=async()=>false;await nextTick();await fire(tabs.all('[role="tab"]')[1],'click');await pause(0);assert.equal(tabs.props.modelValue,'c')
 tabs.props.beforeLeave=async()=>{throw Error('guard failed')};await nextTick();await fire(tabs.all('[role="tab"]')[1],'click');await pause(0);assert.equal(tabs.events.guardError.length,1)
 tabs.props.beforeLeave=value=>new Promise(resolve=>pending.set(value,resolve));await nextTick();await fire(tabs.all('[role="tab"]')[1],'click');tabs.props.modelValue='a';await nextTick();pending.get('b')(true);await pause(0);assert.equal(tabs.props.modelValue,'a')
 await fire(tabs.all('[role="tab"]')[1],'click');tabs.props.disabled=true;await nextTick();pending.get('b')(true);await pause(0);assert.equal(tabs.props.modelValue,'a');assert.equal(tabs.find('[role="tablist"]').getAttribute('aria-busy'),null)
})

test('Tabs panel lazy mounting, preservation, destruction and ARIA remain consistent',async()=>{
 const Editor=defineComponent({setup(){const text=ref('');return()=>h('input',{value:text.value,onInput:event=>text.value=event.target.value})}})
 const tabs=await mount(ui.HysTabs,{modelValue:'a',items:[{value:'a',label:'A'},{value:'b',label:'B'},{value:'c',label:'C',forceRender:true}]},{panel:()=>h(Editor)})
 assert.equal(tabs.all('[role="tabpanel"]').length,2)
 const field=tabs.find('input');field.value='retained draft';await fire(field,'input')
 await fire(tabs.all('[role="tab"]')[1],'click');assert.equal(tabs.all('[role="tabpanel"]').length,3);assert.equal(field.closest('[role="tabpanel"]').style.display,'none')
 await fire(tabs.all('[role="tab"]')[0],'click');assert.equal(tabs.find('input'),field);assert.equal(field.value,'retained draft')
 const active=tabs.find('[role="tab"][aria-selected="true"]'),panel=document.getElementById(active.getAttribute('aria-controls'));assert.equal(panel.getAttribute('aria-labelledby'),active.id)
 tabs.props.destroyOnHide=true;await nextTick();await fire(tabs.all('[role="tab"]')[1],'click');assert(!field.isConnected)
 await fire(tabs.all('[role="tab"]')[0],'click');assert.equal(tabs.find('input').value,'')
})

test('Tabs add and guarded close honor explicit nonclosable and disabled items',async()=>{
 const tabs=await mount(ui.HysTabs,{modelValue:'a',editable:true,items:[{value:'a',label:'A',closable:false},{value:'b',label:'B'},{value:'c',label:'C',disabled:true}],beforeClose:async()=>false})
 assert(!tabs.find('[aria-label="关闭A"]'));await fire(tabs.find('[aria-label="添加页签"]'),'click');assert.equal(tabs.events.add.length,1)
 await fire(tabs.find('[aria-label="关闭B"]'),'click');await pause(0);assert(!tabs.events.close)
 tabs.props.beforeClose=async()=>true;await nextTick();await fire(tabs.find('[aria-label="关闭B"]'),'click');await pause(0);assert.equal(tabs.events.close[0][0],'b');assert.equal(tabs.events.edit.at(-1)[1],'remove');assert.equal(tabs.props.items.length,3)
 await fire(tabs.find('[aria-label="关闭C"]'),'click');assert.equal(tabs.events.close.length,1)
})

test('Tabs cancel guard callbacks on KeepAlive deactivation',async()=>{
 const visible=ref(true),pending=[],changes=[],host=document.createElement('div');document.body.append(host)
 const Cached=defineComponent({setup(){return()=>h(ui.HysTabs,{modelValue:'a',items:[{value:'a',label:'A'},{value:'b',label:'B'}],beforeLeave:()=>new Promise(resolve=>pending.push(resolve)),onChange:value=>changes.push(value)})}})
 const app=createApp({setup(){ui.provideHysConfig({motion:'off'});return()=>h(KeepAlive,null,{default:()=>visible.value?h(Cached):h('div','Away')})}})
 try{app.mount(host);await nextTick();await fire(host.querySelectorAll('[role="tab"]')[1],'click');visible.value=false;await nextTick();pending[0](true);await pause(0);assert.deepEqual(changes,[]);visible.value=true;await nextTick();await fire(host.querySelectorAll('[role="tab"]')[1],'click');pending[1](true);await pause(0);assert.deepEqual(changes,['b'])}finally{app.unmount();host.remove()}
})

test('Tabs loaded asynchronously select a usable initial item and preserve unrelated panel keystrokes',async()=>{
 const tabs=await mount(ui.HysTabs,{items:[]},{panel:()=>h('input')})
 tabs.props.items=[{value:0,label:'Blocked',disabled:true},{value:1,label:'One'},{value:2,label:'Two'}];await nextTick()
 assert.equal(tabs.find('[aria-selected="true"]').textContent,'One')
 await fire(tabs.find('input'),'keydown',{key:'ArrowRight'});assert(!tabs.events.change)
 tabs.props.items=[{value:2,label:'Two'}];await nextTick();assert.equal(tabs.find('[aria-selected="true"]').textContent,'Two')
})

test('Tabs stale close guards cannot close replaced items or clear newer pending actions',async()=>{
 const pending=[],tabs=await mount(ui.HysTabs,{modelValue:'a',closable:true,items:[{value:'a',label:'A'},{value:'b',label:'B'}],beforeClose:()=>new Promise(resolve=>pending.push(resolve))})
 await fire(tabs.find('[aria-label="关闭B"]'),'click')
 tabs.props.items=[{value:'a',label:'A'}];await nextTick();tabs.props.items.push({value:'b',label:'New B'});await nextTick()
 await fire(tabs.find('[aria-label="关闭New B"]'),'click');pending[0](true);await pause(0)
 assert(!tabs.events.close);assert(tabs.find('[aria-label="关闭New B"]').disabled)
 pending[1](true);await pause(0);assert.equal(tabs.events.close[0][0],'b')
})

test('Accordion guard errors and disabled transitions cannot expand panels',async()=>{
 let finish
 const accordion=await mount(ui.HysAccordion,{items:[{id:'a',title:'A'}],beforeToggle:async()=>{throw Error('blocked')}})
 await fire(accordion.find('.hys-ui-accordion-trigger'),'click');await pause(0);assert.equal(accordion.events.guardError.length,1);assert(!accordion.events.change)
 accordion.props.beforeToggle=()=>new Promise(resolve=>finish=resolve);await nextTick();await fire(accordion.find('.hys-ui-accordion-trigger'),'click');accordion.props.disabled=true;await nextTick();finish(true);await pause(0);assert(!accordion.events.change)
})

test('Accordion stable keys survive reordering, normalize selection and skip disabled headers',async()=>{
 const accordion=await mount(ui.HysAccordion,{multiple:true,modelValue:['b','missing','b'],items:[{id:'a',title:'A',disabled:true},{id:'b',title:'B'},{id:'c',title:'C'}]})
 assert.equal(accordion.all('[aria-expanded="true"]').length,1)
 const buttons=accordion.all('.hys-ui-accordion-trigger');buttons[1].focus();await fire(buttons[1],'keydown',{key:'ArrowDown'});assert.equal(document.activeElement,buttons[2]);await fire(buttons[2],'keydown',{key:'Home'});assert.equal(document.activeElement,buttons[1])
 accordion.props.items=[accordion.props.items[2],accordion.props.items[0],accordion.props.items[1]];await nextTick();assert.equal(accordion.all('[aria-expanded="true"]')[0].textContent.trim(),'B')
 await fire(accordion.all('.hys-ui-accordion-trigger')[0],'click');assert.deepEqual([...accordion.props.modelValue],['b','c'])
 accordion.props.multiple=false;await nextTick();assert.equal(accordion.all('[aria-expanded="true"]').length,1)
})

test('Accordion preserves panel state on request and extra actions do not toggle headers',async()=>{
 const accordion=await mount(ui.HysAccordion,{items:[{title:'A'}],destroyOnHide:false},{content:()=>h('input'),extra:()=>h(ui.HysButton,{variant:'ghost'},()=> 'Extra')})
 await fire(accordion.find('.hys-ui-accordion-trigger'),'click');const input=accordion.find('input');input.value='draft'
 await fire(accordion.find('.hys-ui-accordion-extra button'),'click');assert.equal(accordion.events.change.length,1)
 await fire(accordion.find('.hys-ui-accordion-trigger'),'click');assert.equal(input.closest('[role="region"]').style.display,'none')
 await fire(accordion.find('.hys-ui-accordion-trigger'),'click');assert.equal(accordion.find('input'),input);assert.equal(input.value,'draft')
 accordion.props.destroyOnHide=true;await nextTick();await fire(accordion.find('.hys-ui-accordion-trigger'),'click');assert(!accordion.find('input'))
})

test('Accordion icon-only triggers and guards handle refusal, races and unmount',async()=>{
 const pending=[],accordion=await mount(ui.HysAccordion,{items:[{id:'a',title:'A'},{id:'b',title:'B'}],trigger:'icon',beforeToggle:()=>new Promise(resolve=>pending.push(resolve))})
 await fire(accordion.find('.hys-ui-accordion-title'),'click');assert.equal(pending.length,0)
 await fire(accordion.all('.hys-ui-accordion-trigger')[0],'click');pending[0](false);await pause(0);assert(!accordion.events.change)
 await fire(accordion.all('.hys-ui-accordion-trigger')[0],'click');await fire(accordion.all('.hys-ui-accordion-trigger')[1],'click');pending[1](true);pending[2](true);await pause(0);assert.deepEqual([...accordion.props.modelValue],['b'])
 await fire(accordion.all('.hys-ui-accordion-trigger')[0],'click');accordion.unmount();pending[3](true);await pause(0);assert.equal(accordion.events.change.length,1)
})

test('Steps honor individual status, boundary states, custom content and keyboard selection',async()=>{
 const steps=await mount(ui.HysSteps,{current:1,clickable:true,items:[{title:'A',status:'error'},{title:'B'},{title:'C',disabled:true},{title:'D',description:'Description'}]},{icon:({index,status})=>h('i',index+':'+status),subtitle:({index})=>'Phase '+index})
 assert(steps.all('li')[0].classList.contains('hys-ui-step-error'));assert.equal(steps.all('i')[0].textContent,'0:error')
 await fire(steps.all('button')[1],'keydown',{key:'ArrowRight'});assert.equal(steps.props.current,3);assert.equal(document.activeElement,steps.all('button')[3])
 await fire(steps.all('button')[3],'click');assert.equal(steps.events.change.length,1)
 steps.props.current=100;await nextTick();assert.equal(steps.all('[aria-current]').length,0);assert(steps.all('li')[3].classList.contains('hys-ui-done'))
 steps.props.current=-100;await nextTick();assert(steps.all('li')[3].classList.contains('hys-ui-step-wait'))
})

test('Breadcrumb supports per-item separators, disabled links, safe targets and label slots',async()=>{
 const breadcrumb=await mount(ui.HysBreadcrumb,{items:[{label:'Home',href:'#home',target:'_blank'},{label:'Disabled',href:'#blocked',disabled:true,separator:'>'},{label:'Current',href:'#current',showSeparator:false}],separator:'/'},{item:({item,current})=>h('strong',item.label+(current?' current':''))})
 assert.equal(breadcrumb.all('a').length,1);assert.equal(breadcrumb.find('a').rel,'noopener noreferrer')
 assert.equal(breadcrumb.find('.hys-ui-breadcrumb-separator').textContent,'>');assert.equal(breadcrumb.all('.hys-ui-breadcrumb-separator').length,1)
 assert.equal(breadcrumb.find('[aria-current="page"]').textContent,'Current current');assert(breadcrumb.find('[aria-disabled="true"]'))
 await fire(breadcrumb.find('a'),'click');assert.equal(breadcrumb.events.select[0][1],0)
})
test('SortableList Alt+Arrow keys reorder and disabled prevents changes',async()=>{const list=await mount(ui.HysSortableList,{modelValue:[{id:'a',label:'A'},{id:'b',label:'B'}]});await fire(list.all('[role="listitem"]')[1],'keydown',{key:'ArrowUp',altKey:true});assert.equal(list.props.modelValue[0].id,'b');list.props.disabled=true;await nextTick();await fire(list.all('[role="listitem"]')[1],'keydown',{key:'ArrowUp',altKey:true});assert.equal(list.props.modelValue[0].id,'b')})
test('Tree strict checking does not automatically select descendants',async()=>{const tree=await mount(ui.HysTree,{nodes:[{id:'a',label:'A',children:[{id:'b',label:'B'}]}],checkable:true,checkStrictly:true,defaultExpandAll:true,checkedKeys:[]});const input=tree.find('input[type="checkbox"]');input.checked=true;await fire(input,'change');assert.deepEqual([...tree.props.checkedKeys],['a']);assert.equal(tree.vm.getNode('b').label,'B')})
test('Date picker starts on Monday and disables excluded dates',async()=>{const picker=await mount(ui.HysDatePicker,{modelValue:'2026-11-07',min:'2026-11-01',max:'2026-11-30',disabledDate:date=>date.getUTCDay()===0});await fire(picker.find('button'),'click');await pause(20);const calendar=document.querySelector('[data-date="2026-11-01"]');assert(calendar?.disabled);const dates=[...document.querySelectorAll('[data-date]')];assert.equal(new Date(dates[0].dataset.date+'T00:00:00Z').getUTCDay(),1)})
test('Modal guards close, restores scroll and handles escape',async()=>{const modal=await mount(ui.HysModal,{open:true,title:'Guarded',beforeClose:async()=>false},'Content');await pause(20);assert.equal(document.body.style.overflow,'hidden');await fire(document.querySelector('[aria-label="关闭"]'),'click');await pause(5);assert(!modal.events.close);modal.props.beforeClose=()=>true;await nextTick();await fire(document,'keydown',{key:'Escape'});await pause(5);assert.equal(modal.events.close.length,1);modal.props.open=false;await nextTick();assert.notEqual(document.body.style.overflow,'hidden')})
test('DataGrid recovers malformed saved settings and filters in a shared row',async()=>{window.localStorage.setItem('hys-ui-grid:test','{"order":["missing"],"hidden":["id","name"],"widths":null}');globalThis.localStorage=window.localStorage;const grid=await mount(ui.HysDataGrid,{columns:[{key:'id',label:'ID'},{key:'name',label:'Name'}],rows:[{id:1,name:'A'}],storageKey:'test'});assert(grid.host.textContent.includes('Name'));await fire(grid.find('[aria-label="筛选ID"]'),'click');assert(grid.find('[aria-label="过滤ID"]'));assert(!grid.host.textContent.includes('收起筛选'));grid.vm.resetColumns();assert(grid.host.textContent.includes('Name'))})
test('Upload checks type and size before adding; clearFiles updates consumers',async()=>{const upload=await mount(ui.HysUpload,{accept:'.txt',maxSize:20});const input=upload.find('input[type="file"]');Object.defineProperty(input,'files',{configurable:true,value:[new window.File(['ok'],'ok.txt',{type:'text/plain'}),new window.File(['bad'],'bad.png',{type:'image/png'})]});await fire(input,'change');await pause(5);assert.equal(upload.events.change.at(-1)[0].length,1);assert.equal(upload.events.error.length,1);upload.vm.clearFiles();assert.equal(upload.events.change.at(-1)[0].length,0)})
test('KeepAlive removes dialogs and global shortcuts when a page deactivates',async()=>{const shown=ref(true),Page=defineComponent({setup(){return()=>h('div',[h(ui.HysModal,{open:true,title:'Cached'},()=> 'Content'),h(ui.HysCommandPalette,{actions:[{id:'a',label:'A'}]})])}}),host=document.createElement('div');document.body.append(host);const app=createApp({setup(){return()=>h(KeepAlive,()=>shown.value?h(Page):h('p','Other'))}});app.mount(host);await pause(20);assert(document.querySelector('[aria-label="Cached"]'));shown.value=false;await nextTick();await pause(80);assert(!document.querySelector('[aria-label="Cached"]'));await fire(window,'keydown',{key:'k',ctrlKey:true});await nextTick();assert(!document.querySelector('[aria-label="快捷命令"]'));app.unmount();host.remove();assert.notEqual(document.body.style.overflow,'hidden')})
test('Progress clamps invalid bounds for text and accessibility',async()=>{const progress=await mount(ui.HysProgress,{value:125,type:'circle',status:'success'});assert.equal(progress.host.firstElementChild.getAttribute('aria-valuenow'),'100');assert(progress.host.textContent.includes('100%'));progress.props.value=-10;await nextTick();assert.equal(progress.host.firstElementChild.getAttribute('aria-valuenow'),'0')})
test('Avatar recovers after a failed image source is replaced',async()=>{const avatar=await mount(ui.HysAvatar,{name:'HYS',src:'bad.png',shape:'square'});await fire(avatar.find('img'),'error');assert(!avatar.find('img'));avatar.props.src='good.png';await nextTick();assert(avatar.find('img'))})
test('Alert controlled close emits visibility and action exactly once',async()=>{const alert=await mount(ui.HysAlert,{title:'Alert',visible:true,closable:true});await fire(alert.find('button'),'click');assert.equal(alert.events.close.length,1);assert.equal(alert.props.visible,false)})
test('Tag input preserves composition and validates additions',async()=>{const tags=await mount(ui.HysTagInput,{modelValue:[],beforeAdd:value=>value!=='bad'});const input=tags.find('input');input.value='中文';await fire(input,'input');await fire(input,'keydown',{key:'Enter',isComposing:true});assert.equal(tags.props.modelValue.length,0);await fire(input,'keydown',{key:'Enter'});assert.deepEqual([...tags.props.modelValue],['中文']);input.value='bad';await fire(input,'input');await fire(input,'keydown',{key:'Enter'});assert.equal(tags.events.reject.at(-1)[0],'bad')})
test('Tree supports multiple label selection and toggling',async()=>{const tree=await mount(ui.HysTree,{nodes:[{id:'a',label:'A'},{id:'b',label:'B'}],modelValue:[],multiple:true});await fire(tree.all('[role="treeitem"]')[0],'click');await fire(tree.all('[role="treeitem"]')[1],'click');assert.deepEqual([...tree.props.modelValue],['a','b']);await fire(tree.all('[role="treeitem"]')[0],'click');assert.deepEqual([...tree.props.modelValue],['b'])})
test('Mention Escape dismisses suggestions and changed input restores choices',async()=>{const mention=await mount(ui.HysMention,{modelValue:'@',users:[{id:'a',name:'Alice'},{id:'b',name:'Bob',disabled:true}]});await fire(mention.find('textarea'),'focus');await pause(10);assert(document.querySelector('[role="listbox"]'));await fire(mention.find('textarea'),'keydown',{key:'Escape'});assert(!document.querySelector('[role="listbox"]'));mention.props.modelValue='@A';await nextTick();await nextTick();await fire(mention.find('textarea'),'keydown',{key:'Enter'});assert.equal(mention.props.modelValue,'@Alice ')})
test('Context menu keyboard focus skips disabled entries and Escape closes',async()=>{const menu=await mount(ui.HysContextMenu,{items:[{label:'A',value:'a'},{label:'Blocked',value:'b',disabled:true},{label:'C',value:'c'}]},'Menu target');await fire(menu.host.firstElementChild,'keydown',{key:'F10',shiftKey:true});await pause(10);await fire(document.activeElement,'keydown',{key:'ArrowDown'});assert.equal(document.activeElement.textContent,'C');await fire(document,'keydown',{key:'Escape'});assert(!document.querySelector('[role="menu"]'))})
test('Virtual table bounds rendered rows for 10,000 records',async()=>{const table=await mount(ui.HysVirtualTable,{rows:Array.from({length:10000},(_,id)=>({id,name:'Row '+id})),columns:[{key:'id',label:'ID',width:100},{key:'name',label:'Name',width:600}],height:280});assert(table.all('[role="row"]').length<30);const viewport=table.find('.hys-ui-v4-table-viewport');viewport.scrollTop=42000;await fire(viewport,'scroll');assert(table.host.textContent.includes('Row 1000'));assert(table.all('[role="row"]').length<30)})
test('Repeated floating open/close keeps native listeners balanced',async()=>{const select=await mount(ui.HysSelect,{modelValue:'a',options:[{value:'a',label:'A'}]});const add=document.addEventListener.bind(document),remove=document.removeEventListener.bind(document),counts={keydown:0,pointerdown:0};document.addEventListener=function(type,...args){if(type in counts)counts[type]++;return add(type,...args)};document.removeEventListener=function(type,...args){if(type in counts)counts[type]--;return remove(type,...args)};try{for(let index=0;index<30;index++){await fire(select.find('[role="combobox"]'),'click');await fire(document.querySelector('[role="option"]'),'click')}assert.deepEqual(counts,{keydown:0,pointerdown:0})}finally{document.addEventListener=add;document.removeEventListener=remove}})
test('Nested configuration inherits unspecified options and updates reactively',async()=>{const theme=ref('dark'),Child=defineComponent({setup(){ui.provideHysConfig({theme});return()=>h(ui.HysButton,{},()=> 'Configured')}}),Parent=defineComponent({setup(){ui.provideHysConfig({theme:'green',motion:'off'});return()=>h(Child)}});const item=await mount(Parent);const button=item.find('button');assert.equal(button.dataset.hysTheme,'dark');assert.equal(button.dataset.hysMotion,'off');theme.value='purple';await nextTick();assert.equal(button.dataset.hysTheme,'purple')})
test('Range slider preserves ordered bounds without native range controls',async()=>{const slider=await mount(ui.HysSlider,{modelValue:[20,70],step:5});const fields=slider.all('[role=slider]');assert.equal(slider.all('input[type=range]').length,0);await fire(fields[0],'keydown',{key:'End'});assert.deepEqual([...slider.props.modelValue],[70,70]);await fire(fields[1],'keydown',{key:'Home'});assert.deepEqual([...slider.props.modelValue],[70,70])})
test('A cancelled asynchronous close cannot close a reopened modal',async()=>{let finish;const modal=await mount(ui.HysModal,{open:true,title:'Race',beforeClose:()=>new Promise(resolve=>finish=resolve)});await fire(document.querySelector('[aria-label="关闭"]'),'click');modal.props.open=false;await nextTick();modal.props.open=true;await nextTick();finish(true);await pause(5);assert(!modal.events.close)})

test('Tooltip Escape restores focus without reopening',async()=>{const tooltip=await mount(ui.HysTooltip,{text:'Help',showDelay:0},'Trigger');tooltip.host.firstElementChild.focus();await pause(10);assert(document.querySelector('[role="tooltip"]'));await fire(document,'keydown',{key:'Escape'});await pause(10);assert(!document.querySelector('[role="tooltip"]'));assert.equal(document.activeElement,tooltip.host.firstElementChild)})
test('Focus popover stays open while focus enters its content and Tab closes at its boundary',async()=>{const popover=await mount(ui.HysPopover,{trigger:'focus',title:'Details'},{trigger:()=> 'Trigger',default:()=>h('button','Action')});const trigger=popover.find('[role="button"]');trigger.focus();await pause(10);const action=document.querySelector('[role="dialog"] button');assert(action);action.focus();await nextTick();assert(document.querySelector('[role="dialog"]'));await fire(action,'keydown',{key:'Tab'});assert(!document.querySelector('[role="dialog"]'));assert.equal(document.activeElement,trigger)})
test('Form reset snapshots reactive nested values and dates',async()=>{const model=reactive({name:ref('initial'),nested:{count:1},when:new Date('2026-11-01T00:00:00Z')});const form=await mount(ui.HysForm,{model});model.name='changed';model.nested.count=5;model.when.setUTCDate(4);form.vm.resetFields();assert.equal(model.name,'initial');assert.equal(model.nested.count,1);assert.equal(model.when.getUTCDate(),1)})
test('Readonly rating does not preview a different value on hover',async()=>{const rating=await mount(ui.HysRating,{modelValue:2,readonly:true});await fire(rating.all('button')[4],'mousemove');assert.equal(rating.all('.hys-ui-active').length,2);assert(!rating.events.change)})

test('Alert is visible by default and uncontrolled close hides it',async()=>{const alert=await mount(ui.HysAlert,{title:'Visible by default',closable:true});assert(alert.find('[role="status"]'));await fire(alert.find('button'),'click');assert(!alert.find('[role="status"]'))})
test('Popover opens without a v-model or update listener',async()=>{const Consumer=defineComponent({setup(){return()=>h(ui.HysPopover,{title:'Uncontrolled'},{trigger:()=>h('button','Open'),default:()=>h('p','Popover content')})}});const consumer=await mount(Consumer);await fire(consumer.find('[role="button"]'),'click');await pause(10);assert(document.querySelector('[aria-label="Uncontrolled"]'));await fire(document,'keydown',{key:'Escape'});assert(!document.querySelector('[aria-label="Uncontrolled"]'))})

test('Toast defaults to top center and accepts seven positions and legacy aliases',async()=>{const toast=await mount(ui.HysToast,{message:'Saved',duration:0});const root=()=>document.querySelector('.hys-ui-toast');assert(root().classList.contains('hys-ui-toast-position-top-center'));for(const position of ['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right','center']){toast.props.position=position;await nextTick();assert(root().classList.contains('hys-ui-toast-position-'+position))}toast.props.position='bottom';await nextTick();assert(root().classList.contains('hys-ui-toast-position-bottom-center'));await fire(root().querySelector('button'),'click');await fire(root().querySelector('button'),'click');assert.equal(toast.events.close.length,1)})
test('Toast hover preserves the remaining duration',async t=>{t.mock.timers.enable({apis:['setTimeout','Date']});const toast=await mount(ui.HysToast,{message:'Timed',duration:200});t.mock.timers.tick(80);await fire(document.querySelector('.hys-ui-toast'),'mouseenter');t.mock.timers.tick(1000);await nextTick();assert(!toast.events.close);await fire(document.querySelector('.hys-ui-toast'),'mouseleave');t.mock.timers.tick(119);await nextTick();assert(!toast.events.close);t.mock.timers.tick(1);await nextTick();assert.equal(toast.events.close.length,1)})
test('Loading Toast persists by default and explicit duration still closes',async t=>{t.mock.timers.enable({apis:['setTimeout','Date']});const toast=await mount(ui.HysToast,{message:'Loading',type:'loading'});t.mock.timers.tick(10000);await nextTick();assert(!toast.events.close);toast.props.duration=50;await nextTick();t.mock.timers.tick(50);await nextTick();assert.equal(toast.events.close.length,1)})
test('Toast Escape closes the latest eligible message only',async()=>{const first=await mount(ui.HysToast,{message:'First',duration:0,closeOnEscape:true}),second=await mount(ui.HysToast,{message:'Second',duration:0,closeOnEscape:true});await fire(document,'keydown',{key:'Escape'});assert.equal(second.events.close.length,1);assert(!first.events.close);await fire(document,'keydown',{key:'Escape'});assert.equal(first.events.close.length,1)})
test('Toast rich content does not reopen when its close handler clears the message',async()=>{const toast=await mount(ui.HysToast,{message:'Rich',duration:0},{default:()=>h('strong','Custom content')});await fire(document.querySelector('.hys-ui-toast button'),'click');toast.props.message='';await nextTick();assert.equal(toast.events.close.length,1);await pause(80);assert(!document.querySelector('.hys-ui-toast'))})
test('Toast API merges duplicates, limits messages and closes the queue',async()=>{let api;await mount(defineComponent({setup(){api=ui.useHysToast({maxCount:2,duration:0});return()=>h('div')}}));const first=api.info({message:'Repeated',grouping:true}),duplicate=api.info({message:'Repeated',grouping:true});assert.equal(first,duplicate);await nextTick();assert.equal(document.querySelectorAll('.hys-ui-toast').length,1);assert(document.body.textContent.includes('×2'));api.success('Second');await nextTick();api.warning('Third');await pause(100);assert.equal(document.querySelectorAll('.hys-ui-toast').length,2);assert(!document.body.textContent.includes('Repeated'));api.closeAll();await pause(100);assert(!document.querySelector('[data-hys-toast-host]'))})
test('Toast handles update a keyed message and resolve once after close',{timeout:3000},async()=>{let api,closed=0,after=0;await mount(defineComponent({setup(){api=ui.useHysToast();return()=>h('div')}}));const handle=api.loading({id:'job',message:'Working',onClose:()=>closed++,onAfterClose:()=>after++});await nextTick();const original=document.querySelector('.hys-ui-toast');const updated=api.success({id:'job',message:'Done',duration:0});assert.equal(updated,handle);await nextTick();assert.equal(document.querySelector('.hys-ui-toast'),original);assert(original.classList.contains('hys-ui-toast-success'));assert(original.textContent.includes('Done'));handle.close();handle.close();await handle.closed;await nextTick();assert.equal(closed,1);assert.equal(after,1);assert(!document.querySelector('[data-hys-toast-host]'))})
test('Toast API inherits reactive theme and cleans cached page resources',async()=>{let api;const theme=ref('green'),shown=ref(true),Child=defineComponent({setup(){api=ui.useHysToast({duration:0,closeOnEscape:true});return()=>h('div','Page')}}),Page=defineComponent({setup(){ui.provideHysConfig({theme});return()=>h(KeepAlive,()=>shown.value?h(Child):h('p','Other'))}});const page=await mount(Page);api.success('Themed');await nextTick();assert.equal(document.querySelector('.hys-ui-toast').dataset.hysTheme,'green');theme.value='dark';await nextTick();assert.equal(document.querySelector('.hys-ui-toast').dataset.hysTheme,'dark');shown.value=false;await nextTick();await pause(80);assert(!document.querySelector('[data-hys-toast-host]'));await api.info('Inactive').closed;assert(!document.querySelector('.hys-ui-toast'));shown.value=true;await nextTick();api.error('Returned');await nextTick();assert(document.querySelector('.hys-ui-toast'));page.unmount();await nextTick();assert(!document.querySelector('[data-hys-toast-host]'))})

test('Standalone Toast service works outside setup and disposes pending messages',async()=>{const theme=ref('purple'),api=ui.createHysToast({theme,motion:'off',duration:0});try{const handle=api.info('External caller');await nextTick();assert.equal(document.querySelector('.hys-ui-toast').dataset.hysTheme,'purple');theme.value='forest';await nextTick();assert.equal(document.querySelector('.hys-ui-toast').dataset.hysTheme,'forest');api.dispose();await handle.closed;await nextTick();assert(!document.querySelector('[data-hys-toast-host]'));await api.success('Disposed').closed;assert(!document.querySelector('.hys-ui-toast'))}finally{api.dispose()}})

test('Toast hook sees configuration provided in the same setup',async()=>{let api;const theme=ref('orange');const parent=await mount(defineComponent({setup(){ui.provideHysConfig({theme});api=ui.useHysToast({duration:0});return()=>h('div')}}));api.success('Local config');await nextTick();assert.equal(document.querySelector('.hys-ui-toast').dataset.hysTheme,'orange');theme.value='green';await nextTick();assert.equal(document.querySelector('.hys-ui-toast').dataset.hysTheme,'green');parent.unmount()})

test('Drawer direction variables and fullscreen dimensions follow placement',async()=>{const drawer=await mount(ui.HysDrawer,{open:true,title:'Directions'});for(const placement of ['left','right','top','bottom']){drawer.props.placement=placement;await nextTick();const style=document.querySelector('.hys-ui-drawer').style;assert.equal(style.getPropertyValue('--hys-ui-drawer-enter-x'),placement==='left'?'-100%':placement==='right'?'100%':'0px');assert.equal(style.getPropertyValue('--hys-ui-drawer-enter-y'),placement==='top'?'-100%':placement==='bottom'?'100%':'0px')}drawer.props.fullscreen=true;await nextTick();assert.equal(document.querySelector('.hys-ui-drawer').style.height,'100dvh');assert.equal(document.querySelector('.hys-ui-drawer').style.width,'100%');drawer.props.open=false;await nextTick();assert.notEqual(document.body.style.overflow,'hidden')})
test('Cancelled dialog close guards never emit stale rejection errors',async()=>{for(const Component of [ui.HysModal,ui.HysDrawer]){let reject;const dialog=await mount(Component,{open:true,title:'Stale guard',beforeClose:()=>new Promise((_,fail)=>reject=fail)});void dialog.vm.close();await nextTick();assert.equal(typeof reject,'function');dialog.props.open=false;await nextTick();reject(Error('Old failure'));await pause(5);assert(!dialog.events.closeError);dialog.unmount()}})
test('Checkbox preserves mixed semantics, readonly and focus methods',async()=>{const checkbox=await mount(ui.HysCheckbox,{modelValue:false,indeterminate:true,readonly:true,label:'Consent'});const input=checkbox.find('input');assert.equal(input.indeterminate,true);assert.equal(input.getAttribute('aria-checked'),'mixed');assert(checkbox.find('.hys-ui-checkbox-box svg'));await fire(input,'click');assert.equal(checkbox.props.modelValue,false);checkbox.vm.focus();assert.equal(document.activeElement,input);checkbox.props.readonly=false;await nextTick();input.checked=true;await fire(input,'change');assert.equal(checkbox.props.modelValue,true);assert.equal(checkbox.events.change.at(-1)[0],true)})
test('Radio groups preserve numeric values and readonly selections',async()=>{const radio=await mount(ui.HysRadioGroup,{modelValue:1,options:[{label:'One',value:1},{label:'Two',value:2}],readonly:true});await fire(radio.all('input')[1],'change');assert.equal(radio.props.modelValue,1);radio.props.readonly=false;await nextTick();await fire(radio.all('input')[1],'change');assert.equal(radio.props.modelValue,2);assert.equal(radio.events.change.at(-1)[0],2)})
test('Permission matrix supports partial, row and global selection',async()=>{const matrix=await mount(ui.HysPermissionMatrix,{roles:['A','B'],resources:['One','Two'],modelValue:{'One:A':true}});assert.equal(matrix.find('[aria-label="全选所有权限"]').indeterminate,true);const row=matrix.find('[aria-label="全选资源 One"]');row.checked=true;await fire(row,'change');assert.equal(matrix.props.modelValue['One:B'],true);const all=matrix.find('[aria-label="全选所有权限"]');all.checked=true;await fire(all,'change');assert.equal(Object.values(matrix.props.modelValue).filter(Boolean).length,4);matrix.props.readonly=true;await nextTick();all.checked=false;await fire(all,'change');assert.equal(Object.values(matrix.props.modelValue).filter(Boolean).length,4)})
test('Transfer emits moved keys before synchronous model updates and disables both panes',async()=>{const transfer=await mount(ui.HysTransfer,{modelValue:['b'],options:[{value:'a',label:'A'},{value:'b',label:'B'}]});const first=transfer.find('input[type="checkbox"]');first.checked=true;await fire(first,'change');await fire(transfer.find('[aria-label="添加选中项"]'),'click');assert.deepEqual([...transfer.props.modelValue],['b','a']);assert.deepEqual([...transfer.events.change.at(-1)[2]],['a']);transfer.props.disabled=true;await nextTick();await pause(80);assert(transfer.all('input[type="checkbox"]').every(input=>input.disabled))})
test('Tabs and Segmented have keyboard fallback and stable change payloads',async()=>{for(const [Component,prop,role]of [[ui.HysTabs,'items','tab'],[ui.HysSegmented,'options','radio']]){const control=await mount(Component,{modelValue:'missing',[prop]:[{value:'a',label:'A',disabled:true},{value:'b',label:'B'},{value:'c',label:'C'}]});assert.equal(control.all('[role="'+role+'"]').filter(x=>x.tabIndex===0).length,1);await fire(control.find('[role="tablist"]')??control.host.firstElementChild,'keydown',{key:'ArrowLeft'});assert.equal(control.props.modelValue,'c');assert.equal(control.events.change.at(-1)[0],'c');control.unmount()}})
test('Switch emits the requested value and ignores disabled async completions',async()=>{const control=await mount(ui.HysSwitch,{modelValue:false});await fire(control.find('button'),'click');assert.equal(control.props.modelValue,true);assert.equal(control.events.change.at(-1)[0],true);let finish;control.props.beforeChange=next=>new Promise(resolve=>{assert.equal(next,false);finish=resolve});await nextTick();await fire(control.find('button'),'click');control.props.disabled=true;await nextTick();finish(true);await pause(5);assert.equal(control.props.modelValue,true);assert.equal(control.events.change.length,1)})
test('Upload clear cancels pending validation; single-file limit allows replacement',async()=>{let finish;const upload=await mount(ui.HysUpload,{multiple:false,limit:1,beforeUpload:()=>new Promise(resolve=>finish=resolve)});const input=upload.find('input[type="file"]');const choose=async name=>{Object.defineProperty(input,'files',{configurable:true,value:[new window.File(['file'],name)]});await fire(input,'change')};await choose('old.txt');upload.vm.clearFiles();finish(true);await pause(5);assert.equal(upload.events.change.length,1);assert.equal(upload.events.change[0][0].length,0);upload.props.beforeUpload=undefined;await nextTick();await choose('first.txt');await choose('second.txt');assert.equal(upload.events.change.at(-1)[0][0].name,'second.txt');assert(!upload.events.exceed);upload.props.beforeUpload=()=>false;await nextTick();await choose('rejected.txt');assert.equal(upload.events.change.at(-1)[0][0].name,'second.txt');assert(upload.host.textContent.includes('second.txt'))})
test('Select opens on an enabled option, preserves remote labels and ignores IME Enter',async()=>{const select=await mount(ui.HysSelect,{modelValue:'',options:[{value:'a',label:'Blocked',disabled:true},{value:'b',label:'Beta'}]});await fire(select.find('[role="combobox"]'),'click');await pause(10);await fire(select.find('[role="combobox"]'),'keydown',{key:'Enter',isComposing:true});assert.equal(select.props.modelValue,'');await fire(select.find('[role="combobox"]'),'keydown',{key:'Enter'});assert.equal(select.props.modelValue,'b');select.props.options=[{value:'c',label:'Charlie'}];await nextTick();await nextTick();assert(select.host.textContent.includes('Beta'));assert(!select.host.textContent.includes('Charlie'))})
test('TreeSelect without search focuses tree items and permits keyboard selection',async()=>{const select=await mount(ui.HysTreeSelect,{modelValue:'',searchable:false,nodes:[{value:'a',label:'A'},{value:'b',label:'B'}]});await fire(select.find('[role="combobox"]'),'keydown',{key:'ArrowDown'});await pause(10);assert.equal(document.activeElement.getAttribute('role'),'treeitem');await fire(document.activeElement,'keydown',{key:'ArrowDown'});await pause(5);await fire(document.activeElement,'keydown',{key:'Enter'});await pause(5);assert.equal(select.props.modelValue,'b')})
test('Cascader keyboard opening skips disabled nodes and keeps text cursor keys',async()=>{const cascader=await mount(ui.HysCascader,{modelValue:[],filterable:true,options:[{value:'a',label:'A'}]});await fire(cascader.find('button'),'keydown',{key:'ArrowDown'});await pause(10);const input=document.querySelector('[aria-label="搜索分类"]');assert.equal(document.activeElement,input);const event=new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true});input.dispatchEvent(event);assert.equal(event.defaultPrevented,false);await fire(input,'keydown',{key:'ArrowDown'});assert.equal(document.activeElement.textContent,'A')})
test('Form validates custom selections on change and reset clears without revalidating',async()=>{const model=reactive({member:'initial'});const form=await mount(ui.HysForm,{model,rules:{member:{required:true,message:'Select a member',trigger:'change'}}},{default:()=>h(ui.HysFormItem,{label:'Member',prop:'member',hint:'Choose one'},()=>h(ui.HysSelect,{modelValue:model.member,options:[{label:'Initial',value:'initial'}]}))});model.member='';await nextTick();await nextTick();assert.equal(form.vm.errors.member,'Select a member');const control=form.find('[role="combobox"]');assert.equal(control.getAttribute('aria-invalid'),'true');form.vm.resetFields();await nextTick();await nextTick();assert.equal(model.member,'initial');assert.deepEqual({...form.vm.errors},{});assert.equal(control.getAttribute('aria-invalid'),'false');assert(control.getAttribute('aria-describedby').endsWith('-hint'))})
test('Slider range track snaps relative to its minimum',async()=>{const slider=await mount(ui.HysSlider,{modelValue:[3,9],min:1,max:9,step:2});slider.find('.hys-ui-slider-range').dispatchEvent(new MouseEvent('pointerdown',{bubbles:true,clientX:170}));await nextTick();assert.deepEqual([...slider.props.modelValue],[5,9])})

test('Calendar initially displays the selected month and readonly prevents selection',async()=>{const calendar=await mount(ui.HysCalendar,{modelValue:'2025-02-12',readonly:true});assert(calendar.host.textContent.includes('2025年2月'));await fire(calendar.find('[aria-pressed="true"]'),'click');assert(!calendar.events.select);calendar.props.readonly=false;await nextTick();await fire(calendar.find('[aria-pressed="true"]'),'click');assert.equal(calendar.events.select[0][0],'2025-02-12')})
test('AnimatedNumber zero duration and invalid values settle without stale frames',async()=>{const number=await mount(ui.HysAnimatedNumber,{value:10,duration:0});number.props.value=25;await nextTick();assert.equal(number.host.textContent,'25');number.props.value=NaN;number.props.decimals=Infinity;await nextTick();assert.equal(number.host.textContent,'0')})
test('Standalone Badge omits an empty tag and clamps its numeric counter',async()=>{const badge=await mount(ui.HysBadge,{value:120,max:99});assert.equal(badge.host.textContent,'99+');assert(!badge.find('.hys-ui-badge'));assert(badge.find('.hys-ui-badge-standalone'));badge.props.value=0;await nextTick();assert(!badge.find('sup'))})
test('Waiting Steps do not highlight the active step and disabled steps suppress changes',async()=>{const steps=await mount(ui.HysSteps,{items:['A','B'],current:0,status:'wait',clickable:true,disabled:true});assert(!steps.find('.hys-ui-active'));assert(steps.all('button').every(button=>button.disabled))})
test('Resizable layouts normalize bounds and support Home/End keyboard sizing',async()=>{const split=await mount(ui.HysSplitPane,{modelValue:500,min:20,max:80});assert.equal(split.find('[role="separator"]').getAttribute('aria-valuenow'),'80');await fire(split.find('[role="separator"]'),'keydown',{key:'Home'});assert.equal(split.props.modelValue,20);await fire(split.find('[role="separator"]'),'keydown',{key:'End'});assert.equal(split.props.modelValue,80);const panel=await mount(ui.HysResizablePanel,{modelValue:500,minWidth:100,maxWidth:400});assert.equal(panel.find('[role="separator"]').getAttribute('aria-valuenow'),'400');await fire(panel.find('[role="separator"]'),'keydown',{key:'Home'});assert.equal(panel.props.modelValue,100);await fire(panel.find('[role="separator"]'),'keydown',{key:'End'});assert.equal(panel.props.modelValue,400)})
test('Textarea inherits field feedback without overwriting its own error',async()=>{const form=await mount(ui.HysForm,{model:{note:''}},{default:()=>h(ui.HysFormItem,{label:'Note',prop:'note',hint:'Helpful text'},()=>h(ui.HysTextarea,{modelValue:'',error:'Local error',readonly:true}))});const input=form.find('textarea');assert.equal(input.getAttribute('aria-invalid'),'true');assert.equal(document.getElementById(input.getAttribute('aria-describedby')).textContent,'Local error');input.value='attempt';await fire(input,'input');assert.equal(input.value,'');assert.equal(form.props.model.note,'')})

test('Pagination synchronizes the page when a size change reduces the page count',async()=>{const pager=await mount(ui.HysPagination,{page:10,total:100,pageSize:10,showSizeChanger:true,showQuickJumper:true});await fire(pager.find('[role="combobox"]'),'click');await pause(10);const option=[...document.querySelectorAll('[role="option"]')].find(node=>node.textContent.trim()==='50');await fire(option,'click');assert.equal(pager.props.pageSize,50);assert.equal(pager.props.page,2);assert.equal(pager.events.change.at(-1)[0],2);assert.equal(pager.events.pageSizeChange.at(-1)[0],50);assert(pager.host.textContent.includes('51–100'));const input=pager.find('.hys-ui-pf-pagination-jump input');assert(input);assert(!pager.find('.hys-ui-pf-pagination-jump [aria-label="增加"]'));input.value='1';await fire(input,'input');assert.equal(pager.find('.hys-ui-pf-pagination-jump button[type="submit"]').disabled,false);await fire(pager.find('.hys-ui-pf-pagination-jump'),'submit');assert.equal(pager.props.page,1)})
test('NotificationCenter disables every action and keeps unread filtering controlled',async()=>{const center=await mount(ui.HysNotificationCenter,{disabled:true,items:[{id:'a',title:'A',read:false},{id:'b',title:'B',read:true}]});assert(center.all('button').every(button=>button.disabled));for(const button of center.all('button'))await fire(button,'click');assert(!center.events.read&&!center.events.open&&!center.events['read-all']);center.props.disabled=false;await nextTick();await fire(center.find('li button'),'click');assert.equal(center.events.open[0][0],'a');assert.equal(center.events.read[0][0],'a');center.props.items=center.props.items.map(item=>({...item,read:true}));await nextTick();await fire(center.all('.hys-ui-ent-toolbar button').find(button=>button.textContent==='未读'),'click');assert.equal(center.all('li').length,0);assert(center.host.textContent.includes('暂无通知'))})
test('Search defers IME queries, debounces final text and cancels stale work',async t=>{t.mock.timers.enable({apis:['setTimeout']});const search=await mount(ui.HysSearch,{modelValue:'',delay:300});const input=search.find('input');await fire(input,'compositionstart');input.value='中';await fire(input,'input');t.mock.timers.tick(500);assert(!search.events.search&&!search.events['update:modelValue']);await fire(input,'compositionend');assert.equal(search.props.modelValue,'中');t.mock.timers.tick(299);assert(!search.events.search);t.mock.timers.tick(1);assert.equal(search.events.search[0][0],'中');input.value='new';await fire(input,'input');await fire(input,'keydown',{key:'Enter'});assert.equal(search.events.search.at(-1)[0],'new');const calls=search.events.search.length;t.mock.timers.tick(300);assert.equal(search.events.search.length,calls);input.value='stale';await fire(input,'input');search.props.modelValue='external';await nextTick();t.mock.timers.tick(300);assert.equal(search.events.search.length,calls);input.value='cancel';await fire(input,'input');search.props.disabled=true;await nextTick();t.mock.timers.tick(300);assert.equal(search.events.search.length,calls)})
test('CommandPalette resets keyboard selection on filtering and ignores composition Enter',async()=>{const commands=await mount(ui.HysCommandPalette,{actions:[{id:'a',label:'Alpha'},{id:'b',label:'Beta'}]});await fire(commands.find('button'),'click');await pause(10);const input=document.querySelector('[role="combobox"]');await fire(input,'keydown',{key:'ArrowDown'});input.value='Alpha';await fire(input,'input');await fire(input,'keydown',{key:'Enter',isComposing:true});assert(!commands.events.select);await fire(input,'keydown',{key:'Enter'});assert.equal(commands.events.select[0][0],'a');await pause(80);assert(!document.querySelector('[aria-label="快捷命令"]'))})
test('OrgTree normalizes duplicate and cyclic input and enables default search',async()=>{const org=await mount(ui.HysOrgTree,{nodes:[{id:'a',name:'Alpha',parentId:'b'},{id:'b',name:'Beta',parentId:'a'},{id:'c',name:'Gamma'},{id:'c',name:'Duplicate'}]});assert(org.find('input'));assert.equal(org.all('[role="treeitem"]').length,3);assert(org.host.textContent.includes('Gamma'));assert(!org.host.textContent.includes('Duplicate'));await fire(org.all('[role="treeitem"]')[2],'click');assert.equal(org.events['update:modelValue'][0][0],'c')})
test('Tour clamps its current step and closes with Escape by default',async()=>{const tour=await mount(ui.HysTour,{modelValue:true,current:99,steps:[{title:'First',description:'One'},{title:'Last',description:'Two'}]});await pause(10);assert(document.querySelector('[aria-label="Last"]'));await fire([...document.querySelectorAll('.hys-ui-dialog-foot button')].find(button=>button.textContent==='上一步'),'click');assert.equal(tour.props.current,0);assert(document.querySelector('[aria-label="First"]'));await fire(document,'keydown',{key:'Escape'});assert.equal(tour.props.modelValue,false);assert.equal(tour.events.close.length,1)})
test('RichTextEditor cancels a pending link operation when the cached page leaves',async()=>{const shown=ref(true),original=document.execCommand,calls=[];document.execCommand=(...args)=>{calls.push(args);return true};try{const Editor=defineComponent({setup(){return()=>h(ui.HysRichTextEditor,{modelValue:'<p>Owned text</p>'})}});await mount(defineComponent({setup(){return()=>h(KeepAlive,()=>shown.value?h(Editor):h('p','Other page'))}}));await fire([...document.querySelectorAll('[role="toolbar"] button')].find(button=>button.textContent==='链接'),'click');await pause(10);const input=document.querySelector('[placeholder="https://example.com"]');input.value='https://example.com';await fire(input,'input');const action=[...document.querySelectorAll('.hys-ui-dialog-foot button')].find(button=>button.textContent==='插入');const pending=fire(action,'click');shown.value=false;await pending;await pause(80);assert.equal(calls.length,0);assert(!document.querySelector('[aria-label="插入链接"]'))}finally{document.execCommand=original}})
test('FileManager supports keyboard selection, host events and disabled state',async()=>{const manager=await mount(ui.HysFileManager,{modelValue:[{id:'a',name:'a.txt',size:20}]});let opens=0;const input=manager.find('input');input.click=()=>opens++;await fire(manager.find('[role="button"]'),'keydown',{key:'Enter'});assert.equal(opens,1);Object.defineProperty(input,'files',{configurable:true,value:[new window.File(['A'],'new.txt')]});await fire(input,'change');assert.equal(manager.events.upload[0][0][0].name,'new.txt');await fire(manager.all('button')[1],'click');assert.equal(manager.events.remove[0][0],'a');manager.props.disabled=true;await nextTick();await fire(manager.find('[role="button"]'),'keydown',{key:'Enter'});assert.equal(opens,1);assert(input.disabled);assert(manager.all('button').every(button=>button.disabled))})
test('Accordion switches single panels and preserves multiple controlled values',async()=>{const accordion=await mount(ui.HysAccordion,{modelValue:[0],items:[{title:'First',content:'A'},{title:'Second',content:'B'},{title:'Blocked',disabled:true}]});await fire(accordion.all('button')[1],'click');assert.deepEqual([...accordion.props.modelValue],[1]);accordion.props.multiple=true;await nextTick();await fire(accordion.all('button')[0],'click');assert.deepEqual([...accordion.props.modelValue],[1,0]);await fire(accordion.all('button')[2],'click');assert.deepEqual([...accordion.props.modelValue],[1,0])})
test('Table cycles sort state without mutating rows and emits the selected row',async()=>{const table=await mount(ui.HysTable,{columns:[{key:'value',label:'Value',sortable:true}],rows:[{id:'a',value:10},{id:'b',value:2}]},{value:({value})=>h('strong',String(value))});const header=table.find('th button');await fire(header,'click');assert.equal(table.find('tbody strong').textContent,'2');assert.equal(table.props.rows[0].id,'a');assert.equal(table.find('th').getAttribute('aria-sort'),'ascending');await fire(table.find('tbody tr'),'click');assert.equal(table.events.rowClick[0][0].id,'b');await fire(header,'click');assert.equal(table.find('tbody strong').textContent,'10');await fire(header,'click');assert.equal(table.events.sortChange.at(-1)[0],null)})
test('JsonEditor formats valid input and leaves invalid text available for correction',async()=>{const json=await mount(ui.HysJsonEditor,{modelValue:'{"answer":42}'});await fire(json.find('button'),'click');assert(json.props.modelValue.includes('\n  "answer": 42'));json.props.modelValue='{broken';await nextTick();await fire(json.find('button'),'click');assert.equal(json.props.modelValue,'{broken');assert(json.host.textContent.includes('JSON 无效'))})
test('Kanban emits a move request without changing host-owned cards',async()=>{const board=await mount(ui.HysKanban,{columns:[{id:'todo',title:'Todo'},{id:'done',title:'Done'}],cards:[{id:'a',title:'Task',column:'todo'}]});await fire(board.find('[role="combobox"]'),'click');await pause(10);await fire([...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()==='Done'),'click');assert.deepEqual(board.events.move[0],['a','done']);assert.equal(board.props.cards[0].column,'todo')})
test('Form labels and validation focus composite controls instead of hidden inputs',async()=>{const form=await mount(ui.HysForm,{model:{choice:''},rules:{choice:{required:true,message:'Choose a value'}}},{default:()=>[h(ui.HysFormItem,{label:'Choice',prop:'choice'},()=>h(ui.HysRadioGroup,{modelValue:'',options:[{label:'One',value:'one'}]})),h(ui.HysFormItem,{label:'Score'},()=>h(ui.HysRating,{modelValue:0})),h(ui.HysFormItem,{label:'Files'},()=>h(ui.HysFileManager,{modelValue:[]}))]});await fire(form.find('form'),'submit');await pause(5);assert.equal(document.activeElement,form.find('input[type="radio"]'));const labels=form.all('.hys-ui-ent-field>label');await fire(labels[1],'click');assert.equal(document.activeElement,form.find('[role="slider"]'));await fire(labels[2],'click');const fileControl=form.find('[role="button"]');assert.equal(document.activeElement,fileControl);assert.equal(fileControl.id,labels[2].htmlFor);assert(form.find('input[type="file"]').hidden)})
