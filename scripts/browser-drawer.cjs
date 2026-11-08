async(page)=>{
 const checks=[],check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name)};await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5174/components/hys-drawer');const configure=page.locator('#scene-configure');await configure.getByRole('button',{name:'打开抽屉',exact:true}).waitFor();
 check('Configuration uses custom checkboxes',await configure.locator('.hys-ui-checkbox-box').count()>0);
 for(const fullscreen of [false,true]){
  await configure.getByRole('checkbox',{name:'fullscreen',exact:true}).setChecked(fullscreen);
  for(const placement of ['left','top','bottom','right']){
   await configure.locator('.demo-field').filter({hasText:'placement'}).getByRole('combobox').click();await page.getByRole('option',{name:placement,exact:true}).click();await configure.getByRole('button',{name:'打开抽屉',exact:true}).click();const panel=page.locator('.hys-ui-drawer[role="dialog"]');await panel.waitFor();await page.waitForFunction(()=>!document.querySelector('.hys-ui-drawer-motion-enter-active'));
   const result=await panel.evaluate(el=>{const box=el.getBoundingClientRect(),overlay=el.parentElement,vectors=[];for(const phase of ['enter-from','leave-to']){const name='hys-ui-drawer-motion-'+phase;overlay.classList.add(name);const m=new DOMMatrixReadOnly(getComputedStyle(el).transform);vectors.push([m.m41,m.m42]);overlay.classList.remove(name)}return{vectors,x:box.x,y:box.y,w:box.width,h:box.height,vw:document.documentElement.clientWidth,vh:innerHeight}});
   check(placement+(fullscreen?' fullscreen':'')+' enter and leave direction',result.vectors.every(([x,y])=>placement==='left'?x<0&&Math.abs(y)<1:placement==='right'?x>0&&Math.abs(y)<1:placement==='top'?y<0&&Math.abs(x)<1:y>0&&Math.abs(x)<1));
   check(placement+(fullscreen?' fullscreen':'')+' placement and size',fullscreen?Math.abs(result.w-result.vw)<2&&Math.abs(result.h-result.vh)<2:placement==='left'?Math.abs(result.x)<2:placement==='right'?Math.abs(result.x+result.w-result.vw)<2:placement==='top'?Math.abs(result.y)<2&&Math.abs(result.w-result.vw)<2:Math.abs(result.y+result.h-result.vh)<2&&Math.abs(result.w-result.vw)<2);
   await panel.getByRole('button',{name:'关闭',exact:true}).click();await panel.waitFor({state:'hidden'});
  }
 }
 check('Closing restores page scrolling',await page.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'));return{checks};
}
