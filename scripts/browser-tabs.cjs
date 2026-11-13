async (page) => {
  const checks = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const check = (name, valid) => { if (!valid) throw Error(name); checks.push(name); };
  const scene = id => page.locator("#scene-" + id);
  const tab = (id, name) => scene(id).getByRole("tab", { name });
  const button = (id, name) => scene(id).getByRole("button", { name, exact:true });
  const goto = path => page.goto("http://127.0.0.1:5174/components/" + path);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goto("hys-tabs");
  await page.evaluate(() => sessionStorage.removeItem("hys-doc-tabs-workbench"));

  await button("overflow", "更多页签").click();
  const more = page.getByRole("dialog", { name: "更多页签" });
  await more.getByRole("searchbox").fill("跨区域");
  await more.getByRole("button", { name: /跨区域/ }).click();
  const last = tab("overflow", /跨区域/);
  check("More searches and activates an off-screen tab", await last.getAttribute("aria-selected") === "true");
  check("The selected tab scrolls into the nav viewport", await last.evaluate(el => {
    const outer=el.closest('[role="tablist"]').getBoundingClientRect(), inner=el.getBoundingClientRect();
    return inner.left >= outer.left - 3 && inner.right <= outer.right + 3;
  }));
  check("A truncated title exposes the complete text", (await last.getAttribute("title")).includes("跨区域交付"));
  await tab("asynccontent", "异步报表").click();
  await scene("asynccontent").getByText("正在加载页签…", { exact: true }).waitFor();
  await scene("asynccontent").getByRole("alert").waitFor();
  await button("asynccontent", "重试").click();
  await scene("asynccontent").getByText(/报表版本 1 已加载/).waitFor();
  await button("asynccontent", "刷新报表").click();
  await scene("asynccontent").getByText(/报表版本 2 已加载/).waitFor();
  checks.push("Lazy async content displays loading, failure, retry and reload");

  const workbench = scene("workbench");
  await tab("workbench", /客户回访/).click();
  const dirty = workbench.getByRole("button", {name:"关闭客户回访"});
  await dirty.click();
  const confirm = page.getByRole("dialog", {name:"关闭未保存的页签？"});
  await confirm.waitFor();
  await confirm.getByRole("button",{name:"取消",exact:true}).click();
  await confirm.waitFor({state:"hidden"});
  check("Cancel keeps a dirty tab open", await tab("workbench", /客户回访/).count() === 1);
  await dirty.click();
  await confirm.getByRole("button",{name:"仍然关闭",exact:true}).click();
  await tab("workbench", /客户回访/).waitFor({state:"hidden"});
  check("Closing activates an adjacent tab", await tab("workbench", /报价单/).getAttribute("aria-selected") === "true");
  await button("workbench", "恢复最近关闭").click();
  await tab("workbench", /客户回访/).waitFor();
  checks.push("Restoring recreates the most recently closed tab");
  await tab("workbench", /报价单/).click({button:"right"});
  const menu = page.getByRole("menu", {name:"页签操作"});
  await menu.getByRole("menuitem", {name:"重命名",exact:true}).click();
  const rename = page.getByRole("dialog", {name:"重命名页签"});
  await rename.getByRole("textbox",{name:"页签名称"}).fill("新版报价");
  await rename.getByRole("button",{name:"保存名称",exact:true}).click();
  await tab("workbench", /新版报价/).waitFor();
  checks.push("The context menu can rename tabs");
  const handle = tab("workbench", /新版报价/).locator("xpath=..").locator(".hys-tab-drag-handle");
  const target = tab("workbench", /客户回访/);
  await handle.scrollIntoViewIfNeeded();
  const from = await handle.boundingBox(), to = await target.boundingBox();
  await page.mouse.move(from.x + from.width/2, from.y + from.height/2);
  await page.mouse.down();
  await page.mouse.move(to.x + 5, to.y + to.height/2, {steps:12});
  await page.mouse.up();
  await workbench.getByText("已更新页签顺序",{exact:true}).waitFor();
  const order = await workbench.getByRole("tab").allTextContents();
  check("Pointer dragging reorders unpinned tabs", order[0].includes("工作区") && order[1].includes("新版报价"));
  await workbench.getByText("保存当前会话",{exact:true}).click();
  await page.waitForFunction(() => sessionStorage.getItem("hys-doc-tabs-workbench")?.includes("新版报价"));
  await page.reload();
  await workbench.getByText("保存当前会话",{exact:true}).click();
  await tab("workbench", /新版报价/).waitFor();
  checks.push("Session restore keeps the renamed tab and order");

  const interaction = scene("interaction");
  await tab("interaction", /处理中/).hover();
  await interaction.getByText(/预览 · 正在跟进/).waitFor();
  check("Hover previews without activating", await tab("interaction", /待处理/).getAttribute("aria-selected") === "true");
  const panel = interaction.getByRole("tabpanel").filter({visible:true});
  await panel.evaluate(el=>{
    el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerType:"touch",isPrimary:true,pointerId:100,clientX:160,clientY:20}));
    el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,pointerType:"touch",isPrimary:true,pointerId:100,clientX:40,clientY:22}));
  });
  check("A horizontal touch swipe activates the next tab", await tab("interaction", /处理中/).getAttribute("aria-selected") === "true");

  await button("routing", "从路由打开销售报表").click();
  await tab("routing", /销售报表/).waitFor();
  check("External route updates activate the new tab", new URL(page.url()).searchParams.get("tabReport") === "sales" &&
    await tab("routing", /销售报表/).getAttribute("aria-selected") === "true");
  await tab("routing", /报表中心/).click();
  await page.waitForURL(url => !url.searchParams.has("tabReport"));
  checks.push("Activating a route tab updates the router");

  await goto("hys-tab-pane");
  await tab("basic", /项目备注/).click();
  await scene("basic").getByText("两条备注待跟进。", {exact:true}).waitFor();
  const selected = tab("basic", /项目备注/);
  check("Declarative pane and tab are linked by stable ARIA IDs", await selected.evaluate(el =>
    document.getElementById(el.getAttribute("aria-controls")).getAttribute("aria-labelledby") === el.id));
  await scene("basic").getByText("显示备注面板",{exact:true}).click();
  check("Removing a selected declaration picks a neighboring tab", await tab("basic", /项目概览/).getAttribute("aria-selected") === "true");
  await scene("nested").getByRole("textbox",{name:"显示名称"}).fill("保留的草稿");
  await tab("nested", "偏好").click();
  await tab("nested", "账号设置").click();
  check("Nested tabs preserve their local content", await scene("nested").getByRole("textbox",{name:"显示名称"}).inputValue() === "保留的草稿");
  await page.setViewportSize({ width:390, height:844 });
  for(const path of ["hys-tab-pane","hys-tabs"]) {
    await goto(path);
    await scene("basic").getByRole("tab").first().waitFor();
    check(path+" has no mobile page overflow",await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  check("No browser exceptions", !errors.length);
  return checks;
}
