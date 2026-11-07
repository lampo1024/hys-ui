async (page) => {
 await page.setViewportSize({width:390,height:844});
 const errors=[],results=[],listener=error=>errors.push(String(error));page.on('pageerror',listener);
 const links=await page.locator('.docs-sidebar nav a[href^="/components/"]').evaluateAll(elements=>elements.map(element=>element.getAttribute('href')));
 for(const href of links){await page.goto('http://127.0.0.1:5174'+href,{waitUntil:'domcontentloaded'});await page.locator('.doc-heading h1').waitFor();await page.locator('.example-card summary').first().click();await page.waitForFunction(()=>document.querySelector('.example-card details pre code')?.textContent.length>20);const measure=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth,headings:document.querySelectorAll('h1').length}));results.push({href,...measure})}
 page.off('pageerror',listener);
 return {pages:results.length,viewport:'390 × 844',failures:results.filter(result=>result.body>result.viewport+5||result.headings!==1),errors};
}
