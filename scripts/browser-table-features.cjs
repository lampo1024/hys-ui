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
  page.setDefaultTimeout(15000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-table");
  const scene = (name) => page.locator("#scene-" + name),
    table = (name) => scene(name).locator(".hys-ui-table"),
    panel = () => page.locator(".hys-ui-table-filter-panel"),
    data = (name) => table(name).locator("tbody tr[data-row-key]");
  await table("filtersearch").waitFor();
  await table("filtersearch")
    .getByRole("button", { name: "筛选协作团队", exact: true })
    .click();
  await panel().getByRole("tree").waitFor();
  await panel()
    .getByRole("checkbox", { name: "勾选 前端研发", exact: true })
    .waitFor();
  check(
    "Hierarchical filters use the custom accessible tree",
    (await panel().getByRole("treeitem").count()) === 7,
  );
  await panel()
    .getByRole("checkbox", { name: "勾选 技术中心", exact: true })
    .check();
  await panel().getByRole("button", { name: "应用", exact: true }).click();
  check(
    "Selecting a filter group includes descendant teams",
    (await scene("filtersearch").locator("output").textContent()).includes(
      "web",
    ) &&
      (
        await table("filtersearch")
          .locator(".hys-ui-pf-pagination-total")
          .textContent()
      ).includes("12"),
  );
  await table("filtersearch")
    .getByRole("button", { name: "筛选协作团队", exact: true })
    .click();
  await panel()
    .getByRole("textbox", { name: "搜索筛选项", exact: true })
    .fill("后端");
  check(
    "Tree search retains the ancestor and matching option",
    (await panel().getByRole("treeitem").count()) === 2,
  );
  await page.keyboard.press("Escape");
  check("Escape closes filter dialogs", (await panel().count()) === 0);
  await scene("filtersearch")
    .getByRole("button", { name: "查看全部成员", exact: true })
    .click();
  await table("filtersearch")
    .getByRole("button", { name: "筛选办公城市", exact: true })
    .click();
  await panel()
    .getByRole("textbox", { name: "搜索筛选项", exact: true })
    .fill("成都");
  await panel().getByRole("radio", { name: "成都", exact: true }).check();
  await panel().getByRole("button", { name: "应用", exact: true }).click();
  check(
    "Searchable single filters apply exact typed values",
    (await scene("filtersearch").locator("output").textContent()).includes(
      "7",
    ) && (await data("filtersearch").count()) === 2,
  );
  await table("filtersearch")
    .getByRole("button", { name: "筛选办公城市", exact: true })
    .click();
  await panel().getByRole("button", { name: "重置", exact: true }).click();
  check(
    "Reset restores the configured default value",
    (await scene("filtersearch").locator("output").textContent()).includes("0"),
  );
  const boxes = table("selectionactions").locator("tbody input[type=checkbox]");
  await boxes.nth(0).check();
  await boxes.nth(4).click({ modifiers: ["Shift"] });
  check(
    "Real Shift-click selects the visible enabled interval",
    (await scene("selectionactions").locator("output").textContent()).includes(
      "1、2、4、5",
    ),
  );
  check(
    "Disabled row is skipped by range selection",
    !(await boxes.nth(2).isChecked()),
  );
  await table("selectionactions")
    .getByRole("button", { name: "反选当前页", exact: true })
    .click();
  check(
    "Invert selection replaces just current-page membership",
    (await scene("selectionactions").locator("output").textContent()).includes(
      "6、7",
    ),
  );
  await table("selectionactions")
    .getByRole("button", { name: "下一页", exact: true })
    .click();
  await table("selectionactions")
    .locator("tbody input[type=checkbox]")
    .first()
    .check();
  await table("selectionactions")
    .getByRole("button", { name: "反选当前页", exact: true })
    .click();
  check(
    "Page inversion preserves previous-page selection",
    (await scene("selectionactions").locator("output").textContent()).includes(
      "6、7",
    ),
  );
  await table("selectionactions")
    .getByRole("button", { name: "清空选择", exact: true })
    .click();
  check(
    "Clear removes selections from every page",
    (await scene("selectionactions").locator("output").textContent()).includes(
      "无",
    ),
  );
  await scene("pagination")
    .getByRole("checkbox", { name: "同时显示顶部和底部", exact: true })
    .check();
  check(
    "Pagination can render top and bottom navigators",
    (await table("pagination").locator(".hys-ui-table-pagination").count()) ===
      2,
  );
  const pagers = table("pagination").locator(".hys-ui-table-pagination");
  await pagers
    .first()
    .getByRole("button", { name: "下一页", exact: true })
    .click();
  check(
    "Both pagers share the controlled current page",
    (await pagers.nth(1).locator(".hys-ui-is-current").textContent()) === "2",
  );
  check(
    "Paginator content fits its own container",
    await pagers.evaluateAll((elements) =>
      elements.every((el) => el.scrollWidth <= el.clientWidth + 1),
    ),
  );
  const viewport = table("pagination").locator(".hys-ui-table-scroll");
  await viewport.evaluate((el) => {
    el.scrollTop = 100;
    el.scrollLeft = 0;
  });
  await pagers
    .last()
    .getByRole("button", { name: "下一页", exact: true })
    .click();
  check(
    "Changing query restores the vertical scroll position",
    (await viewport.evaluate((el) => el.scrollTop)) === 0,
  );
  const headers = table("attributes").locator("tbody th[scope=row]");
  check(
    "Row scope renders native semantic row headings",
    (await headers.count()) === 3,
  );
  await table("attributes")
    .locator("tbody tr")
    .first()
    .locator("[data-column-key=amount]")
    .dblclick();
  check(
    "Custom cell events remain merged with table events",
    (await scene("attributes").locator("output").textContent()).includes(
      "产品设计：¥ 18000",
    ),
  );
  check(
    "Custom row and header attributes reach their native elements",
    (await table("attributes")
      .locator("tbody tr")
      .first()
      .getAttribute("data-state")) === "已确认" &&
      (await table("attributes")
        .locator("thead th")
        .first()
        .getAttribute("title")) === "列：交付内容",
  );
  await table("selectionactions").screenshot({
    path: "output/playwright/table-selection-actions.png",
  });
  await scene("pagination").screenshot({
    path: "output/playwright/table-pagination-layout.png",
  });
  await table("filtersearch")
    .getByRole("button", { name: "筛选协作团队", exact: true })
    .click();
  await panel().getByRole("tree").waitFor();
  await panel().screenshot({ path: "output/playwright/table-tree-filter.png" });
  await page.locator('a[href="/components/hys-select"]').click();
  check(
    "Cached page leave removes filter portals",
    (await panel().count()) === 0,
  );
  await page.locator('a[href="/components/hys-table"]').click();
  await table("pagination").waitFor();
  check(
    "Returning to Table preserves pagination state",
    (await scene("pagination").locator("output").textContent()).includes("3"),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await table("filtersearch")
    .getByRole("button", { name: "筛选协作团队", exact: true })
    .click();
  await panel().getByRole("tree").waitFor();
  const bounds = await panel().boundingBox();
  check(
    "Filter dialogs stay inside narrow viewport edges",
    bounds.x >= 0 && bounds.x + bounds.width <= 391,
  );
  await page.keyboard.press("Escape");
  check(
    "Enhanced examples do not overflow the mobile document",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  check(
    "Mobile pagination controls are not clipped",
    await page
      .locator(".hys-ui-table-pagination")
      .evaluateAll((elements) =>
        elements.every((el) => el.scrollWidth <= el.clientWidth + 1),
      ),
  );
  await table("selectionactions").screenshot({
    path: "output/playwright/table-features-mobile.png",
  });
  check(
    "No feature runtime errors or Vue warnings",
    !errors.length && !warnings.length,
  );
  return { checks, errors, warnings };
}