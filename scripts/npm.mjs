import {execFileSync} from 'node:child_process'
import path from 'node:path'
export const registry='https://registry.npmjs.org/'
export function npm(args,options={}){
 const cli=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js')
 return execFileSync(process.execPath,[cli,...args],{encoding:'utf8',...options})
}
