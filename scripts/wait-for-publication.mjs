const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))

export async function waitForPublication({name,version,integrity,registry,timeoutMs=20*60*1000,intervalMs=15000,request=globalThis.fetch}){
 const deadline=Date.now()+timeoutMs
 for(;;){
  const url=new URL(encodeURIComponent(name)+'/'+encodeURIComponent(version),registry)
  url.searchParams.set('publication-check',String(Date.now()))
  const response=await request(url,{headers:{Accept:'application/json','Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)})
  if(response.ok){
   const metadata=await response.json()
   if(metadata.version!==version||metadata.dist?.integrity!==integrity)throw Error('Published archive does not match the tested version and integrity')
   return metadata
  }
  if(response.status!==404&&response.status!==429&&response.status<500)throw Error('Registry verification failed with HTTP '+response.status)
  if(Date.now()>=deadline)throw Error('Publication was accepted but the version is not available yet. Check npm scanning status before attempting another publish.')
  await delay(intervalMs)
 }
}
