async (page) => {
 const checks=[];const check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name)};
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5174/components/hys-mention');
 const input=page.locator('.example-stage').first().getByRole('combobox');await input.fill('请联系 @');
 const popup=page.getByRole('listbox',{name:'提及候选成员'});await popup.waitFor();
 const initial=await input.boundingBox(),list=await popup.boundingBox();check('Candidates anchor beside mention',list.x>initial.x+30&&list.y<initial.y+initial.height);
 await input.fill('第一行\n请联系 @ 后续内容');await input.evaluate(el=>{el.setSelectionRange(9,9);el.dispatchEvent(new MouseEvent('click',{bubbles:true}))});await popup.waitFor();
 await popup.getByRole('option',{name:'张工',exact:true}).click();check('Selection preserves suffix',(await input.inputValue())==='第一行\n请联系 @张工 后续内容');
 await input.fill('第一行\n第二行\n第三行\n第四行\n请联系 @');await popup.waitFor();const lower=await popup.boundingBox();await input.evaluate(el=>{el.scrollTop=0;el.dispatchEvent(new Event('scroll'))});await page.waitForTimeout(60);const scrolled=await popup.boundingBox();check('Scroll updates caret anchor',Math.abs(lower.y-scrolled.y)>10);
 const spacing=await page.locator('.state-output').first().evaluate(el=>getComputedStyle(el).marginTop);check('State output separated by 20px',spacing==='20px');
 await input.fill('请联系 @');await popup.waitFor();await page.screenshot({path:'output/playwright/mention-caret.png'});
 await page.setViewportSize({width:390,height:844});await input.fill('请联系同事同事同事 @');await popup.waitFor();const mobile=await popup.boundingBox();check('Mobile popup stays in viewport',mobile.x>=0&&mobile.x+mobile.width<=390);
 await page.screenshot({path:'output/playwright/mention-mobile.png'});return {checks};
}
