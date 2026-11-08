async (page) => {
 const errors=[],results=[];
 const listener=error=>errors.push(String(error));page.on('pageerror',listener);
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:5174/components/hys-button',{waitUntil:'domcontentloaded'});
 await page.locator('.docs-sidebar nav a[href^="/components/"]').first().waitFor({state:'attached'});
 const links=await page.locator('.docs-sidebar nav a[href^="/components/"]').evaluateAll(elements=>elements.map(element=>element.getAttribute('href')));
 if(!links.length)throw Error('Component navigation did not load');
 for(const href of links){
  const begin=errors.length;
  await page.goto('http://127.0.0.1:5174'+href,{waitUntil:'domcontentloaded'});
  await page.locator('h1').waitFor();
  await page.locator('.example-stage').first().locator('[data-hys-ui]').first().waitFor();
  await page.locator('.example-card summary').first().click();
  await page.waitForFunction(()=>document.querySelector('.example-card details pre code')?.textContent.length>20);
  results.push({href,scenarios:await page.locator('.example-card').count(),errors:errors.slice(begin),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+5)});
 }
 page.off('pageerror',listener);
 return JSON.stringify({pages:results.length,failures:results.filter(result=>result.errors.length||result.scenarios<2||result.overflow),totalErrors:errors},null,2);
}
