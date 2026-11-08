import {test,afterEach} from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true})
for(const name of ['window','document','Document','ShadowRoot','Node','Element','HTMLElement','SVGElement','HTMLInputElement','HTMLTextAreaElement','HTMLButtonElement','HTMLSelectElement','HTMLFormElement','Event','FocusEvent','MouseEvent','KeyboardEvent','MutationObserver'])globalThis[name]=dom.window[name]
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
async function mount(Component,values={},slots={}){
 const props=reactive(values),events={},element=ref(),host=document.createElement('div');document.body.append(host)
 const listeners=Object.fromEntries((Array.isArray(Component.emits)?Component.emits:Object.keys(Component.emits||{})).map(name=>['on'+name[0].toUpperCase()+name.slice(1),(...args)=>{(events[name]??=[]).push(args);if(name.startsWith('update:'))props[name.slice(7)]=args[0]}]))
 const app=createApp({setup(){ui.provideHysConfig({motion:'off'});return()=>h(Component,{...props,...listeners,ref:element},slots)}})
 app.mount(host);const item={props,events,host,get vm(){return element.value},find:selector=>host.querySelector(selector),all:selector=>[...host.querySelectorAll(selector)],unmount(){app.unmount();host.remove();mounts.delete(item)}};mounts.add(item);await nextTick();return item
}
const key=async(el,key,options={})=>{el.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options}));await nextTick()}
const pointer=async(el,type,x=20,y=40,id=1)=>{const event=new MouseEvent(type,{clientX:x,clientY:y,button:0,bubbles:true,cancelable:true});Object.defineProperties(event,{pointerId:{value:id},pointerType:{value:'mouse'}});el.dispatchEvent(event);await nextTick()}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
afterEach(async()=>{for(const item of [...mounts])item.unmount();await nextTick();document.body.innerHTML=''})

test('Custom slider exposes accessible thumbs and has no native range inputs',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:40,label:'Volume',name:'volume',id:'volume-field'}),thumb=entry.find('[role=slider]');assert.equal(entry.find('input[type=range]'),null);assert.equal(thumb.id,'volume-field');assert.equal(thumb.getAttribute('aria-label'),'Volume');assert.equal(thumb.getAttribute('aria-valuenow'),'40');assert.equal(thumb.getAttribute('aria-orientation'),'horizontal');assert.equal(entry.find('.hys-ui-slider-value').textContent,'Volume：40');assert.equal(entry.find('input[type=hidden]').value,'40');entry.vm.focus();assert.equal(document.activeElement,thumb);entry.vm.blur();assert.notEqual(document.activeElement,thumb)
})
test('Keyboard uses exact decimal steps from min, page keys and bounded endpoints',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:0.1,min:0.1,max:1,step:0.2}),thumb=entry.find('[role=slider]');await key(thumb,'ArrowRight');assert.equal(entry.props.modelValue,0.3);await key(thumb,'ArrowUp');assert.equal(entry.props.modelValue,0.5);await key(thumb,'PageUp');assert.equal(entry.props.modelValue,1);await key(thumb,'ArrowDown');assert.equal(entry.props.modelValue,0.9);await key(thumb,'Home');assert.equal(entry.props.modelValue,0.1);await key(thumb,'End');assert.equal(entry.props.modelValue,1);assert.equal(entry.events.change.length,6)
})
test('Range endpoints cannot cross and constrain accessible min/max',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:[20,70],step:5,label:'Budget'}),[start,end]=entry.all('[role=slider]');await key(start,'End');assert.deepEqual([...entry.props.modelValue],[70,70]);await key(end,'Home');assert.deepEqual([...entry.props.modelValue],[70,70]);assert.equal(start.getAttribute('aria-valuemax'),'70');assert.equal(end.getAttribute('aria-valuemin'),'70');assert.equal(start.getAttribute('aria-label'),'Budget下限');assert.equal(end.getAttribute('aria-label'),'Budget上限');await key(start,'Home');await key(end,'End');assert.deepEqual([...entry.props.modelValue],[0,100])
})
test('Pointer updates follow the rail and commit exactly once on release',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:10,step:5}),rail=entry.find('.hys-ui-slider-rail');await pointer(rail,'pointerdown',80);assert.equal(entry.props.modelValue,20);assert.equal(entry.events.change,undefined);await pointer(document,'pointermove',140);await pointer(document,'pointermove',200);await pause(25);assert.equal(entry.props.modelValue,60);assert.equal(entry.events.input.length,2);await pointer(document,'pointerup',260);assert.equal(entry.props.modelValue,80);assert.deepEqual(entry.events.change,[[80]]);assert.equal(entry.events.dragStart.length,1);assert.equal(entry.events.dragEnd.length,1);assert.equal(entry.vm.dragging,false)
})
test('Unrelated pointers are ignored; cancel removes listeners without a final change',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:30});await pointer(entry.find('[role=slider]'),'pointerdown',110);await pointer(document,'pointermove',260,40,2);await pause(22);assert.equal(entry.props.modelValue,30);await pointer(document,'pointerup',260,40,2);assert(entry.vm.dragging);await pointer(document,'pointermove',170);await pause(22);assert.equal(entry.props.modelValue,50);await pointer(document,'pointercancel',170);assert.equal(entry.events.change,undefined);assert.equal(entry.events.dragEnd[0][1].cancelled,true);await pointer(document,'pointermove',320);await pause(22);assert.equal(entry.props.modelValue,50)
})
test('Escape restores the starting value and drops queued pointer frames',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:25});await pointer(entry.find('[role=slider]'),'pointerdown',95);await pointer(document,'pointermove',230);await pause(25);assert.equal(entry.props.modelValue,70);await key(entry.find('[role=slider]'),'Escape');assert.equal(entry.props.modelValue,25);assert.equal(entry.events.change,undefined);await pointer(document,'pointerup',320);assert.equal(entry.props.modelValue,25)
})
test('Dragging an included range moves the interval while preserving its span',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:[20,50],step:5,draggableTrack:true});await pointer(entry.find('.hys-ui-slider-selection'),'pointerdown',125);await pointer(document,'pointerup',275);assert.deepEqual([...entry.props.modelValue],[70,100]);assert.equal(entry.events.dragEnd[0][1].track,true);assert.deepEqual(entry.events.change[0][0],[70,100])
})
test('Fresh inline mark objects do not interrupt multi-step endpoint or interval drags',async()=>{
 const state=reactive({value:[20,70]}),Wrapper=defineComponent({setup:()=>()=>h(ui.HysSlider,{modelValue:state.value,'onUpdate:modelValue':value=>state.value=value,step:5,draggableTrack:true,marks:{0:'0',50:'50',100:'100'}})}),entry=await mount(Wrapper);await pointer(entry.find('[role=slider]'),'pointerdown',80);await pointer(document,'pointermove',95);await pause(25);await pointer(document,'pointermove',125);await pause(25);await pointer(document,'pointerup',140);assert.deepEqual([...state.value],[40,70]);assert(entry.find('.hys-ui-slider-dragging')===null);state.value=[20,70];await nextTick();await pointer(entry.find('.hys-ui-slider-selection'),'pointerdown',155);await pointer(document,'pointermove',170);await pause(25);assert(entry.find('.hys-ui-slider-dragging'));await pointer(document,'pointermove',200);await pause(25);await pointer(document,'pointerup',215);assert.deepEqual([...state.value],[40,90])
})
test('Whole-range decimal dragging preserves exact endpoint differences',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:[0.1,0.3],min:0,max:1,step:0.1,draggableTrack:true});await pointer(entry.find('.hys-ui-slider-selection'),'pointerdown',80);await pointer(document,'pointerup',230);assert.deepEqual([...entry.props.modelValue],[0.6,0.8])
})
test('Mark-only mode navigates marks and ignores out of range entries',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:25,step:'mark',marks:{'-10':'Bad',0:'Off',25:'Low',60:'High',100:'Full',120:'Bad'}}),thumb=entry.find('[role=slider]');assert.equal(entry.all('.hys-ui-slider-mark').length,4);await key(thumb,'ArrowRight');assert.equal(entry.props.modelValue,60);await key(thumb,'Home');assert.equal(entry.props.modelValue,0);await key(thumb,'End');assert.equal(entry.props.modelValue,100);entry.all('.hys-ui-slider-mark')[1].click();await nextTick();assert.equal(entry.props.modelValue,25)
})
test('Reverse and vertical modes map physical coordinates correctly',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:20,reverse:true});await pointer(entry.find('.hys-ui-slider-rail'),'pointerdown',80);await pointer(document,'pointerup',80);assert.equal(entry.props.modelValue,80);await key(entry.find('[role=slider]'),'ArrowRight');assert.equal(entry.props.modelValue,79);entry.props.vertical=true;entry.props.reverse=false;await nextTick();await pointer(entry.find('.hys-ui-slider-rail'),'pointerdown',20,30);await pointer(document,'pointerup',20,30);assert.equal(entry.props.modelValue,75);assert.equal(entry.find('[role=slider]').getAttribute('aria-orientation'),'vertical')
})
test('Readonly, disabled and keyboard policy block their respective mutations',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:40,readonly:true});await key(entry.find('[role=slider]'),'End');entry.vm.setValue(80);await pointer(entry.find('.hys-ui-slider-rail'),'pointerdown',320);assert.equal(entry.props.modelValue,40);entry.props.readonly=false;entry.props.keyboard=false;await nextTick();await key(entry.find('[role=slider]'),'End');assert.equal(entry.props.modelValue,40);entry.props.disabled=true;await nextTick();assert.equal(entry.find('[role=slider]').tabIndex,-1);assert.equal(entry.find('[role=slider]').getAttribute('aria-disabled'),'true')
})
test('Changing bounds, models or disabled status ends active drags without late commits',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:40});await pointer(entry.find('[role=slider]'),'pointerdown',140);await pointer(document,'pointermove',290);entry.props.modelValue=15;await nextTick();await pause(25);assert.equal(entry.props.modelValue,15);assert.equal(entry.vm.dragging,false);assert.equal(entry.events.change,undefined);await pointer(entry.find('[role=slider]'),'pointerdown',65);entry.props.disabled=true;await nextTick();await pointer(document,'pointerup',320);assert.equal(entry.props.modelValue,15);assert.equal(entry.events.change,undefined)
})
test('Controlled hosts may reject values while uncontrolled defaults remain usable',async()=>{
 const requests=[],Wrapper=defineComponent({setup:()=>()=>h(ui.HysSlider,{modelValue:30,'onUpdate:modelValue':value=>requests.push(value)})}),entry=await mount(Wrapper);await key(entry.find('[role=slider]'),'End');assert.deepEqual(requests,[100]);assert.equal(entry.find('[role=slider]').getAttribute('aria-valuenow'),'30');entry.unmount();const Single=defineComponent({setup:()=>()=>h(ui.HysSlider,{defaultValue:15})}),uncontrolled=await mount(Single);await key(uncontrolled.find('[role=slider]'),'ArrowRight');assert.equal(uncontrolled.find('[role=slider]').getAttribute('aria-valuenow'),'16')
})
test('Number editing, named native form values and custom tooltip/mark/thumb slots stay synchronized',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:[20,60],showInput:true,name:'interval',tooltipVisible:true,marks:{0:'Zero'},formatTooltip:value=>value+'%'},{tooltip:({value})=>h('b',value+' percent'),thumb:()=>h('i','•'),mark:({label})=>h('strong',label)});const number=entry.find('input:not([type=hidden])');number.value='35';number.dispatchEvent(new Event('change',{bubbles:true}));await nextTick();assert.deepEqual([...entry.props.modelValue],[35,60]);assert.deepEqual(entry.all('input[type=hidden][name=interval]').map(el=>el.value),['35','60']);assert.equal(document.getElementById(entry.find('[role=slider]').getAttribute('aria-describedby')).textContent,'35 percent');assert(entry.find('.hys-ui-slider-handle i'));assert(entry.find('.hys-ui-slider-mark strong'));assert.equal(entry.find('[role=slider]').getAttribute('aria-valuetext'),'35%')
})
test('Invalid ranges are disabled and stop rendering remains bounded for huge numeric ranges',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:2,min:10,max:5,showStops:true});assert.equal(entry.find('[role=slider]').getAttribute('aria-disabled'),'true');entry.props.min=0;entry.props.max=1000000;entry.props.step=0.001;entry.props.maxStops=60;await nextTick();assert(entry.all('.hys-ui-slider-stop').length<=60);entry.props.step='mark';await nextTick();assert.equal(entry.find('[role=slider]').getAttribute('aria-disabled'),'true')
})
test('Slider tooltip escapes clipping containers and shifts or flips at viewport edges',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:100,tooltipVisible:true,style:'overflow:hidden'}),thumb=entry.find('[role=slider]'),handle=entry.find('.hys-ui-slider-handle'),tip=document.getElementById(thumb.getAttribute('aria-describedby'));
 assert.equal(tip.parentElement,document.body);assert(!entry.host.contains(tip));entry.find('.hys-ui-slider-wrap').getBoundingClientRect=()=>({left:0,top:0,right:1024,bottom:768,width:1024,height:768});
 let left=1000,top=80;handle.getBoundingClientRect=()=>({left,top,right:left+18,bottom:top+18,width:18,height:18});tip.getBoundingClientRect=()=>({left:0,top:0,right:160,bottom:30,width:160,height:30});
 window.dispatchEvent(new Event('resize'));await pause(25);assert.equal(tip.style.left,'856px');assert.equal(tip.style.top,'42px');
 left=2;window.dispatchEvent(new Event('resize'));await pause(25);assert.equal(tip.style.left,'8px');
 top=2;window.dispatchEvent(new Event('resize'));await pause(25);assert(tip.classList.contains('hys-ui-slider-tooltip-bottom'));assert.equal(tip.style.top,'28px');
 left=1000;top=80;entry.props.tooltipPlacement='right';await nextTick();await pause(25);assert(tip.classList.contains('hys-ui-slider-tooltip-left'));assert.equal(tip.style.left,'832px');
 entry.props.showTooltip=false;await nextTick();assert.equal(document.getElementById(tip.id),null);assert(!thumb.getAttribute('aria-describedby'))
})
test('Always-visible tooltip hides for offscreen handles and is removed on cached-page leave',async()=>{
 const state=reactive({visible:true}),Wrapper=defineComponent({setup:()=>()=>h(KeepAlive,null,()=>state.visible?h(ui.HysSlider,{modelValue:50,tooltipVisible:true}):h('div','Other'))}),entry=await mount(Wrapper),thumb=entry.find('[role=slider]'),handle=entry.find('.hys-ui-slider-handle'),id=thumb.getAttribute('aria-describedby');let left=100;handle.getBoundingClientRect=()=>({left,top:100,right:left+18,bottom:118,width:18,height:18});window.dispatchEvent(new Event('resize'));await pause(25);assert.equal(document.getElementById(id).style.visibility,'visible');left=-50;window.dispatchEvent(new Event('scroll'));await pause(25);assert.equal(document.getElementById(id).style.visibility,'hidden');state.visible=false;await nextTick();assert.equal(document.getElementById(id),null);state.visible=true;left=100;await nextTick();await pause(25);assert.equal(document.getElementById(id).style.visibility,'visible')
})
test('Tooltip position listeners and measurement observers are detached on unmount',async()=>{
 const add=window.addEventListener,remove=window.removeEventListener,tracked=new Set();let observers=0,disconnects=0;const oldObserver=globalThis.ResizeObserver;
 globalThis.ResizeObserver=class{constructor(){observers++}observe(){}disconnect(){disconnects++}};
 window.addEventListener=function(type,listener,...args){if(type==='scroll'||type==='resize')tracked.add(listener);return add.call(this,type,listener,...args)};
 window.removeEventListener=function(type,listener,...args){if(type==='scroll'||type==='resize')tracked.delete(listener);return remove.call(this,type,listener,...args)};
 try{const entry=await mount(ui.HysSlider,{modelValue:50,tooltipVisible:true});await pause(25);assert(tracked.size>0);entry.unmount();await pause(25);assert.equal(tracked.size,0);assert.equal(disconnects,observers);assert.equal(document.querySelector('.hys-ui-slider-tooltip'),null)}finally{window.addEventListener=add;window.removeEventListener=remove;if(oldObserver===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=oldObserver}
})
test('Moving slider tips follow in the same update without repeating ancestor style reads',async()=>{
 const entry=await mount(ui.HysSlider,{modelValue:40,tooltipVisible:true}),thumb=entry.find('[role=slider]'),handle=entry.find('.hys-ui-slider-handle'),tip=document.getElementById(thumb.getAttribute('aria-describedby'));handle.getBoundingClientRect=()=>({left:20+entry.props.modelValue*3,top:100,right:38+entry.props.modelValue*3,bottom:118,width:18,height:18});tip.getBoundingClientRect=()=>({left:0,top:0,right:160,bottom:30,width:160,height:30});window.dispatchEvent(new Event('resize'));await pause(25);const previous=Number.parseFloat(tip.style.left),read=globalThis.getComputedStyle;let calls=0;globalThis.getComputedStyle=(...args)=>{calls++;return read(...args)};try{await key(thumb,'ArrowRight');assert.equal(Number.parseFloat(tip.style.left),previous+3);for(let index=0;index<10;index++)await key(thumb,'ArrowRight');assert(calls<5,'Stable movement should reuse ancestor and theme styles')}finally{globalThis.getComputedStyle=read}
})
test('Form labels, inherited sizing/disabled states, errors and reset work with custom thumbs',async()=>{
 const model=reactive({volume:20}),entry=await mount(ui.HysForm,{model,size:'sm',rules:{volume:{type:'number',min:50,message:'At least 50'}}},{default:()=>h(ui.HysFormItem,{label:'Sound',prop:'volume'},()=>h(ui.HysSlider,{modelValue:model.volume,'onUpdate:modelValue':value=>model.volume=value,name:'volume'}))});assert(entry.find('.hys-ui-slider-sm'));assert.equal(await entry.vm.validate(),false);const thumb=entry.find('[role=slider]');assert.equal(thumb.getAttribute('aria-invalid'),'true');assert(document.getElementById(thumb.getAttribute('aria-describedby')));entry.find('label').click();assert.equal(document.activeElement,thumb);await key(thumb,'End');await pause(5);assert.equal(model.volume,100);assert.equal(await entry.vm.validate(),true);entry.vm.resetFields();await nextTick();assert.equal(model.volume,20);assert.equal(thumb.getAttribute('aria-valuenow'),'20');entry.props.disabled=true;await nextTick();assert.equal(thumb.getAttribute('aria-disabled'),'true')
})
test('Cached-page leave cancels frames and active pointer listeners while keeping accepted state',async()=>{
 const state=reactive({visible:true,value:30}),events=[],Wrapper=defineComponent({setup:()=>()=>h(KeepAlive,null,()=>state.visible?h(ui.HysSlider,{modelValue:state.value,'onUpdate:modelValue':v=>state.value=v,onChange:v=>events.push(v)}):h('div','Other'))}),entry=await mount(Wrapper);await pointer(entry.find('[role=slider]'),'pointerdown',110);await pointer(document,'pointermove',290);state.visible=false;await nextTick();await pause(30);await pointer(document,'pointerup',320);assert.equal(state.value,30);assert.deepEqual(events,[]);state.visible=true;await nextTick();await key(entry.find('[role=slider]'),'ArrowRight');assert.equal(state.value,31)
})
