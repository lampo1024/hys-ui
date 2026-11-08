import {computed,getCurrentInstance,inject,provide,toValue,type InjectionKey,type MaybeRefOrGetter} from 'vue'
export type HysTheme='blue'|'dark'|'green'|'purple'|'orange'|'forest'
export type HysMotion='full'|'subtle'|'off'
export interface HysConfig {theme?:MaybeRefOrGetter<HysTheme>;motion?:MaybeRefOrGetter<HysMotion>}
const key:InjectionKey<HysConfig>=Symbol('hys-ui-config')
const localConfigs=new WeakMap<object,HysConfig>()
/** Call in a component setup. Reactive options are inherited by children and teleported panels. */
export function provideHysConfig(config:HysConfig){const parent=useHysConfig(),next={theme:config.theme??parent.theme,motion:config.motion??parent.motion};provide(key,next);const instance=getCurrentInstance();if(instance)localConfigs.set(instance,next)}
export function useHysConfig(){const instance=getCurrentInstance();return instance&&localConfigs.get(instance)||inject(key,{})}
export function useHysRootAttrs(){
 const config=useHysConfig()
 return computed(()=>{const theme=toValue(config.theme),motion=toValue(config.motion);return {'data-hys-ui':'','data-hys-theme':theme&&['blue','dark','green','purple','orange','forest'].includes(theme)?theme:'blue','data-hys-motion':motion&&['full','subtle','off'].includes(motion)?motion:'subtle'}})
}
