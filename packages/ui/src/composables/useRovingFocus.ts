import { ref, computed } from 'vue'
/** Keyboard focus management for finite lists; skip disabled items. */
export function useRovingFocus<T>(items:()=>T[], disabled:(item:T)=>boolean=()=>false){
 const index=ref(0)
 const enabled=computed(()=>items().map((x,i)=>({x,i})).filter(({x})=>!disabled(x)).map(({i})=>i))
 function move(direction:1|-1){const values=enabled.value;if(!values.length)return -1;const pos=values.indexOf(index.value);index.value=values[(pos+direction+values.length)%values.length];return index.value}
 function first(){index.value=enabled.value[0]??0;return index.value}
 function last(){index.value=enabled.value.at(-1)??0;return index.value}
 return {index,move,first,last}
}
