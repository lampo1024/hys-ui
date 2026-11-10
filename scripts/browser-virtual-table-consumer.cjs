async page=>{
  const checks=[],errors=[],warnings=[],check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name)}
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',e=>{if(e.type()==='warning'&&e.text().includes('[Vue warn]'))warnings.push(e.text())})
  try{
    await page.setViewportSize({width:1024,height:850})
    await page.goto('http://127.0.0.1:5175/')
    const fixture=page.locator('#virtual-table-fixture'),grid=fixture.getByRole('grid',{name:'Installed inventory table',exact:true})
    await grid.waitFor()
    const body=grid.locator('.hys-ui-virtual-space [role=row]')
    check('Installed table has bounded rendered rows',await body.count()<22)
    check('Standalone host styles stay unchanged',await page.locator('#host h1').evaluate(e=>getComputedStyle(e).fontSize==='31px'&&getComputedStyle(e).marginTop==='19px'))
    check('Scoped library styles are present',await grid.locator('.hys-ui-v4-table-row').first().evaluate(e=>getComputedStyle(e).display==='flex'))
    check('Green theme is inherited',await grid.getAttribute('data-hys-theme')==='green')
    await fixture.getByRole('button',{name:'Locate inventory row',exact:true}).click()
    check('Public instance locates nested-field record',await grid.evaluate(g=>document.getElementById(g.getAttribute('aria-activedescendant'))?.textContent==='Inventory 999'&&document.activeElement===g))
    await grid.press('Space')
    check('Controlled selection uses typed key',(await grid.locator('.hys-ui-virtual-footer').innerText()).includes('Selected 999'))
    await grid.getByRole('button',{name:'Stock升序',exact:true}).click()
    check('Controlled sort changes data order',await body.first().getAttribute('data-row-key')==='number:1999')
    await fixture.getByRole('button',{name:'Change inventory theme',exact:true}).click()
    check('Standalone theme switches to dark',await grid.getAttribute('data-hys-theme')==='dark')
    check('Installed scroll area maintains column widths',await grid.locator('.hys-ui-v4-table-viewport').evaluate(e=>e.scrollWidth>e.clientWidth&&e.scrollHeight>e.clientHeight))
    check('No runtime errors',errors.length===0)
    check('No Vue warnings',warnings.length===0)
    return {checks,errors,warnings}
  }catch(error){return {error:String(error),checks,errors,warnings}}
}
