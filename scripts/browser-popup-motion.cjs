async (page) => {
 const base=page.url().includes('github.io')?new URL(page.url()).origin+'/hys-ui':'http://127.0.0.1:5174',checks=[],errors=[],warnings=[];
 const check=(name,ok)=>{checks.push({name,pass:!!ok});if(!ok)throw Error(name)};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='warning'&&e.text().includes('[Vue warn]'))warnings.push(e.text())});page.setDefaultTimeout(20000);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:1000});
 const go=async(short)=>{await page.goto(base+'/components/hys-'+short.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+'/');const s=page.locator('#scene-popupmotion');await s.waitFor();await s.scrollIntoViewIfNeeded();await s.getByRole('spinbutton',{name:'浮层动效时长'}).fill('400');await s.getByRole('spinbutton',{name:'浮层动效时长'}).press('Tab');return s};
 const verify=async(short,selector,open,close)=>{const s=await go(short);await open(s);const p=page.locator(selector).filter({visible:true}).last();await p.waitFor();const node=await p.elementHandle();const state=await p.evaluate(el=>({classes:el.className,duration:el.style.getPropertyValue('--hys-ui-popup-duration'),theme:el.getAttribute('data-hys-theme')}));check(short+' uses configured popup motion',state.duration==='400ms'&&state.classes.includes('hys-ui-popup-motion'));await page.waitForTimeout(460);const rect=await p.boundingBox();check(short+' stays within viewport',rect&&rect.x>=-1&&rect.x+rect.width<=1441);await(close?close(s,p):page.keyboard.press('Escape'));await page.waitForTimeout(20);if(await node.evaluate(el=>el.isConnected)){check(short+' becomes inert immediately on exit',await node.evaluate(el=>el.inert&&el.getAttribute('aria-hidden')==='true'));}await page.waitForFunction(el=>!el.isConnected,node);check(short+' finishes exit without orphan popup',true);return s};
 try {
  await verify('select','.hys-ui-select-options',s=>s.locator('.demo-content [role=combobox]').click());
  await verify('autocomplete','.hys-ui-autocomplete-popup',s=>s.locator('.demo-content input').first().focus());
  await verify('treeSelect','.hys-ui-tree-select-menu',s=>s.locator('.demo-content [role=combobox]').click());
  await verify('cascader','.hys-ui-cascader-menu:not(.hys-ui-cascader-inline)',s=>s.locator('.demo-content [role=combobox]').click());
  await verify('datePicker','.hys-ui-date-popup:not(.hys-ui-date-inline)',s=>s.locator('.demo-content [role=combobox]').click());
  await verify('dateRangePicker','.hys-ui-date-popup',s=>s.locator('.demo-content [role=combobox]').click());
  await verify('colorPicker','.hys-ui-pf-color-panel',s=>s.getByRole('button',{name:'品牌色',exact:true}).click());
  await verify('mention','.hys-ui-mention-list',s=>s.locator('.demo-content textarea').fill('@'));
  await verify('popover','.hys-ui-popover-panel',s=>s.getByRole('button',{name:'打开操作面板',exact:true}).last().click());
  await verify('tooltip','.hys-ui-tooltip-bubble',s=>s.getByRole('button',{name:'上方提示',exact:true}).hover());
  await verify('contextMenu','.hys-ui-ent-context',s=>s.locator('.popup-demo-target').click({button:'right'}));
  await verify('avatarGroup','.hys-ui-avatar-group-popover',s=>s.locator('.demo-content button').first().click());
  await verify('slider','.hys-ui-slider-tooltip',s=>s.locator('.demo-content [role=slider]').hover(),async s=>{await page.mouse.move(0,0);await s.locator('h2').click()});
  await verify('calendar','.hys-ui-calendar-popup',s=>s.locator('.hys-ui-calendar-more').first().click());
  await verify('table','.hys-ui-table-filter-panel',s=>s.locator('.demo-content .hys-ui-table-filter').first().click());
  await verify('dataGrid','.hys-ui-pf-grid-panel',s=>s.getByRole('button',{name:'配置显示列'}).click(),s=>s.getByRole('button',{name:'配置显示列'}).click());
  await verify('tree','.hys-ui-tree-context',s=>s.locator('.demo-content [role=treeitem]').first().click({button:'right'}));
  await verify('gantt','.hys-ui-pg-dependency-picker',async s=>{const el=s.locator('.hys-ui-pg-incoming-trigger').last();await el.focus();await el.press('Enter')});
  await verify('commandPalette','.hys-ui-v4-backdrop',s=>s.getByRole('button',{name:/快捷命令/}).click());
  const tour=await go('tour');await tour.getByRole('button',{name:'开始引导'}).click();const guide=page.getByRole('dialog',{name:'欢迎',exact:true});await guide.waitFor();check('Tour inherits configurable modal animation',await guide.evaluate(el=>el.closest('.hys-ui-modal-overlay').className.includes('hys-ui-modal-scale')));await page.keyboard.press('Escape');await guide.waitFor({state:'hidden'});
  let s=await go('select');const trigger=s.locator('.demo-content [role=combobox]');
  for(const [label,effect]of [['柔和缩放','scale'],['淡入淡出','fade'],['轻移','slide'],['轻移缩放','slide-fade'],['无动画','none']]){await s.getByRole('combobox',{name:'浮层动效',exact:true}).click();await page.getByRole('option',{name:label,exact:true}).click();await page.waitForTimeout(200);await trigger.click();const p=page.locator('.hys-ui-select-options:not([aria-hidden=true])');await p.waitFor();const classes=await p.getAttribute('class');check('Effect '+effect+' is selectable',effect==='none'?!classes.includes('-enter-active'):classes.includes('hys-ui-popup-'+effect+'-enter-active'));await page.keyboard.press('Escape');await p.waitFor({state:'hidden'});}
  await s.getByRole('combobox',{name:'浮层动效',exact:true}).click();await page.getByRole('option',{name:'柔和缩放',exact:true}).click();await page.waitForTimeout(200);
  await trigger.click();await page.keyboard.press('Escape');await trigger.click();await page.waitForTimeout(480);check('Rapid reopening restores a single interactive popup',await page.locator('.hys-ui-select-options:not([inert])').count()===1&&await page.locator('.hys-ui-select-options[inert]').count()===0);await page.keyboard.press('Escape');await page.waitForTimeout(480);
  await page.emulateMedia({reducedMotion:'reduce'});await trigger.click();check('Reduced motion skips the first entrance',!(await page.locator('.hys-ui-select-options:not([inert])').getAttribute('class')).includes('-enter-active'));await page.keyboard.press('Escape');check('Reduced motion removes exits immediately',await page.locator('.hys-ui-select-options').count()===0);await page.emulateMedia({reducedMotion:'no-preference'});
  await trigger.click();await page.locator('.docs-sidebar').getByRole('link',{name:'Input 文本输入',exact:true}).click();await page.locator('h1').filter({hasText:'HysInput'}).waitFor();await page.waitForTimeout(150);check('Navigation immediately clears cached page popups',await page.locator('.hys-ui-select-options').count()===0);
  s=await go('select');await s.screenshot({path:'output/playwright/popup-motion-desktop.png'});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await s.scrollIntoViewIfNeeded();check('Motion configuration fits mobile viewport',await s.evaluate(el=>el.scrollWidth<=el.clientWidth+1));await s.screenshot({path:'output/playwright/popup-motion-mobile.png'});
  check('No browser errors',errors.length===0);check('No Vue warnings',warnings.length===0);return{checks,errors,warnings};
 }catch(error){return{error:String(error),url:page.url(),checks,errors,warnings,body:(await page.locator('body').innerText()).slice(-3000)}}
}
