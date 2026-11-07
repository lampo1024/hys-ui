async (page) => {
 const checks=[],check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name)};
 await page.goto('http://127.0.0.1:5175');const host=await page.locator('#host').evaluate(el=>({heading:getComputedStyle(el.querySelector('h1')).fontSize,button:getComputedStyle(el.querySelector('button')).backgroundColor,body:getComputedStyle(document.body).backgroundColor}));
 check('Host heading and button styles remain intact',host.heading==='31px'&&host.button==='rgb(110, 25, 70)'&&host.body==='rgb(250, 248, 245)');
 const theme=el=>el.closest('[data-hys-theme]')?.getAttribute('data-hys-theme');const trigger=page.getByRole('combobox');await trigger.click();const list=page.getByRole('listbox');await list.waitFor();check('Floating surface inherits green theme',(await list.evaluate(theme))==='green');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Open modal',exact:true}).click();const modal=page.getByRole('dialog',{name:'Independent modal'});await modal.waitFor();check('Modal applies green theme',(await modal.evaluate(theme))==='green');
 check('Modal traps focus',await modal.evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});check('Modal releases body scroll',await page.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'));
 await page.getByRole('button',{name:'Change theme',exact:true}).click();await trigger.click();await list.waitFor();check('Teleported theme updates reactively',(await list.evaluate(theme))==='dark');await page.keyboard.press('Escape');await page.screenshot({path:'output/playwright/independent-consumer.png'});return{checks};
}
