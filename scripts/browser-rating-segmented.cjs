async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    warnings = []
  const check = (name, pass) => {
      checks.push({ name, pass: !!pass })
      if (!pass) throw Error(name)
    },
    scene = (name) => page.locator("#scene-" + name),
    text = (name) => scene(name).locator("output").first().textContent()
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "warning" && message.text().includes("[Vue warn]"))
      warnings.push(message.text())
  })
  page.setDefaultTimeout(10000)
  await page.addInitScript(() => {
    const Original = window.ResizeObserver
    window.__segmentObservers = new Set()
    window.ResizeObserver = class extends Original {
      observe(target, options) {
        super.observe(target, options)
        if (target.classList.contains("hys-ui-ex-segment"))
          window.__segmentObservers.add(this)
      }
      disconnect() {
        window.__segmentObservers.delete(this)
        super.disconnect()
      }
    }
  })
  await page.setViewportSize({ width: 1680, height: 1000 })
  const visit = async (name, slug) => {
    await page.goto(base + "/components/" + slug)
    await page.locator("h1").filter({ hasText: name }).waitFor()
    await scene("basic").locator("button").first().waitFor()
  }
  const pick = async (slider, index, fraction = 0.8) => {
    const button = slider.locator("button").nth(index),
      box = await button.boundingBox()
    await button.click({
      position: { x: box.width * fraction, y: box.height / 2 },
    })
  }
  try {
    await visit("HysRating", "hys-rating")
    const rating = scene("basic").getByRole("slider", {
      name: "体验评分",
      exact: true,
    })
    await pick(rating, 3)
    check("Rating submits selected scores", (await text("basic")).includes("4"))
    await pick(rating, 3)
    check(
      "Rating clears on repeated selection",
      (await rating.getAttribute("aria-valuenow")) === "0",
    )
    check(
      "Uncontrolled rating default is preserved",
      (await scene("basic")
        .getByRole("slider", { name: "非受控评分", exact: true })
        .getAttribute("aria-valuenow")) === "2",
    )
    const half = scene("half").getByRole("slider", {
      name: "半分评分",
      exact: true,
    })
    await pick(half, 1, 0.25)
    check(
      "Rating accepts leading half selections",
      (await half.getAttribute("aria-valuenow")) === "1.5",
    )
    const precise = scene("half").getByRole("slider", {
      name: "小数展示",
      exact: true,
    })
    check(
      "Readonly fractional rating fills the precise fraction",
      await precise
        .locator(".hys-ui-rating-fill")
        .nth(3)
        .evaluate((el) => Math.abs(parseFloat(el.style.width) - 70) < 0.001),
    )
    const preview = scene("text").getByRole("slider", {
      name: "文字评分",
      exact: true,
    })
    await preview.locator("button").last().hover()
    check(
      "Rating hover previews text without committing",
      (await preview.getAttribute("aria-valuenow")) === "3" &&
        (await text("text")).includes("预览：5") &&
        (await preview.textContent()).includes("非常满意"),
    )
    await scene("text").locator("h2").hover()
    check(
      "Rating hover restores committed text on leave",
      (await text("text")).includes("预览：无"),
    )
    const level = scene("colors").getByRole("slider", {
      name: "阈值颜色",
      exact: true,
    })
    await pick(level, 3)
    check(
      "Rating resolves excluded level boundaries",
      await level
        .locator(".hys-ui-rating-fill")
        .first()
        .evaluate((el) => el.style.color === "rgb(18, 168, 120)"),
    )
    check(
      "Custom rating characters render in both layers",
      (await scene("icons")
        .getByRole("slider", { name: "字符评分", exact: true })
        .locator(".hys-ui-rating-fill")
        .count()) === 5,
    )
    check(
      "Per-item native tooltip descriptions render",
      (await scene("tooltips")
        .getByRole("slider")
        .locator("button")
        .first()
        .getAttribute("title")) === "不满意",
    )
    const controlled = scene("controlled").getByRole("slider")
    await pick(controlled, 4)
    check(
      "Controlled rating retains rejected model values",
      (await controlled.getAttribute("aria-valuenow")) === "2",
    )
    await scene("controlled")
      .getByRole("checkbox", { name: "允许提交更新", exact: true })
      .check()
    await pick(controlled, 3)
    check(
      "Controlled rating accepts permitted updates",
      (await controlled.getAttribute("aria-valuenow")) === "4",
    )
    await scene("keyboard")
      .getByRole("button", { name: "聚焦评分", exact: true })
      .click()
    const keys = scene("keyboard").getByRole("slider")
    check(
      "Rating exposes one keyboard focus target",
      await keys.evaluate(
        (el) =>
          el === document.activeElement &&
          Array.from(el.querySelectorAll("button")).every(
            (button) => button.tabIndex === -1,
          ),
      ),
    )
    await keys.press("ArrowRight")
    check(
      "Rating keyboard follows half steps",
      (await keys.getAttribute("aria-valuenow")) === "2.5",
    )
    await keys.press("End")
    check(
      "Rating End key reaches max",
      (await keys.getAttribute("aria-valuenow")) === "5",
    )
    await keys.press("Delete")
    check(
      "Rating keyboard can clear allowed values",
      (await keys.getAttribute("aria-valuenow")) === "0",
    )
    await scene("methods")
      .getByRole("button", { name: "预览五分", exact: true })
      .click()
    check(
      "Rating preview method does not submit",
      (await text("methods")).includes("已提交：2") &&
        (await scene("methods").getByRole("slider").textContent()).includes(
          "5",
        ),
    )
    await scene("methods")
      .getByRole("button", { name: "提交四分", exact: true })
      .click()
    check(
      "Rating commit methods report accepted values",
      (await text("methods")).includes("已提交：4") &&
        (await text("methods")).includes("true"),
    )
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click()
    check(
      "Rating form validates minimum score",
      (await scene("form").textContent()).includes("请至少给出一分"),
    )
    await pick(scene("form").getByRole("slider"), 2)
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click()
    check(
      "Rating submits valid form data",
      (await text("form")).includes("提交成功"),
    )
    await scene("form")
      .getByRole("button", { name: "重置表单", exact: true })
      .click()
    check(
      "Rating form reset restores zero",
      (await scene("form")
        .getByRole("slider")
        .getAttribute("aria-valuenow")) === "0",
    )
    await scene("icons").scrollIntoViewIfNeeded()
    await page.screenshot({
      path: "output/playwright/ratingseg-rating-wide.png",
    })
    await visit("HysSegmented", "hys-segmented")
    const group = scene("basic").getByRole("radiogroup", {
      name: "视图选择",
      exact: true,
    })
    await group.getByRole("radio", { name: "月", exact: true }).click()
    check(
      "Segmented updates selected view",
      (await text("basic")).includes("month"),
    )
    await page.waitForTimeout(240)
    check(
      "Selected indicator aligns with the active option",
      await group.evaluate((el) => {
        const a = el
            .querySelector(".hys-ui-segment-indicator")
            .getBoundingClientRect(),
          b = el.querySelector("[aria-checked=true]").getBoundingClientRect()
        return (
          Math.abs(a.x - b.x) < 1 &&
          Math.abs(a.y - b.y) < 1 &&
          Math.abs(a.width - b.width) < 1 &&
          Math.abs(a.height - b.height) < 1
        )
      }),
    )
    await scene("values")
      .getByRole("radiogroup", { name: "类型选择", exact: true })
      .getByRole("radio", { name: "false", exact: true })
      .click()
    check(
      "Segmented preserves boolean values",
      (await text("values")).includes("boolean"),
    )
    await scene("values")
      .getByRole("radiogroup", { name: "字段映射选择", exact: true })
      .getByRole("radio", { name: "访客", exact: true })
      .click()
    check(
      "Segmented maps business option fields",
      (await scene("values").textContent()).includes("角色 ID：3"),
    )
    const vertical = scene("layout").getByRole("radiogroup", {
      name: "纵向布局",
      exact: true,
    })
    await vertical.getByRole("radio", { name: "已完成", exact: true }).click()
    await page.waitForTimeout(240)
    check(
      "Vertical segmented indicator follows layout",
      await vertical.evaluate((el) => {
        const a = el
            .querySelector(".hys-ui-segment-indicator")
            .getBoundingClientRect(),
          b = el.querySelector("[aria-checked=true]").getBoundingClientRect()
        return (
          el.getAttribute("aria-orientation") === "vertical" &&
          Math.abs(a.y - b.y) < 1 &&
          Math.abs(a.height - b.height) < 1
        )
      }),
    )
    check(
      "Block segmented options divide the available width",
      await scene("layout")
        .getByRole("radiogroup", { name: "铺满布局", exact: true })
        .locator("button")
        .evaluateAll(
          (elements) =>
            Math.max(...elements.map((el) => el.offsetWidth)) -
              Math.min(...elements.map((el) => el.offsetWidth)) <
            2,
        ),
    )
    check(
      "Segmented renders custom icons and avatar content",
      (await scene("content")
        .getByRole("radiogroup", { name: "图标分段", exact: true })
        .locator("svg")
        .count()) === 3 &&
        (await scene("content").locator(".hys-ui-ex-avatar").count()) === 2,
    )
    await scene("dynamic")
      .getByRole("button", { name: "添加选项", exact: true })
      .click()
    await scene("dynamic")
      .getByRole("radio", { name: "标签 1", exact: true })
      .click()
    await scene("dynamic")
      .getByRole("button", { name: "删除末项", exact: true })
      .click()
    check(
      "Segmented dynamic removal preserves host values",
      (await text("dynamic")).includes("实际值：标签 1") &&
        (await scene("dynamic").getByRole("radio").count()) === 2,
    )
    const locked = scene("controlled").getByRole("radiogroup")
    await locked.getByRole("radio", { name: "详情", exact: true }).click()
    check(
      "Segmented respects controlled rejection",
      (await locked
        .getByRole("radio", { name: "概览", exact: true })
        .getAttribute("aria-checked")) === "true",
    )
    await scene("controlled")
      .getByRole("checkbox", { name: "允许更新选择", exact: true })
      .check()
    await locked.getByRole("radio", { name: "日志", exact: true }).click()
    check(
      "Segmented accepts controlled changes",
      (await locked
        .getByRole("radio", { name: "日志", exact: true })
        .getAttribute("aria-checked")) === "true",
    )
    await scene("keyboard")
      .getByRole("button", { name: "聚焦当前项", exact: true })
      .click()
    const keyGroup = scene("keyboard").getByRole("radiogroup")
    await keyGroup
      .getByRole("radio", { name: "首项", exact: true })
      .press("ArrowRight")
    check(
      "Segmented arrows skip disabled options",
      (await text("keyboard")).trim() === "c",
    )
    await keyGroup
      .getByRole("radio", { name: "末项", exact: true })
      .press("ArrowRight")
    check(
      "Segmented arrows loop when enabled",
      (await text("keyboard")).trim() === "a",
    )
    const rtl = scene("rtl").getByRole("radiogroup")
    await rtl
      .getByRole("radio", { name: "开始", exact: true })
      .press("ArrowLeft")
    check(
      "Segmented RTL navigation follows visual order",
      (await text("rtl")).trim() === "b",
    )
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click()
    check(
      "Segmented form validates missing choices",
      (await scene("form").textContent()).includes("请选择视图"),
    )
    await scene("form")
      .getByRole("radio", { name: "看板", exact: true })
      .click()
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click()
    check(
      "Segmented form submits valid choices",
      (await text("form")).includes("提交成功"),
    )
    await scene("form")
      .getByRole("button", { name: "重置表单", exact: true })
      .click()
    check(
      "Segmented form resets its selection",
      (await scene("form").locator("[aria-checked=true]").count()) === 0,
    )
    const before = await page.evaluate(() => window.__segmentObservers.size)
    await page
      .locator('.docs-sidebar a[href="/components/hys-rating"]')
      .evaluate((el) => el.click())
    await page.locator("h1").filter({ hasText: "HysRating" }).waitFor()
    await page.waitForTimeout(200)
    check(
      "Cached segmented pages release geometry observers",
      before > 0 &&
        (await page.evaluate(() => window.__segmentObservers.size)) === 0,
    )
    await page
      .locator('.docs-sidebar a[href="/components/hys-segmented"]')
      .evaluate((el) => el.click())
    await page.locator("h1").filter({ hasText: "HysSegmented" }).waitFor()
    await page.waitForTimeout(200)
    check(
      "Cached segmented pages reconnect observers",
      (await page.evaluate(() => window.__segmentObservers.size)) > 0,
    )
    await scene("content").scrollIntoViewIfNeeded()
    await page.screenshot({
      path: "output/playwright/ratingseg-segmented-wide.png",
    })
    await scene("basic").locator("summary").click()
    check(
      "Examples expose runnable source",
      (
        await scene("basic").locator(".source-code code").textContent()
      ).includes("HysSegmented"),
    )
    await page
      .locator("#api")
      .getByRole("tab", { name: "实例方法", exact: true })
      .click()
    check(
      "Segmented instance API is documented",
      (
        await page.locator("#api tbody td:first-child code").allTextContents()
      ).includes("select"),
    )
    await page.emulateMedia({ reducedMotion: "reduce" })
    const colors = []
    for (const [label, theme] of [
      ["科技蓝", "blue"],
      ["深色", "dark"],
      ["清新绿", "green"],
      ["紫色", "purple"],
      ["暖橙", "orange"],
      ["森林", "forest"],
    ]) {
      await page
        .getByRole("combobox", { name: "文档主题", exact: true })
        .click()
      await page.getByRole("option", { name: label, exact: true }).click()
      const themed = scene("basic").getByRole("radiogroup", {
        name: "视图选择",
        exact: true,
      })
      check(
        "Segmented inherits " + theme + " theme",
        (await themed.getAttribute("data-hys-theme")) === theme,
      )
      colors.push(
        await themed
          .locator("[aria-checked=true]")
          .evaluate((el) => getComputedStyle(el).color),
      )
    }
    check(
      "Selected segmented text uses current theme colors",
      new Set(colors).size === 6,
    )
    check(
      "Reduced motion disables indicator transitions",
      await scene("basic")
        .locator(".hys-ui-segment-indicator")
        .first()
        .evaluate((el) => getComputedStyle(el).transitionDuration === "0s"),
    )
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click()
    await page.getByRole("option", { name: "科技蓝", exact: true }).click()
    await page.emulateMedia({ reducedMotion: "no-preference" })
    const overflow = {}
    await page.setViewportSize({ width: 390, height: 844 })
    for (const [name, slug] of [
      ["HysRating", "hys-rating"],
      ["HysSegmented", "hys-segmented"],
    ]) {
      await visit(name, slug)
      overflow[name] = await page
        .locator(".example-stage")
        .evaluateAll((elements) =>
          elements
            .filter((el) => el.scrollWidth > el.clientWidth + 2)
            .map((el) => el.closest("section").id),
        )
      check(name + " examples fit mobile layouts", overflow[name].length === 0)
      await scene("configure").scrollIntoViewIfNeeded()
      await page.screenshot({
        path: "output/playwright/ratingseg-" + slug + "-mobile.png",
      })
    }
    await page.setViewportSize({ width: 1680, height: 1000 })
    await visit("HysGantt", "hys-gantt")
    await scene("basic").getByRole("radio", { name: "月", exact: true }).click()
    check(
      "Gantt retains segmented month selection",
      (await scene("basic")
        .getByRole("radio", { name: "月", exact: true })
        .getAttribute("aria-checked")) === "true",
    )
    const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0)
    const ganttContrast=[]
    await page.emulateMedia({reducedMotion:'reduce'})
    for(const [label,theme]of [['科技蓝','blue'],['深色','dark'],['清新绿','green'],['紫色','purple'],['暖橙','orange'],['森林','forest']]){
      await page.getByRole('combobox',{name:'文档主题',exact:true}).click()
      await page.getByRole('option',{name:label,exact:true}).click()
      for(const mode of ['日','周','月']){
        const button=scene('basic').getByRole('radio',{name:mode,exact:true})
        await button.click()
        const colors=await button.evaluate(el=>{const group=el.closest('.hys-ui-ex-segment'),style=getComputedStyle(el),fill=getComputedStyle(group.querySelector('.hys-ui-segment-indicator')),own=style.backgroundColor;return {color:style.color,background:own==='transparent'||own==='rgba(0, 0, 0, 0)'?fill.backgroundColor:own,text:el.textContent.trim()}})
        const a=luminance(colors.color),b=luminance(colors.background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05)
        ganttContrast.push({theme,mode,...colors,ratio})
        check('Gantt '+theme+' '+mode+' selected label remains readable',colors.text===mode&&ratio>=4.5)
        if(theme==='purple'&&mode==='日')await scene('basic').locator('.hys-ui-pg-gantt').screenshot({path:'output/playwright/ratingseg-gantt-purple.png'})
      }
    }
    await page.getByRole('combobox',{name:'文档主题',exact:true}).click()
    await page.getByRole('option',{name:'科技蓝',exact:true}).click()
    await page.emulateMedia({reducedMotion:'no-preference'})
    check(
      "No runtime errors or Vue warnings",
      errors.length === 0 && warnings.length === 0,
    )
    return { checks, overflow, ganttContrast, errors, warnings }
  } catch (error) {
    throw Error(
      "After " +
        checks.at(-1)?.name +
        ": " +
        error.message +
        "; errors=" +
        JSON.stringify(errors) +
        "; warnings=" +
        JSON.stringify(warnings),
    )
  }
}
