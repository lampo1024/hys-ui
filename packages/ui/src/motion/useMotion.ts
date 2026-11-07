import {computed,onMounted,onBeforeUnmount,ref,toValue} from 'vue'
import {useHysConfig} from '../config'
export function useMotion(){
 const config=useHysConfig(),reduced=ref(false)
 let media:MediaQueryList|undefined
 const update=()=>{reduced.value=!!media?.matches}
 onMounted(()=>{media=window.matchMedia('(prefers-reduced-motion: reduce)');update();media.addEventListener('change',update)})
 onBeforeUnmount(()=>media?.removeEventListener('change',update))
 return {effectiveMotion:computed(()=>reduced.value?'off':toValue(config.motion)||'subtle')}
}
