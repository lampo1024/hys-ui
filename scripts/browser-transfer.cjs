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
  page.setDefaultTimeout(12000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.goto(base + "/components/hys-transfer");
  const scene = (n) => page.locator("#scene-" + n),
    pane = (n, side) => scene(n).locator('[data-side="' + side + '"]'),
    row = (n, side, key) =>
      pane(n, side).locator('[data-transfer-key="' + key + '"]');
  await scene("basic")
    .getByRole("button", { name: "添加选中项", exact: true })
    .waitFor();
  check(
    "Original Transfer data renders with the existing model",
    (await pane("basic", "right")
      .getByRole("checkbox", { name: "Lisa", exact: true })
      .count()) === 1,
  );
  check(
    "Panel search controls stretch across the available width",
    await pane("basic", "left")
      .getByRole("textbox")
      .evaluate((input) => {
        const pane = input.closest("[data-side]").getBoundingClientRect(),
          root = input.closest(".hys-ui-input-shell") ?? input;
        return root.getBoundingClientRect().width > pane.width - 60;
      }),
  );
  await pane("basic", "left")
    .getByRole("checkbox", { name: "Keller", exact: true })
    .check();
  await scene("basic")
    .getByRole("button", { name: "添加选中项", exact: true })
    .click();
  await pane("basic", "right")
    .getByRole("checkbox", { name: "Keller", exact: true })
    .waitFor();
  check(
    "Button transfer preserves the original selected item",
    (await scene("basic").locator("output").textContent()).includes(
      "lisa、keller",
    ),
  );
  await scene("basic").screenshot({
    path: "output/playwright/transfer-basic.png",
  });
  await pane("search", "left").getByRole("textbox").fill("engineer");
  await page.waitForFunction(
    () =>
      document.querySelectorAll(
        "#scene-search [data-side=left] [data-transfer-key]",
      ).length === 2,
  );
  await pane("search", "right").getByRole("textbox").fill("QA");
  check(
    "Independent searches use the original business object matcher",
    (await pane("search", "right")
      .getByRole("checkbox", { name: "卡罗尔 · 测试", exact: true })
      .count()) === 1,
  );
  await scene("search")
    .getByRole("button", { name: "清除两侧搜索", exact: true })
    .click();
  check(
    "Clearing both controlled searches is atomic",
    (await pane("search", "left").getByRole("textbox").inputValue()) === "" &&
      (await pane("search", "right").getByRole("textbox").inputValue()) === "",
  );
  check(
    "Partially selected headers expose a mixed state",
    await pane("selection", "left")
      .getByRole("checkbox", { name: "全选待选择当前页", exact: true })
      .evaluate((e) => e.indeterminate),
  );
  await pane("selection", "left")
    .getByRole("checkbox", { name: "全选待选择当前页", exact: true })
    .check();
  check(
    "Select-all omits disabled entries",
    (await pane("selection", "left")
      .getByRole("checkbox", { name: "安全规范（锁定）", exact: true })
      .isDisabled()) &&
      (await scene("selection").locator("output").textContent()).includes(
        "a、d、e",
      ),
  );
  await scene("ordering").getByRole("combobox").click();
  await page
    .getByRole("option", { name: "新条目放到末尾", exact: true })
    .click();
  check(
    "Target order can follow the model rather than the source",
    await pane("ordering", "right")
      .locator(".hys-ui-transfer-label")
      .allTextContents()
      .then(
        (labels) =>
          labels.map((x) => x.trim()).join(",") === "接口开发,需求分析",
      ),
  );
  check(
    "One-way mode hides reverse batch controls",
    (await scene("oneway")
      .getByRole("button", { name: "移除选中项", exact: true })
      .count()) === 0,
  );
  await pane("oneway", "right")
    .getByRole("button", { name: "移除内容维护", exact: true })
    .click();
  check(
    "One-way removal respects protected targets",
    await pane("oneway", "right")
      .getByRole("button", { name: "移除基础权限（不可移除）", exact: true })
      .isDisabled(),
  );
  const dragTarget = pane("dragging", "right");
  await row("dragging", "left", "string:a").dragTo(dragTarget, {
    targetPosition: { x: 40, y: 110 },
  });
  await row("dragging", "right", "string:d").waitFor();
  check(
    "Native mouse dragging transfers the whole checked group",
    (await scene("dragging").locator("output").textContent()).includes(
      "已添加 2 项",
    ),
  );
  check(
    "Released drags leave no active target",
    (await scene("dragging")
      .locator(".hys-ui-is-drop-target,.hys-ui-is-dragging")
      .count()) === 0,
  );
  await scene("dragging").screenshot({
    path: "output/playwright/transfer-dragging.png",
  });
  await pane("mapping", "left")
    .getByRole("checkbox", { name: "周工", exact: true })
    .check();
  await scene("mapping")
    .getByRole("button", { name: "添加选中项", exact: true })
    .click();
  check(
    "Numeric zero and mapped business data retain their types",
    (await scene("mapping").locator("output").textContent()).includes("0、101"),
  );
  check(
    "Custom option content and empty templates render",
    (await scene("custom").locator(".member-option").count()) === 3 &&
      (await pane("custom", "right").textContent()).includes("还没有协作成员"),
  );
  await pane("custom", "left")
    .getByRole("checkbox", { name: "林工", exact: true })
    .check();
  await scene("custom")
    .getByRole("button", { name: "添加选中项", exact: true })
    .click();
  check(
    "Custom footer reads the same transferred data",
    (await pane("custom", "right").locator("footer").textContent()).includes(
      "1 位",
    ),
  );
  const pagination = pane("pagination", "left");
  await pagination
    .getByRole("checkbox", { name: "全选待选择当前页", exact: true })
    .check();
  await pagination.getByRole("button", { name: "下一页", exact: true }).click();
  check(
    "Pagination moves only the chosen panel",
    !(
      await pagination.locator(".hys-ui-pf-pagination-indicator").textContent()
    ).startsWith("1 /") &&
      (
        await pane("pagination", "right")
          .locator(".hys-ui-pf-pagination-indicator")
          .textContent()
      ).startsWith("1 /"),
  );
  await pagination.getByRole("textbox").fill("成员 12");
  await page.waitForFunction(() =>
    document
      .querySelector(
        "#scene-pagination [data-side=left] .hys-ui-pf-pagination-indicator",
      )
      ?.textContent.trim()
      .startsWith("1 /"),
  );
  check(
    "Search returns its panel to the first page",
    (await pagination
      .getByRole("checkbox", { name: "成员 12", exact: true })
      .count()) === 1,
  );
  const virtual = pane("virtual", "left");
  await virtual.locator("[data-transfer-key]").first().waitFor();
  check(
    "Large-data Transfer renders a bounded number of rows",
    (await virtual.locator("[data-transfer-key]").count()) < 40,
  );
  await scene("virtual")
    .getByRole("button", { name: "定位末尾资源", exact: true })
    .click();
  await row("virtual", "left", "number:19999").waitFor();
  check(
    "Public scrollTo reaches a non-rendered option",
    (await virtual.locator("[data-transfer-key]").count()) < 40,
  );
  await row("virtual", "left", "number:19999").getByRole("checkbox").focus();
  await page.keyboard.press("Home");
  await row("virtual", "left", "number:1").getByRole("checkbox").waitFor();
  check(
    "Virtual Home navigation focuses the first eligible item",
    await row("virtual", "left", "number:1")
      .getByRole("checkbox")
      .evaluate((e) => e === document.activeElement),
  );
  await page.keyboard.press("End");
  await row("virtual", "left", "number:19999").getByRole("checkbox").waitFor();
  check(
    "Virtual End navigation focuses the last item",
    await row("virtual", "left", "number:19999")
      .getByRole("checkbox")
      .evaluate((e) => e === document.activeElement),
  );
  await row("virtual", "left", "number:19999").getByRole("checkbox").check();
  await scene("virtual")
    .getByRole("button", { name: "添加选中项", exact: true })
    .click();
  await row("virtual", "right", "number:19999").waitFor();
  check(
    "Offscreen data remains transferable",
    (await scene("virtual").locator("output").textContent()).includes(
      "已选择 3 项",
    ),
  );
  const customTable = pane("custompanel", "left").locator(".hys-ui-table");
  await customTable
    .locator('tr[data-row-key="a"]')
    .getByRole("checkbox")
    .check();
  await scene("custompanel")
    .getByRole("button", { name: "添加选中项", exact: true })
    .click();
  await pane("custompanel", "right").locator('tr[data-row-key="a"]').waitFor();
  check(
    "A composed Table panel shares Transfer state",
    (await scene("custompanel").locator("output").textContent()).includes(
      "c、a",
    ),
  );
  await scene("custompanel").screenshot({
    path: "output/playwright/transfer-table-panel.png",
  });
  await pane("form", "left").getByRole("textbox").fill("负责人");
  await pane("form", "left").getByRole("textbox").press("Enter");
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  check(
    "Internal search Enter does not submit the enclosing form",
    (await scene("form").locator("output").textContent()).includes(
      "请至少移入一位协作成员",
    ),
  );
  await scene("form")
    .getByRole("button", { name: "保存配置", exact: true })
    .click();
  await scene("form")
    .getByText("请至少选择一位成员", { exact: true })
    .waitFor();
  await pane("form", "left")
    .getByRole("checkbox", { name: "产品负责人", exact: true })
    .check();
  check(
    "Internal checking leaves the actual form target unchanged",
    (await scene("form").locator("output").textContent()).includes(
      "请先完成成员配置",
    ),
  );
  await scene("form")
    .getByRole("button", { name: "添加选中项", exact: true })
    .click();
  await scene("form")
    .getByRole("button", { name: "保存配置", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector("#scene-form output")
      ?.textContent.includes("成员配置已保存"),
  );
  check("Form submission validates the transferred target", true);
  await scene("methods")
    .getByRole("button", { name: "移入 2、4、6", exact: true })
    .click();
  check(
    "Public methods report an accepted transfer",
    (await scene("methods").locator("output").textContent()).includes(
      "已移入指定工作项",
    ),
  );
  await scene("methods")
    .getByRole("button", { name: "聚焦右侧搜索", exact: true })
    .click();
  check(
    "Public focus addresses the requested panel",
    await pane("methods", "right")
      .getByRole("textbox")
      .evaluate((e) => e === document.activeElement),
  );
  check(
    "Localized labels apply to actions and headers",
    (await scene("locale")
      .getByRole("button", { name: "Add selected", exact: true })
      .count()) === 1 &&
      (await pane("locale", "left")
        .getByRole("checkbox", { name: "Select all in Available", exact: true })
        .count()) === 1,
  );
  await scene("states")
    .getByRole("checkbox", { name: "加载中", exact: true })
    .check();
  check(
    "Loading exposes per-panel status and blocks actions",
    (await scene("states")
      .locator(".hys-ui-transfer-loading[role=status]")
      .count()) === 2 &&
      (await scene("states")
        .getByRole("button", { name: "添加选中项", exact: true })
        .isDisabled()),
  );
  await scene("states")
    .getByRole("checkbox", { name: "加载中", exact: true })
    .uncheck();
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await row("selection", "left", "string:a").dispatchEvent("dragstart", {
    dataTransfer: transfer,
  });
  await pane("selection", "right").dispatchEvent("dragover", {
    dataTransfer: transfer,
  });
  check(
    "A pending drag marks its receiving panel",
    await pane("selection", "right").evaluate((e) =>
      e.classList.contains("hys-ui-is-drop-target"),
    ),
  );
  check('Drag target has one border with no inset duplicate',await pane('selection','right').evaluate(el=>{const css=getComputedStyle(el);return css.borderTopWidth==='1px'&&css.borderRightWidth==='1px'&&css.borderBottomWidth==='1px'&&css.borderLeftWidth==='1px'&&css.boxShadow==='none'}));
  await pane('selection','right').screenshot({path:'output/playwright/transfer-single-drop-border.png'});
  await page.locator('a[href="/components/hys-select"]').click();
  await page.locator("#scene-basic .hys-ui-select").first().waitFor();
  check(
    "Cached-page leave removes drag state",
    (await page
      .locator(".hys-ui-is-drop-target,.hys-ui-is-dragging")
      .count()) === 0,
  );
  await page.locator('a[href="/components/hys-transfer"]').click();
  await scene("basic").waitFor();
  check(
    "Cached-page return preserves the transferred selection",
    (await scene("basic").locator("output").textContent()).includes(
      "lisa、keller",
    ),
  );
  check(
    "Cached virtual panels restore their internal scroll window",
    await pane("virtual", "left")
      .locator(".hys-ui-pf-transfer-list")
      .evaluate((el) => {
        const box = el.getBoundingClientRect();
        return (
          el.scrollTop > 0 &&
          [...el.querySelectorAll("[data-transfer-key]")].some((row) => {
            const r = row.getBoundingClientRect();
            return r.bottom > box.top && r.top < box.bottom;
          })
        );
      }),
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
      theme + " theme reaches both panels",
      (await pane("basic", "left").getAttribute("data-hys-theme")) === theme &&
        (await pane("basic", "right").getAttribute("data-hys-theme")) === theme,
    );
  }
  await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
  await page.getByRole("option", { name: "科技蓝", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await scene("pagination").scrollIntoViewIfNeeded();
  check(
    "Both paginated panels fit a narrow screen",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await scene("pagination").screenshot({
    path: "output/playwright/transfer-mobile.png",
  });
  check(
    "No Transfer errors or Vue warnings",
    !errors.length && !warnings.length,
  );
  return { checks, errors, warnings };
}
