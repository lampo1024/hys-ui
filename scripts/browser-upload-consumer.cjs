async (page) => {
 const checks=[],errors=[],warnings=[],requests=[];let pending;
 const check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name);};
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='warning'&&message.text().includes('[Vue warn]'))warnings.push(message.text());});
 const until=async fn=>{for(let i=0;i<200;i++){if(await fn())return;await page.waitForTimeout(30);}throw Error('Condition timed out');};
 const file=(name='document.txt',text='protocol bytes')=>({name,mimeType:'text/plain',buffer:Buffer.from(text)});
 try{
  await page.route('**/upload-protocol',async route=>{requests.push({method:route.request().method(),headers:route.request().headers(),body:route.request().postDataBuffer()?.toString()});if(requests.length===1)await route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message:'Try again'})});else if(requests.length===2)await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'saved'})});else pending=route;});
  await page.goto('http://127.0.0.1:5175');const fixture=page.locator('#upload-fixture');await fixture.waitFor();
  const upload=fixture.locator('.hys-ui-upload'),local=upload.nth(0),remote=upload.nth(1),business=upload.nth(2),protocol=upload.nth(3);
  check('Installed tarball mounts generic Upload instances',await upload.count()===4);
  check('Host button style stays isolated',await page.locator('#host .btn').evaluate(el=>getComputedStyle(el).backgroundColor==='rgb(110, 25, 70)'));
  check('Remote entries render without raw File data',(await remote.innerText()).includes('saved.pdf'));
  await local.locator('input[type=file]').setInputFiles(file('local.txt'));await until(async()=>await local.locator('li.hys-ui-upload-file-success').count()===1);
  check('Default generic callbacks and slots receive the original raw file',(await local.innerText()).includes('local.txt'));
  await local.getByRole('button',{name:'local.txt',exact:true}).click();await until(async()=>await local.locator('li').count()===0);check('Typed custom-item removal actions work in the installed package',true);
  await business.locator('input[type=file]').setInputFiles(file('business.txt'));await until(async()=>await business.locator('li').count()===1);check('createFile preserves extra required business metadata',await business.locator('.hys-ui-upload-file-content').evaluate(el=>/[0-9a-f]{8}-[0-9a-f-]{27,}/.test(el.textContent)));
  await protocol.locator('input[type=file]').setInputFiles(file());await until(async()=>await protocol.locator('li.hys-ui-upload-file-error').count()===1);
  check('Real browser XHR reports the HTTP failure',requests[0].method==='PUT'&&(await protocol.innerText()).includes('403'));
  const sent=requests[0];check('The browser builds a valid multipart boundary',sent.headers['content-type'].startsWith('multipart/form-data; boundary='));check('Request headers and repeated extra fields reach the transport',sent.headers['x-upload-test']==='consumer'&&(sent.body.match(/name="tags"/g)||[]).length===2&&sent.body.includes('name="document"'));
  check('Transformed bytes, filename and file field are transmitted',sent.body.includes('name="attachment"; filename="converted.txt"')&&sent.body.includes('protocol bytes converted'));
  await protocol.getByRole('button',{name:'重试document.txt',exact:true}).click();await until(async()=>await protocol.locator('li.hys-ui-upload-file-success').count()===1);check('Default XHR retry reaches success without duplicating the entry',requests.length===2&&await protocol.locator('li').count()===1);
  await protocol.locator('input[type=file]').setInputFiles(file('cancelled.txt'));await until(async()=>!!pending);await protocol.getByRole('button',{name:'取消上传cancelled.txt',exact:true}).click();await until(async()=>await protocol.locator('li.hys-ui-upload-file-ready').count()===1);await pending.fulfill({status:200,contentType:'application/json',body:'{"late":true}'}).catch(()=>{});check('Cancellation prevents a late HTTP response from changing the entry',await protocol.locator('li.hys-ui-upload-file-success').count()===1);
  check('No installed-package runtime errors',errors.length===0);check('No installed-package Vue warnings',warnings.length===0);return{checks,errors,warnings};
 }catch(error){return{error:String(error),checks,errors,warnings};}
}
