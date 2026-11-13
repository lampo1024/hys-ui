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

const {createApp,h,ref,reactive,nextTick,KeepAlive,defineComponent}=await import('vue')
const ui=await import('../packages/ui/dist/index.js')
const apps=[]
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const until=async(predicate)=>{const end=Date.now()+1200;while(!predicate()&&Date.now()<end)await wait(10);assert(predicate())}
const settle=async()=>{await nextTick();await Promise.resolve();await nextTick()}
const css=document.createElement('style');css.textContent='[class*="hys-ui-popup-"][class*="-active"]{transition-property:opacity;transition-duration:0.12s}';document.head.append(css)
afterEach(()=>{for(const {app,host}of apps.splice(0)){app.unmount();host.remove()}document.body.replaceChildren()})
async function popup(options={},config={}){const state=reactive({open:false,...options}),host=document.createElement('div');document.body.append(host);const app=createApp({setup(){ui.provideHysConfig(config);return()=>h(ui.HysPopover,{...state,'onUpdate:open':value=>state.open=value},{trigger:()=>h('button','Open'),default:()=>h('button','Action')})}});app.mount(host);apps.push({app,host});await settle();return{state,host,panel:()=>document.querySelector('.hys-ui-popover-panel')}}

test('Popup parameters are declared on every popup-bearing public component',()=>{
for(const short of ['Select','Autocomplete','TreeSelect','Cascader','DatePicker','DateRangePicker','ColorPicker','Mention','Popconfirm','Popover','Tooltip','ContextMenu','AvatarGroup','Calendar','Gantt','Table','DataGrid','Tree','Slider','CommandPalette','Tour']){const c=ui['Hys'+short];assert(c.props.popupTransition,short);assert(c.props.popupTransitionDuration,short);assert(![c.props.popupTransition.type].flat().includes(Boolean),short+' must not silently default the effect to false')}
})
for(const effect of ['scale','fade','slide','slide-fade'])test('Popup '+effect+' keeps its exit non-interactive and removes it afterwards',async()=>{
const p=await popup({popupTransition:effect,popupTransitionDuration:120});p.state.open=true;await settle();const panel=p.panel();assert(panel);assert(panel.classList.contains('hys-ui-popup-'+effect+'-enter-active'));assert.equal(panel.style.getPropertyValue('--hys-ui-popup-duration'),'120ms');await until(()=>!panel.className.includes('-enter-active'));p.state.open=false;await settle();assert(p.panel());assert.equal(panel.getAttribute('aria-hidden'),'true');assert(panel.inert);assert.equal(panel.style.pointerEvents,'none');await until(()=>!p.panel())
})
for(const [name,options,config]of [['none',{popupTransition:'none'},{}],['zero duration',{popupTransitionDuration:0},{}],['global off',{}, {motion:'off'}]])test(name+' disables both popup animations immediately',async()=>{
const p=await popup(options,config);p.state.open=true;await settle();assert(p.panel());assert(!p.panel().className.includes('-enter-active'));p.state.open=false;await settle();assert(!p.panel())
})
test('System reduced motion is honored on the first appearance',async()=>{
const original=window.matchMedia;window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});try{const p=await popup();p.state.open=true;await settle();assert(!p.panel().className.includes('-enter-active'));p.state.open=false;await settle();assert(!p.panel())}finally{window.matchMedia=original}
})
test('Rapid close and reopen restores focusable, interactive popup content',async()=>{
const p=await popup();p.state.open=true;await settle();p.state.open=false;await settle();p.state.open=true;await settle();await wait(190);const panels=[...document.querySelectorAll('.hys-ui-popover-panel')];assert.equal(panels.length,1);assert(!panels[0].inert);assert.notEqual(panels[0].getAttribute('aria-hidden'),'true');assert.notEqual(panels[0].style.pointerEvents,'none');panels[0].querySelector('button').focus();assert.equal(document.activeElement.textContent,'Action')
})
test('Closing an owning dialog removes a child popup without retaining its leave animation',async()=>{
const host=document.createElement('div');document.body.append(host);const open=ref(true),child=ref(true);const app=createApp({setup:()=>()=>h(ui.HysModal,{open:open.value,title:'Owner',transition:false},{default:()=>h(ui.HysPopover,{open:child.value,popupTransitionDuration:1500},{trigger:()=>h('button','Child'),default:()=>h('span','Popup content')})})});app.mount(host);apps.push({app,host});await settle();assert(document.querySelector('.hys-ui-popover-panel'));open.value=false;await settle();assert(!document.querySelector('.hys-ui-popover-panel'))
})
test('KeepAlive deactivation removes an entering popup and does not restore stale visibility',async()=>{
const host=document.createElement('div');document.body.append(host);const active=ref(true);const Child=defineComponent({setup:()=>()=>h(ui.HysPopover,{popupTransitionDuration:1000},{trigger:()=>h('button','Open cached'),default:()=>h('span','Cached popup')})});const app=createApp({setup:()=>()=>h(KeepAlive,null,{default:()=>active.value?h(Child):h('div','Other page')})});app.mount(host);apps.push({app,host});host.querySelector('button').click();await settle();assert(document.querySelector('.hys-ui-popover-panel'));active.value=false;await settle();assert(!document.querySelector('.hys-ui-popover-panel'));active.value=true;await settle();assert(!document.querySelector('.hys-ui-popover-panel'))
})
test('Positioning measures layout dimensions rather than the animated scaled rectangle',async()=>{
Object.defineProperty(document.documentElement,'clientWidth',{configurable:true,value:400});Object.defineProperty(document.documentElement,'clientHeight',{configurable:true,value:300});const p=await popup({placement:'top-start'});p.state.open=true;await settle();const panel=p.panel();Object.defineProperty(panel,'offsetHeight',{configurable:true,value:100});Object.defineProperty(panel,'offsetWidth',{configurable:true,value:200});panel.getBoundingClientRect=()=>({width:100,height:50,left:20,top:20,right:120,bottom:70,x:20,y:20});window.dispatchEvent(new Event('resize'));await wait(30);assert.equal(panel.style.top,'68px');assert.equal(panel.style.getPropertyValue('--hys-ui-popup-origin'),'top center');assert.equal(panel.style.left,'20px')
})
