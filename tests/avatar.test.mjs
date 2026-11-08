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

test('Avatar defaults to a themed user icon and supports numeric/preset sizes and shapes',async()=>{
 const entry=await mount(ui.HysAvatar,{alt:'User'});assert(entry.find('svg'));assert.equal(entry.find('[role=img]').style.width,'36px');assert.equal(entry.find('[role=img]').getAttribute('aria-label'),'User');entry.props.size='large';entry.props.shape='square';await nextTick();assert.equal(entry.find('[role=img]').style.width,'48px');assert.equal(entry.find('[role=img]').style.borderRadius,'8px');entry.props.size='sm';await nextTick();assert.equal(entry.find('[role=img]').style.width,'24px')
})
test('Text avatars retain Unicode characters, custom colors and icon slot priority',async()=>{
 const entry=await mount(ui.HysAvatar,{name:'😀叶子',color:'orange',textColor:'white'});assert.equal(entry.find('.hys-ui-avatar-text').textContent,'😀叶');assert.equal(entry.find('[role=img]').getAttribute('aria-label'),'😀叶子');assert.equal(entry.find('[role=img]').style.color,'white');entry.unmount();const Icon=defineComponent({setup:()=>()=>h('b','Icon')}),icon=await mount(ui.HysAvatar,{icon:Icon,name:'Icons'},{icon:()=>h('i','Slot')});assert(icon.find('i'));assert(!icon.find('b'))
})
test('Image attributes, load events and placeholder slots stay consistent',async()=>{
 let native=0;const entry=await mount(ui.HysAvatar,{src:'photo.png',srcset:'photo2.png 2x',sizes:'48px',crossOrigin:'anonymous',lazy:true,name:'Alex',imgProps:{referrerpolicy:'no-referrer',onLoad:()=>native++}},{placeholder:()=>h('i','Loading')});const image=entry.find('img');assert.equal(image.getAttribute('srcset'),'photo2.png 2x');assert.equal(image.getAttribute('loading'),'lazy');assert.equal(image.getAttribute('crossorigin'),'anonymous');assert.equal(image.getAttribute('referrerpolicy'),'no-referrer');assert.equal(image.getAttribute('draggable'),'false');assert(entry.find('.hys-ui-avatar-placeholder'));image.dispatchEvent(new Event('load'));await nextTick();assert.equal(native,1);assert.equal(entry.events.load[0][1].src,'photo.png');assert.equal(entry.events.load[0][1].fallback,false);assert(!entry.find('.hys-ui-avatar-placeholder'));assert.equal(entry.vm.loaded,true)
})
test('Image failures try the backup once and then use fallback content without a loop',async()=>{
 const entry=await mount(ui.HysAvatar,{src:'bad.png',fallbackSrc:'backup.png',name:'Alex'},{fallback:()=>h('b','Fallback')});entry.find('img').dispatchEvent(new Event('error'));await nextTick();assert.equal(entry.find('img').getAttribute('src'),'backup.png');entry.find('img').dispatchEvent(new Event('error'));await nextTick();assert(!entry.find('img'));assert.equal(entry.find('b').textContent,'Fallback');assert.equal(entry.events.error.length,2);assert.equal(entry.events.error[1][1].fallback,true);entry.vm.reload();await nextTick();assert.equal(entry.find('img').getAttribute('src'),'bad.png');assert.equal(entry.vm.failed,false)
})
test('A false loadError result preserves the source node and source changes retry',async()=>{
 const entry=await mount(ui.HysAvatar,{src:'bad.png',fallbackSrc:'backup.png',loadError:()=>false,name:'Alex'}),image=entry.find('img');image.dispatchEvent(new Event('error'));await nextTick();assert.equal(entry.find('img'),image);assert.equal(image.getAttribute('src'),'bad.png');assert.equal(entry.events.error.length,1);entry.props.src='good.png';await nextTick();assert.equal(entry.find('img').getAttribute('src'),'good.png');assert.equal(entry.vm.failed,false)
})
test('A retry requested from a failure callback is not overwritten by the old fallback',async()=>{
 for(const source of ['native','callback']){let entry,attempts=0;const retry=()=>{if(++attempts===1)entry.vm.reload()};entry=await mount(ui.HysAvatar,{src:'retry.png',name:'Retry',...(source==='native'?{imgProps:{onError:retry}}:{loadError:retry})});entry.find('img').dispatchEvent(new Event('error'));await nextTick();assert(entry.find('img'),'A requested retry must stay mounted');assert.equal(entry.vm.failed,false);entry.find('img').dispatchEvent(new Event('error'));await nextTick();assert(!entry.find('img'));entry.unmount()}
})
test('Load metadata still describes the completed backup when a callback requests a reload',async()=>{
 let entry;entry=await mount(ui.HysAvatar,{src:'primary.png',fallbackSrc:'backup.png',imgProps:{onLoad:()=>entry.vm.reload()}});entry.find('img').dispatchEvent(new Event('error'));await nextTick();entry.find('img').dispatchEvent(new Event('load'));await nextTick();assert.equal(entry.events.load[0][1].src,'backup.png');assert.equal(entry.events.load[0][1].fallback,true);assert.equal(entry.find('img').getAttribute('src'),'primary.png');assert.equal(entry.vm.loaded,false)
})
test('Stale image errors cannot replace a newly configured source',async()=>{
 const entry=await mount(ui.HysAvatar,{src:'old.png',name:'Alex'}),old=entry.find('img');entry.props.src='new.png';await nextTick();old.dispatchEvent(new Event('error'));await nextTick();assert(entry.find('img'));assert.equal(entry.find('img').getAttribute('src'),'new.png');assert.equal(entry.events.error,undefined)
})
test('Changing srcset also clears image failure state',async()=>{
 const entry=await mount(ui.HysAvatar,{src:'bad.png',srcset:'old.png 2x',name:'Alex'});entry.find('img').dispatchEvent(new Event('error'));await nextTick();assert(!entry.find('img'));entry.props.srcset='new.png 2x';await nextTick();assert(entry.find('img'));assert.equal(entry.find('img').getAttribute('srcset'),'new.png 2x')
})
test('Avatar supports srcset-only images and all native fit modes',async()=>{
 const entry=await mount(ui.HysAvatar,{srcset:'photo.png 1x',name:'Responsive image'});assert(entry.find('img'));assert.equal(entry.find('img').getAttribute('src'),null);for(const fit of ['cover','contain','fill','none','scale-down']){entry.props.fit=fit;await nextTick();assert.equal(entry.find('img').style.objectFit,fit)}
})
test('Responsive avatars share a viewport listener and release measurement observers',async()=>{
 const add=window.addEventListener,remove=window.removeEventListener,old=globalThis.ResizeObserver,tracked=new Set();let created=0,disconnected=0;globalThis.ResizeObserver=class{constructor(){created++}observe(){}disconnect(){disconnected++}};
 window.addEventListener=function(type,listener,...args){if(type==='resize')tracked.add(listener);return add.call(this,type,listener,...args)};window.removeEventListener=function(type,listener,...args){if(type==='resize')tracked.delete(listener);return remove.call(this,type,listener,...args)};
 try{const Wrapper=defineComponent({setup:()=>()=>h('div',Array.from({length:8},(_,index)=>h(ui.HysAvatar,{size:{xs:24,md:48},name:'User '+index})))}),entry=await mount(Wrapper);await nextTick();assert.equal(tracked.size,1);entry.unmount();await nextTick();assert.equal(tracked.size,0);assert.equal(created,disconnected)}finally{window.addEventListener=add;window.removeEventListener=remove;if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old}
})
test('Visible slot avatar references remain usable inside a group',async()=>{
 const avatar=ref(),entry=await mount(ui.HysAvatarGroup,{},{default:()=>[h(ui.HysAvatar,{ref:avatar,name:'Visible'})]});assert(avatar.value);assert.equal(typeof avatar.value.reload,'function');assert.equal(avatar.value.element,entry.find('.hys-ui-ex-avatar'))
})
test('Text auto fitting responds to gaps, content changes and the opt-out',async()=>{
 const entry=await mount(ui.HysAvatar,{size:40,gap:4,name:'Text'},{default:()=> 'A very long name'}),text=entry.find('.hys-ui-avatar-text');Object.defineProperty(text,'offsetWidth',{configurable:true,get:()=>160});window.dispatchEvent(new Event('resize'));await pause(25);assert.equal(text.style.transform,'scale(0.2)');entry.props.gap=8;await nextTick();await pause(25);assert.equal(text.style.transform,'scale(0.15)');entry.props.autoFit=false;await nextTick();await pause(25);assert.equal(text.style.transform,'scale(1)')
})
test('Responsive avatars choose the nearest configured viewport breakpoint',async()=>{
 const old=window.innerWidth;try{window.innerWidth=390;const entry=await mount(ui.HysAvatar,{size:{xs:24,md:48,xl:64},name:'Responsive'});assert.equal(entry.find('[role=img]').style.width,'24px');window.innerWidth=1000;window.dispatchEvent(new Event('resize'));await pause(25);await nextTick();assert.equal(entry.find('[role=img]').style.width,'48px');window.innerWidth=1300;window.dispatchEvent(new Event('resize'));await pause(25);await nextTick();assert.equal(entry.find('[role=img]').style.width,'64px')}finally{window.innerWidth=old;window.dispatchEvent(new Event('resize'))}
})
test('Avatar groups inherit shared sizes and shapes while explicit child props win',async()=>{
 const entry=await mount(ui.HysAvatarGroup,{size:48,shape:'square'},{default:()=>[h(ui.HysAvatar,{name:'First'}),h(ui.HysAvatar,{name:'Second',size:24,shape:'circle'})]}),avatars=entry.all('.hys-ui-ex-avatar');assert.equal(avatars[0].style.width,'48px');assert.equal(avatars[0].style.borderRadius,'8px');assert.equal(avatars[1].style.width,'24px');assert.equal(avatars[1].style.borderRadius,'50%');assert(avatars.every(el=>el.classList.contains('hys-ui-avatar-bordered')))
})
test('Collapsed groups do not mount hidden image sources until the popup opens',async()=>{
 const options=[{name:'Alex'},{name:'Lisa'},{name:'Amy',src:'hidden.png'},{name:'David'}],entry=await mount(ui.HysAvatarGroup,{options,maxCount:2,trigger:'click'});assert.equal(entry.all('.hys-ui-ex-avatar').length,3);assert.equal(entry.find('img'),null);const button=entry.find('button');assert.equal(button.textContent,'+2');button.click();await nextTick();await pause(0);const panel=document.querySelector('.hys-ui-avatar-group-popover');assert(panel);assert.equal(panel.querySelector('img').getAttribute('src'),'hidden.png');assert(panel.textContent.includes('Amy'));assert.equal(entry.events.visibleChange.at(-1)[0],true)
})
test('Overflow keyboard opening focuses the panel and Escape restores its trigger',async()=>{
 const entry=await mount(ui.HysAvatarGroup,{options:[{name:'A'},{name:'B'},{name:'C'}],maxCount:1,trigger:'click'}),button=entry.find('button');button.focus();await key(button,'ArrowDown');await pause(0);const panel=document.querySelector('.hys-ui-avatar-group-popover');assert.equal(document.activeElement,panel);await key(panel,'Escape');assert.equal(document.querySelector('.hys-ui-avatar-group-popover'),null);assert.equal(document.activeElement,button);assert.equal(button.getAttribute('aria-expanded'),'false')
})
test('Dynamic count and data changes update overflow and close removed triggers',async()=>{
 const entry=await mount(ui.HysAvatarGroup,{options:[{name:'A'},{name:'B'},{name:'C'}],maxCount:1,trigger:'click'});entry.find('button').click();await nextTick();entry.props.options.push({name:'D'});await nextTick();await pause(0);assert.equal(entry.find('button').textContent,'+3');assert.equal(document.querySelectorAll('.hys-ui-avatar-group-person').length,3);entry.props.maxCount=4;await nextTick();assert.equal(entry.find('button'),null);assert.equal(document.querySelector('.hys-ui-avatar-group-popover'),null)
})
test('Group options, default slots, custom counters and zero-count states work',async()=>{
 const entry=await mount(ui.HysAvatarGroup,{options:[{name:'A'},{name:'B'}],maxCount:0,maxStyle:{background:'orange'}},{overflow:({count})=>h('b','More '+count)});assert.equal(entry.all('.hys-ui-avatar-group-item').length,1);assert.equal(entry.find('b').textContent,'More 2');assert.equal(entry.find('.hys-ui-ex-avatar').style.background,'orange');entry.props.showOverflow=false;await nextTick();assert.equal(entry.find('button'),null);entry.unmount();const empty=await mount(ui.HysAvatarGroup,{options:[]},{empty:()=>h('i','No members')});assert.equal(empty.find('i').textContent,'No members')
})
test('Hover overlap expansion and vertical gaps are reversible',async()=>{
 const entry=await mount(ui.HysAvatarGroup,{options:[{name:'A'},{name:'B'}],vertical:true,gap:-8,expandOnHover:true});assert.equal(entry.all('.hys-ui-avatar-group-item')[1].style.marginTop,'-8px');entry.find('.hys-ui-avatar-group').dispatchEvent(new Event('pointerenter'));await nextTick();assert.equal(entry.all('.hys-ui-avatar-group-item')[1].style.marginTop,'0px');entry.find('.hys-ui-avatar-group').dispatchEvent(new Event('pointerleave'));await nextTick();assert.equal(entry.all('.hys-ui-avatar-group-item')[1].style.marginTop,'-8px')
})
test('Moving between a hover counter and its popup keeps it open',async()=>{
 const entry=await mount(ui.HysAvatarGroup,{options:[{name:'A'},{name:'B'}],maxCount:1}),button=entry.find('button');button.dispatchEvent(new Event('pointerenter'));await nextTick();await pause(0);const panel=document.querySelector('.hys-ui-avatar-group-popover');assert(panel);button.dispatchEvent(new Event('pointerleave'));panel.dispatchEvent(new Event('pointerenter'));await pause(100);assert(document.querySelector('.hys-ui-avatar-group-popover'));panel.dispatchEvent(new Event('pointerleave'));await pause(95);assert.equal(document.querySelector('.hys-ui-avatar-group-popover'),null)
})
test('Cached-page leave removes overflow panels and delayed hover timers',async()=>{
 const state=reactive({visible:true}),Wrapper=defineComponent({setup:()=>()=>h(KeepAlive,null,()=>state.visible?h(ui.HysAvatarGroup,{options:[{name:'A'},{name:'B'}],maxCount:1}):h('div','Other'))}),entry=await mount(Wrapper);entry.find('button').dispatchEvent(new Event('pointerenter'));await nextTick();await pause(0);assert(document.querySelector('.hys-ui-avatar-group-popover'));state.visible=false;await nextTick();await pause(100);assert.equal(document.querySelector('.hys-ui-avatar-group-popover'),null);state.visible=true;await nextTick();assert(entry.find('button'))
})

