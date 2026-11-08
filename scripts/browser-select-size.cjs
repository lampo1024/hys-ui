async page=>{
 const checks=[],errors=[],sizes={sm:{font:12,row:30,icon:13},md:{font:14,row:36,icon:15},lg:{font:15,row:42,icon:17}}
 const check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name)}
 page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width:1440,height:1000})
 const metrics=async trigger=>{
   const control=await trigger.evaluate(element=>({font:parseFloat(getComputedStyle(element).fontSize),rect:element.getBoundingClientRect().toJSON()}))
   const panel=await page.locator('.hys-ui-select-options').evaluate(element=>{const option=element.querySelector('[role="option"]'),search=element.querySelector('.hys-ui-select-search'),icon=element.querySelector('[aria-selected="true"] svg');return {size:element.dataset.size,font:parseFloat(getComputedStyle(option).fontSize),row:option.getBoundingClientRect().height,icon:icon?.getBoundingClientRect().width,searchFont:search?parseFloat(getComputedStyle(search).fontSize):null,searchHeight:search?.getBoundingClientRect().height,rect:element.getBoundingClientRect().toJSON(),marker:element.dataset.sizeTestMarker}})
   return {control,panel}
 }
 await page.goto('http://127.0.0.1:5174/components/hys-form');await page.locator('#scene-configure form').waitFor()
 const configure=page.locator('#scene-configure'),sizeControl=configure.getByRole('combobox',{name:'控件尺寸 size',exact:true}),role=configure.getByRole('combobox',{name:'角色',exact:true})
 for(const [size,expected] of Object.entries(sizes)){
   await sizeControl.click();await page.getByRole('option',{name:size,exact:true}).click();await role.click()
   const {control,panel}=await metrics(role)
   check('Form '+size+' popup typography matches its trigger',panel.size===size&&panel.font===expected.font&&control.font===expected.font)
   check('Form '+size+' option row and icon follow its size',Math.abs(panel.row-expected.row)<1&&Math.abs(panel.icon-expected.icon)<1)
   await page.keyboard.press('Escape')
 }
 await sizeControl.click();await page.getByRole('option',{name:'sm',exact:true}).click();await role.click()
 await page.locator('.hys-ui-select-options').evaluate(panel=>panel.dataset.sizeTestMarker='kept-open')
 // Move focus without an outside pointer event, then use the size control's
 // keyboard API. This changes the form size while the existing popup stays open.
 await sizeControl.focus();await sizeControl.press('ArrowDown');await sizeControl.press('End');await sizeControl.press('Enter');await page.waitForTimeout(60)
 const live=await metrics(role)
 check('An open popup updates in place when the form size changes',live.panel.marker==='kept-open'&&live.panel.size==='lg'&&live.panel.font===15&&Math.abs(live.panel.row-42)<1)
 check('Size change also recomputes floating placement',Math.min(Math.abs(live.panel.rect.top-live.control.rect.bottom-8),Math.abs(live.control.rect.top-live.panel.rect.bottom-8))<2)
 await page.screenshot({path:'output/playwright/select-size-form.png'});await page.keyboard.press('Escape')
 await page.goto('http://127.0.0.1:5174/components/hys-select');await page.locator('#scene-configure .demo-content').waitFor()
 const selectConfig=page.locator('#scene-configure')
 await selectConfig.getByRole('checkbox',{name:'filterable',exact:true}).check()
 const directSize=selectConfig.locator('.demo-controls').getByRole('combobox'),target=selectConfig.locator('.demo-content').getByRole('combobox').first()
 for(const [size,expected] of Object.entries(sizes)){
   await directSize.click();await page.getByRole('option',{name:size,exact:true}).click();await target.click()
   const {panel}=await metrics(target)
   check('Direct '+size+' options and search input use the same typography',panel.font===expected.font&&panel.searchFont===expected.font)
   check('Direct '+size+' search input scales with the option rows',Math.abs(panel.row-expected.row)<1&&Math.abs(panel.searchHeight-expected.row)<1)
   await page.keyboard.press('Escape')
 }
 await page.setViewportSize({width:390,height:844});await target.click()
 const mobile=await metrics(target)
 check('Sized popup remains inside a narrow viewport',mobile.panel.rect.left>=8&&mobile.panel.rect.right<=390-8)
 check('No runtime errors',errors.length===0)
 return {checks,errors}
}
