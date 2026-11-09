async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    warnings = [];
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "warning" && e.text().includes("[Vue warn]"))
      warnings.push(e.text());
  });
  page.setDefaultTimeout(18000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.goto(base + "/components/hys-tree-select");
  const scene = (n) => page.locator("#scene-" + n),
    combo = (n) => scene(n).locator(".hys-ui-tree-select-control"),
    popup = () => page.locator(".hys-ui-tree-select-menu"),
    row = (key) =>
      popup().locator(
        '[data-tree-select-key="' + typeof key + ":" + key + '"]',
      ),
    frames = () =>
      page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      ),
    dismiss = async () => {
      if (await popup().count()) {
        await page.keyboard.press("Escape");
        await popup().waitFor({ state: "hidden" });
      }
    };
  await combo("basic").waitFor();
  await combo("basic").click();
  await row("backend").waitFor();
  check(
    "Legacy selection appears in a real hierarchical popup",
    (await row("backend").getAttribute("aria-selected")) === "true",
  );
  const triggerBox = await combo("basic").boundingBox(),
    panelBox = await popup().boundingBox();
  check(
    "Default popup width matches its trigger",
    Math.abs(triggerBox.width - panelBox.width) < 2,
  );
  await row("rd")
    .getByRole("button", { name: "折叠 研发中心", exact: true })
    .click();
  check(
    "Branch arrows collapse children without changing the selected value",
    (await row("backend").count()) === 0 &&
      (await scene("basic").locator("output").textContent()).includes(
        "backend",
      ),
  );
  await row("rd")
    .getByRole("button", { name: "展开 研发中心", exact: true })
    .click();
  await row("frontend").click();
  await frames();
  check(
    "Single selection preserves the existing value and change workflow",
    (await scene("basic").locator("output").textContent()).includes(
      "frontend",
    ) && (await popup().count()) === 0,
  );
  check(
    "Single selection restores trigger focus",
    await combo("basic").evaluate((el) => el === document.activeElement),
  );
  await scene("basic").screenshot({
    path: "output/playwright/tree-select-basic.png",
  });
  await combo("expansion").click();
  await row("rd").waitFor();
  check(
    "Explicit expansion starts with the requested branch",
    (await row("backend").count()) === 1,
  );
  await row("product")
    .getByRole("button", { name: "展开 产品中心", exact: true })
    .click();
  await frames();
  check(
    "Accordion opens a sibling branch and closes the previous one",
    (await row("design").count()) === 1 && (await row("backend").count()) === 0,
  );
  await dismiss();
  await combo("multiple").click();
  await row("platform").click();
  await row("product").click();
  await frames();
  check(
    "Multiple selection keeps the popup open and creates removable tags",
    (await popup().count()) === 1 &&
      (await scene("multiple")
        .locator(".hys-ui-tree-select-tag-remove")
        .count()) === 2,
  );
  check(
    "Disabled options stay unavailable",
    (await row("quality").getAttribute("aria-disabled")) === "true",
  );
  await dismiss();
  await scene("multiple")
    .getByRole("button", { name: "移除 平台组", exact: true })
    .click();
  check(
    "Tags can be removed while the popup is closed",
    !(await scene("multiple").locator("output").textContent()).includes(
      "platform",
    ),
  );
  await combo("checking").click();
  check(
    "Partial checking exposes a mixed parent state",
    (await row("project").getAttribute("aria-checked")) === "mixed",
  );
  await row("project").click();
  await frames();
  check(
    "Checking a parent returns eligible child values",
    (await scene("checking").locator("output").textContent()).includes(
      "edit",
    ) &&
      !(await scene("checking").locator("output").textContent()).includes(
        "security",
      ),
  );
  await dismiss();
  await scene("checking")
    .getByRole("combobox", { name: "回填策略", exact: true })
    .click();
  await page.getByRole("option", { name: "优先父节点", exact: true }).click();
  check(
    "Parent strategy condenses fully checked children into a parent tag",
    (await scene("checking")
      .getByRole("button", { name: "移除 项目权限", exact: true })
      .count()) === 1,
  );
  await scene("checking")
    .getByRole("button", { name: "移除 项目权限", exact: true })
    .click();
  check(
    "Removing a synthetic parent tag clears its associated child values",
    (await scene("checking").locator("output").textContent()).trim() === "[]",
  );
  await scene("checking")
    .getByRole("checkbox", { name: "父子独立勾选", exact: true })
    .check();
  await combo("checking").click();
  await row("project").click();
  await frames();
  check(
    "Strict mode isolates a parent from its descendants",
    (await row("view").getAttribute("aria-checked")) === "false",
  );
  await dismiss();
  check(
    "Tag folding keeps a concise summary",
    (await scene("tags").locator(".hys-ui-tree-select-more").count()) === 1,
  );
  await scene("tags")
    .getByRole("button", { name: "清空选择", exact: true })
    .click();
  await frames();
  check(
    "Clearing preserves disabled selected values",
    (await scene("tags").locator("output").textContent()).includes("locked") &&
      (await scene("tags")
        .locator(".hys-ui-tree-select-tag-remove:disabled")
        .count()) === 1,
  );
  await combo("mapping").click();
  check(
    "Mapped values include numeric zero",
    (await row(0).getAttribute("aria-selected")) === "true",
  );
  await row(11).click();
  await frames();
  check(
    "Mapped selections preserve number types",
    (await scene("mapping").locator("output").textContent()).includes("number"),
  );
  await combo("simple").click();
  check(
    "Flat data can use parent zero to build hierarchy",
    (await row(3).getAttribute("aria-level")) === "3",
  );
  await row(3).click();
  await frames();
  check(
    "Flat business data returns the original value type",
    (await scene("simple").locator("output").textContent()).includes("3"),
  );
  check(
    "Missing labeled values retain their supplied label",
    (await combo("labels").textContent()).includes("尚未加载的远程团队"),
  );
  await combo("labels").click();
  await row("qa").click();
  await frames();
  check(
    "Labeled selection returns a value and human-readable label",
    (await scene("labels").locator("output").textContent()).includes(
      '"label"',
    ) &&
      (await scene("labels").locator("output").textContent()).includes(
        "质量保障组",
      ),
  );
  await combo("remote").click();
  await row("keller").waitFor();
  await popup().getByRole("textbox").fill("Lisa");
  await row("keller").waitFor({ state: "hidden" });
  await row("lisa").waitFor();
  check(
    "Remote search replaces options with the current response",
    (await row("keller").count()) === 0,
  );
  await row("lisa").click();
  await frames();
  check(
    "Remote selections retain their label when the popup closes",
    (await combo("remote").textContent()).includes("Lisa"),
  );
  await scene("remote")
    .getByRole("checkbox", { name: "模拟请求失败", exact: true })
    .check();
  await combo("remote").click();
  await popup().getByRole("alert").waitFor();
  check(
    "Remote errors provide a local retry action",
    (await popup()
      .getByRole("button", { name: "重试", exact: true })
      .count()) === 1,
  );
  await dismiss();
  await scene("remote")
    .getByRole("checkbox", { name: "模拟请求失败", exact: true })
    .uncheck();
  await combo("remote").click();
  await row("lisa").waitFor();
  check(
    "Remote search recovers after a failed request",
    (await popup().getByRole("alert").count()) === 0,
  );
  await dismiss();
  check(
    "Lazy data can display cached labels before loading",
    (await combo("lazy").textContent()).includes("待加载的团队成员"),
  );
  await combo("lazy").click();
  check(
    "Lazy branches stay collapsed until requested",
    (await row("future").count()) === 0,
  );
  await row("root")
    .getByRole("button", { name: "展开 研发中心", exact: true })
    .click();
  await row("future").waitFor();
  check(
    "Accepted lazy data refreshes the selected label",
    (await combo("lazy").textContent()).includes("平台研发团队"),
  );
  await dismiss();
  await combo("lazy").click();
  await row("future").waitFor();
  check(
    "Accepted lazy children survive normal popup closing",
    (await scene("lazy").locator("output").textContent()).includes(
      "加载次数：1",
    ),
  );
  await dismiss();
  await combo("custom").click();
  await popup().getByText("选择协作团队", { exact: true }).waitFor();
  await popup().getByRole("button", { name: "完成", exact: true }).waitFor();
  check(
    "Header and footer slots remain visible around the option viewport",
    (await popup().getByText("选择协作团队", { exact: true }).count()) === 1 &&
      (await popup()
        .getByRole("button", { name: "完成", exact: true })
        .count()) === 1,
  );
  check(
    "Option slots receive business fields",
    (await row("backend").textContent()).includes("8 人"),
  );
  await page.screenshot({
    path: "output/playwright/tree-select-custom-popup.png",
  });
  await popup().getByRole("button", { name: "完成", exact: true }).click();
  await popup().waitFor({ state: "hidden" });
  await combo("popup").click();
  const narrow = await combo("popup").boundingBox(),
    wide = await popup().boundingBox();
  check(
    "Content-width popups can exceed a narrow trigger",
    wide.width > narrow.width + 1 &&
      (await popup()
        .locator(".hys-ui-tree-select-label")
        .evaluateAll((labels) =>
          labels.every((label) => label.scrollWidth <= label.clientWidth + 1),
        )),
  );
  check(
    "Long popup labels stay on a single line",
    await row("engineering")
      .locator(".hys-ui-tree-select-label")
      .evaluate((el) => getComputedStyle(el).whiteSpace === "nowrap"),
  );
  await dismiss();
  await scene("virtual")
    .getByRole("button", { name: "定位末尾成员", exact: true })
    .click();
  await row(20249).waitFor();
  check(
    "Virtual popups reach non-rendered numeric options",
    (await row(20249).count()) === 1,
  );
  check(
    "Large data keeps option DOM bounded",
    (await popup().getByRole("treeitem").count()) < 25,
  );
  await popup().getByRole("textbox").press("ArrowDown");
  await page.keyboard.press("End");
  await frames();
  check(
    "Virtual End navigation focuses the final item",
    (await page.evaluate(() =>
      document.activeElement?.getAttribute("data-tree-select-key"),
    )) === "number:20249",
  );
  await page.keyboard.press("Enter");
  await frames();
  check(
    "Offscreen virtual choices update the model",
    (await scene("virtual").locator("output").textContent()).includes("20249"),
  );
  await dismiss();
  await scene("form")
    .getByRole("button", { name: "保存配置", exact: true })
    .click();
  await frames();
  check(
    "Forms validate the composite selector",
    (await scene("form").locator("output").textContent()).includes(
      "请先选择团队",
    ),
  );
  check(
    "Form labels target the selector rather than popup search",
    await scene("form").evaluate(
      (el) =>
        el.querySelector(".hys-ui-ent-field > label").htmlFor ===
        el.querySelector(".hys-ui-tree-select-control").id,
    ),
  );
  await combo("form").click();
  await row("platform").click();
  await dismiss();
  await scene("form")
    .getByRole("button", { name: "保存配置", exact: true })
    .click();
  await frames();
  check(
    "Accepted checking participates in full form validation",
    (await scene("form").locator("output").textContent()).includes(
      "团队配置已保存",
    ),
  );
  await scene("form")
    .getByRole("combobox", { name: "表单尺寸", exact: true })
    .click();
  await page.getByRole("option", { name: "小", exact: true }).click();
  await combo("form").click();
  check(
    "Popup sizes inherit the form size",
    await popup().evaluate((el) =>
      el.classList.contains("hys-ui-tree-select-sm"),
    ),
  );
  check(
    "Small rows use a matching minimum height",
    await row("platform").evaluate(
      (el) => getComputedStyle(el).minHeight === "30px",
    ),
  );
  await dismiss();
  await scene("keyboard")
    .getByRole("button", { name: "展开并聚焦树形列表", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("data-tree-select-key") ===
      "string:r",
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await frames();
  check(
    "Keyboard navigation skips disabled options",
    (await page.evaluate(() =>
      document.activeElement?.getAttribute("data-tree-select-key"),
    )) === "string:api",
  );
  await page.keyboard.press("Enter");
  await frames();
  check(
    "Keyboard selection restores trigger focus",
    await combo("keyboard").evaluate((el) => el === document.activeElement),
  );
  await scene("methods")
    .getByRole("button", { name: "设置接口文档", exact: true })
    .click();
  await scene("methods")
    .getByRole("button", { name: "读取状态", exact: true })
    .click();
  check(
    "Public methods expose accepted value and label state",
    (await scene("methods").locator("output").textContent()).includes(
      "接口文档",
    ),
  );
  await combo("states").click();
  await scene("states")
    .getByRole("checkbox", { name: "加载中", exact: true })
    .check();
  await combo("states").click();
  check(
    "Loading slots are custom and block option actions",
    (await popup().getByRole("status").textContent()) === "正在准备节点…",
  );
  await dismiss();
  await scene("states")
    .getByRole("checkbox", { name: "加载中", exact: true })
    .uncheck();
  await combo("expansion").click();
  await row("product").waitFor();
  await page.locator('a[href="/components/hys-select"]').click();
  await page.locator("#scene-basic .hys-ui-select").first().waitFor();
  check(
    "Cached-page leave removes TreeSelect portals",
    (await popup().count()) === 0,
  );
  await page.locator('a[href="/components/hys-tree-select"]').click();
  await combo("basic").waitFor();
  check(
    "Cached-page return preserves accepted values",
    (await scene("basic").locator("output").textContent()).includes("frontend"),
  );
  for (const [label, theme] of [
    ["科技蓝", "blue"],
    ["深色", "dark"],
    ["清新绿", "green"],
    ["紫色", "purple"],
    ["暖橙", "orange"],
    ["森林", "forest"],
  ]) {
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await combo("basic").click();
    check(
      theme + " theme reaches the teleported panel",
      (await popup().getAttribute("data-hys-theme")) === theme,
    );
    await dismiss();
  }
  await page
    .locator("#api")
    .getByText("showCheckedStrategy", { exact: true })
    .waitFor();
  check(
    "The component API loads independently and includes new props",
    (await page
      .locator("#api")
      .getByText("labelInValue", { exact: true })
      .count()) === 1,
  );
  await page
    .locator("#api")
    .getByRole("tab", { name: "实例方法", exact: true })
    .click();
  check(
    "Lazy API data includes the public instance contract",
    (await page
      .locator("#api")
      .getByText("getSelectedItems", { exact: true })
      .count()) === 1,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await scene("popup").scrollIntoViewIfNeeded();
  await combo("popup").click();
  await frames();
  const mobile = await popup().boundingBox();
  check(
    "Mobile popups stay inside the visible viewport",
    mobile.x >= 0 && mobile.x + mobile.width <= 391,
  );
  check(
    "Mobile page layout has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({ path: "output/playwright/tree-select-mobile.png" });
  await dismiss();
  check(
    "No TreeSelect errors or Vue warnings",
    errors.length === 0 && warnings.length === 0,
  );
  return { checks, errors, warnings };
}