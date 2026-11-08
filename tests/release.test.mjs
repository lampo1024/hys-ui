import {test} from 'node:test'
import assert from 'node:assert/strict'
import {waitForPublication} from '../scripts/wait-for-publication.mjs'

const options={name:'hys-ui',version:'0.1.1',integrity:'sha512-tested',registry:'https://registry.npmjs.org/',intervalMs:1,timeoutMs:1000}
test('Publication waits for scanning availability and verifies the same archive',async()=>{
 const statuses=[404,503,200],requests=[]
 const metadata=await waitForPublication({...options,request:async url=>{requests.push(String(url));const status=statuses.shift();return status===200?Response.json({name:'hys-ui',version:'0.1.1',dist:{integrity:'sha512-tested'}}):new Response('',{status})}})
 assert.equal(requests.length,3);assert(requests.every(url=>url.startsWith('https://registry.npmjs.org/hys-ui/0.1.1?publication-check=')));assert.equal(metadata.dist.integrity,options.integrity)
})
test('Publication rejects mismatched public bytes instead of reporting success',async()=>{
 await assert.rejects(waitForPublication({...options,request:async()=>Response.json({version:'0.1.1',dist:{integrity:'sha512-other'}})}),/does not match/)
})
test('Publication timeout reports pending availability and does not publish again',async()=>{
 let requests=0;await assert.rejects(waitForPublication({...options,timeoutMs:0,request:async()=>{requests++;return new Response('',{status:404})}}),/Check npm scanning status/);assert.equal(requests,1)
})
