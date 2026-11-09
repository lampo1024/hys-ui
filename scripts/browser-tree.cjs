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
  await page.goto(base + "/components/hys-tree");
  const scene = (n) => page.locator("#scene-" + n),
    row = (n, k) =>
      scene(n).locator('[data-tree-key="' + typeof k + ":" + k + '"]'),
    frames = () =>
      page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
  await row("basic", "root").waitFor();
  await row("basic", "team-2").click();
  check(
    "Legacy row selection and controlled values remain usable",
    (await scene("basic").locator("output").textContent()).includes("team-2"),
  );
  await row("basic", "team-1").locator("input[type=checkbox]").check();
  await frames();
  check(
    "Parent conduction reaches existing children",
    (await row("basic", "root").getAttribute("aria-checked")) === "mixed",
  );
  await row("basic", "team-1")
    .getByRole("button", { name: "展开 平台开发组", exact: true })
    .click();
  check(
    "Checked descendants become visible after expansion",
    (await row("basic", "api").getAttribute("aria-checked")) === "true",
  );
  await scene("basic").screenshot({ path: "output/playwright/tree-basic.png" });
  check(
    "Uncontrolled defaults distinguish selection from checking",
    (await row("defaults", "guide").getAttribute("aria-selected")) === "true" &&
      (await row("defaults", "api").getAttribute("aria-checked")) === "true",
  );
  await row("defaults", "guide").click();
  check(
    "Repeated selection can clear an explicitly deselectable tree",
    (await row("defaults", "guide").getAttribute("aria-selected")) === "false",
  );
  await scene("checking")
    .getByRole("button", { name: "读取勾选与半选", exact: true })
    .click();
  check(
    "Public checking methods expose half-selected parents",
    (await scene("checking").locator("output").textContent()).includes(
      "permissions",
    ),
  );
  await row("expansion", "engineering").click();
  check(
    "Accordion expansion collapses sibling branches",
    (await row("expansion", "architecture").count()) === 1 &&
      (await row("expansion", "spec").count()) === 0,
  );
  await scene("expansion")
    .getByRole("button", { name: "定位深层节点", exact: true })
    .click();
  check(
    "Current-key methods reveal a deep ancestor path",
    (await row("expansion", "roadmap").getAttribute("aria-selected")) ===
      "true",
  );
  check(
    "Search retains matched ancestor paths",
    (await row("filtering", "research").count()) === 1 &&
      (await row("filtering", "qa").count()) === 0,
  );
  await scene("filtering")
    .getByRole("checkbox", { name: "同时展示匹配节点的子级", exact: true })
    .check();
  check(
    "Matched subtree display is independently configurable",
    (await row("filtering", "api").count()) === 1,
  );
  await scene("filtering").getByRole("combobox").click();
  await page
    .getByRole("option", { name: "保留结构并标记匹配", exact: true })
    .click();
  check(
    "Highlight filtering keeps the original structure",
    (await row("filtering", "qa").count()) === 1,
  );
  check(
    "Mapped business data supports numeric zero",
    (await row("mapping", 0).getAttribute("aria-selected")) === "true",
  );
  await row("mapping", 20).click();
  check(
    "Mapped numeric selections retain their runtime type",
    (await scene("mapping").locator("output").textContent()).includes("number"),
  );
  await row("custom", "design")
    .getByRole("button", { name: "查看", exact: true })
    .click();
  check(
    "Custom action buttons do not select their containing row",
    (await row("custom", "spec").getAttribute("aria-selected")) === "true",
  );
  await scene("custom").screenshot({
    path: "output/playwright/tree-custom.png",
  });
  await row("async", "async-root")
    .getByRole("button", { name: "展开 展开以加载团队", exact: true })
    .click();
  await scene("async")
    .getByRole("button", { name: "加载失败 · 重试", exact: true })
    .waitFor();
  check(
    "Lazy loading offers a local retry after failure",
    (await scene("async")
      .getByRole("button", { name: "加载失败 · 重试", exact: true })
      .count()) === 1,
  );
  await scene("async").getByRole("checkbox").uncheck();
  await scene("async")
    .getByRole("button", { name: "加载失败 · 重试", exact: true })
    .click();
  await row("async", "async-root-one").waitFor();
  check(
    "Retry inserts accepted children without rebuilding the source",
    (await row("async", "async-root-two").getAttribute("aria-disabled")) ===
      "true",
  );
  await scene("dragdrop").scrollIntoViewIfNeeded();
  await frames();
  await row("dragdrop", "b").dragTo(row("dragdrop", "d"));
  await frames();
  check(
    "Native mouse drag preserves the legacy immutable reorder example",
    (await scene("dragdrop").locator("output").textContent()).includes(
      "已移动 后端组",
    ),
  );
  check(
    "Drag completion removes temporary target indicators",
    (await scene("dragdrop")
      .locator(".hys-ui-pf-tree-drop,.hys-ui-tree-row-dragging")
      .count()) === 0,
  );
  await scene("editing").getByRole("textbox").first().fill("质量文档");
  await scene("editing")
    .getByRole("button", { name: "添加目录", exact: true })
    .click();
  await row("editing", "folder-1").waitFor();
  check(
    "Editing methods publish a new host-owned tree",
    (await row("editing", "folder-1").textContent()).includes("质量文档"),
  );
  await row("editing", "folder-1")
    .getByRole("button", { name: "删除", exact: true })
    .click();
  check(
    "Custom row actions can remove their item",
    (await row("editing", "folder-1").count()) === 0,
  );
  check(
    "Large trees keep a bounded visible DOM",
    (await scene("virtual").getByRole("treeitem").count()) < 25,
  );
  await scene("virtual")
    .getByRole("button", { name: "定位最后一组", exact: true })
    .click();
  await row("virtual", 20199).waitFor();
  check(
    "scrollTo reaches an unrendered final numeric item",
    (await row("virtual", 20199).count()) === 1,
  );
  await scene("virtual")
    .getByRole("button", { name: "回到首项", exact: true })
    .click();
  await page.keyboard.press("End");
  await frames();
  check(
    "Virtual End navigation keeps the final row focused",
    (await page.evaluate(() =>
      document.activeElement?.getAttribute("data-tree-id"),
    )) === "20199",
  );
  await page.keyboard.press("Enter");
  check(
    "Offscreen selection works after keyboard scrolling",
    (await scene("virtual").locator("output").textContent()).includes("20199"),
  );
  await scene("form")
    .getByRole("button", { name: "保存配置", exact: true })
    .click();
  await frames();
  check(
    "Forms validate the composite tree and focus a usable row",
    (await scene("form").locator("output").textContent()).includes(
      "请先选择团队",
    ),
  );
  check(
    "Form labels target the managed tree rather than its search",
    await scene("form").evaluate(
      (el) =>
        el.querySelector(".hys-ui-ent-field > label").htmlFor ===
        el.querySelector("[role=tree]").id,
    ),
  );
  await scene("form").getByRole("textbox").fill("平台");
  await scene("form").getByRole("textbox").press("Enter");
  check(
    "Tree search Enter does not submit the parent form",
    (await scene("form").locator("output").textContent()).includes(
      "请先选择团队",
    ),
  );
  await row("form", "a").locator("input[type=checkbox]").check();
  await scene("form")
    .getByRole("button", { name: "保存配置", exact: true })
    .click();
  await frames();
  check(
    "Accepted checking participates in full form submission",
    (await scene("form").locator("output").textContent()).includes(
      "团队配置已保存",
    ),
  );
  await scene("keyboard")
    .getByRole("button", { name: "聚焦树形列表", exact: true })
    .click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await frames();
  check(
    "Keyboard navigation skips disabled siblings",
    (await page.evaluate(() =>
      document.activeElement?.getAttribute("data-tree-id"),
    )) === "a2",
  );
  await page.keyboard.press("Space");
  check(
    "Space changes checking on a focused tree item",
    (await row("keyboard", "a2").getAttribute("aria-checked")) === "true",
  );
  await row("keyboard", "a2").click({ button: "right" });
  await page.getByRole("menu").waitFor();
  check(
    "Context menus expose keyboard-usable actions",
    (await page.getByRole("menuitem").count()) === 3,
  );
  await page.keyboard.press("Escape");
  await frames();
  check(
    "Closing context menus restores the original row focus",
    (await page.getByRole("menu").count()) === 0 &&
      (await page.evaluate(() =>
        document.activeElement?.getAttribute("data-tree-id"),
      )) === "a2",
  );
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await row("basic", "root").dispatchEvent("dragstart", {
    dataTransfer: transfer,
  }); // basic keeps dragging disabled
  await row("dragdrop", "c").dispatchEvent("dragstart", {
    dataTransfer: transfer,
  });
  await row("dragdrop", "d").dispatchEvent("dragover", {
    dataTransfer: transfer,
    clientY: (await row("dragdrop", "d").boundingBox()).y + 20,
  });
  await page.locator('a[href="/components/hys-select"]').click();
  await page.locator("#scene-basic .hys-ui-select").first().waitFor();
  check(
    "Cached-page leave removes menus and active drags",
    (await page
      .locator(".hys-ui-pf-tree-drop,.hys-ui-tree-row-dragging,[role=menu]")
      .count()) === 0,
  );
  await page.locator('a[href="/components/hys-tree"]').click();
  await row("basic", "root").waitFor();
  check(
    "Cached-page return retains accepted selection",
    (await row("basic", "team-2").getAttribute("aria-selected")) === "true",
  );
  await scene("virtual").scrollIntoViewIfNeeded();
  check(
    "Cached virtual windows restore visible rows",
    await scene("virtual")
      .getByRole("tree")
      .evaluate((el) => {
        const b = el.getBoundingClientRect();
        return (
          el.scrollTop > 0 &&
          [...el.querySelectorAll("[role=treeitem]")].some((r) => {
            const x = r.getBoundingClientRect();
            return x.bottom > b.top && x.top < b.bottom;
          })
        );
      }),
  );
  check(
    "Locale overrides widget and search labels",
    (await scene("locale")
      .getByRole("tree", { name: "Knowledge base", exact: true })
      .count()) === 1 &&
      (await scene("locale")
        .getByRole("textbox", { name: "Find nodes", exact: true })
        .count()) === 1,
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
    check(
      theme + " theme reaches tree roots",
      (await scene("basic")
        .locator(".hys-ui-pf-tree")
        .getAttribute("data-hys-theme")) === theme,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await scene("custom").scrollIntoViewIfNeeded();
  await frames();
  check(
    "Custom tree examples fit a narrow viewport",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await scene("custom").screenshot({
    path: "output/playwright/tree-mobile.png",
  });
  check(
    "No Tree errors or Vue warnings",
    errors.length === 0 && warnings.length === 0,
  );
  return { checks, errors, warnings };
}
