async (page) => {
  const errors = [], checks = [];
  page.on("pageerror", error => errors.push(error.message));
  const check = (name, condition) => {
    if (!condition) throw Error(name);
    checks.push(name);
  };
  const scene = name => page.locator("#scene-" + name);
  const button = (scope, name) => scene(scope).getByRole("button", { name, exact: true });
  const toggle = (scope, label) => scene(scope).getByText(label, { exact: true }).click();
  const choice = async (scope, label, value) => {
    await scene(scope).getByRole("combobox", { name: label }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
  };
  const goto = name => page.goto("http://127.0.0.1:5174/components/hys-" + name);
  const focused = node => node.evaluate(el => document.activeElement === el);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  await goto("space");
  await button("basic", "新建报告").click();
  await scene("basic").getByText("已创建报告草稿", { exact: true }).waitFor();
  await choice("basic", "排列方向", "竖排");
  await choice("basic", "预设间距", "宽松（20 px）");
  const space = scene("basic").locator(".hys-ui-space");
  check("Space switches to vertical layout", await space.evaluate(el => getComputedStyle(el).flexDirection === "column"));
  check("Space applies the selected gap", await space.evaluate(el => getComputedStyle(el).rowGap === "20px"));
  await toggle("responsive", "操作项伸展");
  const views = scene("responsive").locator(".hys-space-item");
  const rows = await views.evaluateAll(items => items.map(el => Math.round(el.getBoundingClientRect().top)));
  check("Filled items wrap inside a narrow container", rows[0] === rows[1] && rows[2] > rows[1]);
  await button("responsive", "待审核").click();
  check("Wrapped items still respond to clicks", await button("responsive", "待审核").getAttribute("aria-pressed") === "true");
  const separators = scene("separators").locator(".hys-space-separator");
  check("Decorative separators start between each item", await separators.count() === 2);
  await toggle("separators", "显示使用帮助");
  check("Removing an item removes its separator", await separators.count() === 1);

  await goto("descriptions");
  const details = scene("basic");
  await details.getByText("待补充", { exact: true }).waitFor();
  check("Missing data displays a placeholder without hiding zero", await details.locator("dd").getByText("0", { exact: true }).count() === 1);
  await toggle("basic", "显示联系人");
  check("Hidden fields no longer occupy a detail cell", await details.locator("dt").count() === 5);
  const responsive = scene("responsive").locator(".hys-ui-descriptions");
  await responsive.waitFor();
  await page.waitForFunction(() => document.querySelector("#scene-responsive .hys-ui-descriptions")?.style.getPropertyValue("--hys-descriptions-columns") === "3");
  const member = responsive.locator(".hys-descriptions-field").first();
  check("Desktop descriptions supports row spans", await member.evaluate(el => el.style.gridRow === "span 2"));
  await toggle("responsive", "模拟侧栏宽度");
  await page.waitForFunction(() => document.querySelector("#scene-responsive .hys-ui-descriptions")?.style.getPropertyValue("--hys-descriptions-columns") === "1");
  check("Descriptions reflows by container width", await member.evaluate(el => el.style.gridRow === "span 1"));
  await choice("responsive", "标签布局", "标签在左侧");
  check("Description layout is configurable", await responsive.getAttribute("data-layout") === "horizontal");
  await button("custom", "标记已付款").click();
  await scene("custom").getByText("已付款", { exact: true }).waitFor();
  await button("custom", "清空示例数据").click();
  await scene("custom").getByText("当前没有订单可展示。", { exact: true }).waitFor();
  await button("custom", "恢复示例数据").click();
  await scene("custom").getByText("已付款", { exact: true }).waitFor();
  checks.push("Custom field slots and empty state update correctly");

  await goto("result");
  await choice("basic", "结果状态", "失败");
  await scene("basic").getByRole("heading", { name: "暂时无法发布报告" }).waitFor();
  check("Result updates its live announcement", (await scene("basic").locator('[aria-live="polite"]').textContent()).includes("暂时无法发布报告"));
  await choice("exceptions", "异常类型", "500 · 服务异常");
  await scene("exceptions").getByRole("heading", { name: "服务暂不可用", level: 3 }).waitFor();
  check("Exception displays the selected status code", await scene("exceptions").locator(".hys-result-code").textContent() === "500");
  await toggle("exceptions", "显示状态码");
  check("Exception code can be hidden independently", await scene("exceptions").locator(".hys-result-code").count() === 0);
  await button("workflow", "提交申请").click();
  await button("workflow", "正在提交").waitFor();
  const failure = scene("workflow").getByRole("heading", { name: "采购申请提交失败" });
  await failure.waitFor();
  check("Failure moves focus to the result", await focused(failure));
  await button("workflow", "重新提交").click();
  const success = scene("workflow").getByRole("heading", { name: "采购申请已提交" });
  await success.waitFor();
  check("Retry transitions to success and moves focus", await focused(success));
  await button("workflow", "返回申请").click();
  check("Returning restores focus to the submit button", await focused(button("workflow", "提交申请")));

  await page.setViewportSize({ width: 390, height: 844 });
  for (const component of ["space", "descriptions", "result"]) {
    await goto(component);
    await scene("basic").locator(".hys-ui-" + component).first().waitFor();
    check(component + " fits the mobile viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  check("No uncaught browser errors", !errors.length);
  return checks;
}
