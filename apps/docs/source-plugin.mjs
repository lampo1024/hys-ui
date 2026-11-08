import fs from 'node:fs/promises'
import path from 'node:path'
import { format } from 'prettier'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

let highlighter
export async function renderExampleSource(source, filename) {
  const code=await format(source,{parser:'vue',singleQuote:true,semi:false,printWidth:88,singleAttributePerLine:true,htmlWhitespaceSensitivity:'ignore'})
  highlighter??=createHighlighterCore({langs:[import('shiki/langs/vue.mjs')],themes:[import('shiki/themes/github-dark.mjs')],engine:createJavaScriptRegexEngine()})
  const html=(await highlighter).codeToHtml(code.trimEnd(),{lang:'vue',theme:'github-dark'})
  return{code,html,filename:path.basename(filename),lines:code.trimEnd().split('\n').length}
}
export default function exampleSourcePlugin(){
  const cache=new Map()
  return{name:'hys-docs-example-source',enforce:'pre',async load(id){
    const index=id.indexOf('?');if(index<0||!new URLSearchParams(id.slice(index+1)).has('example-source'))return
    const filename=id.slice(0,index);this.addWatchFile(filename)
    const source=await fs.readFile(filename,'utf8'),cached=cache.get(filename)
    if(cached?.source===source)return cached.output
    const output='export default '+JSON.stringify(await renderExampleSource(source,filename))
    cache.set(filename,{source,output});return output
  }}
}
