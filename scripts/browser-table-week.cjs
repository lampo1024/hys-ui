async (page) => {
  const base = page.url().includes("github.io")
    ? new URL(page.url()).origin + "/hys-ui"
    : "http://127.0.0.1:5174";
  const checks = [],
    errors = [],
    warnings = [];
  const check = (name, ok) => {
    checks.push({ name, pass: !!ok });
    if (!ok) throw Error(name);
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "warning" && e.text().includes("[Vue warn]"))
      warnings.push(e.text());
  });
  page.setDefaultTimeout(15000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1680, height: 1000 });
  const scene = (n) => page.locator("#scene-" + n),
    table = (n) => scene(n).locator(".hys-ui-table"),
    popup = () => page.locator(".hys-ui-date-popup[role=dialog]"),
    date = (value) => popup().locator('[data-date="' + value + '"]'),
    settle = () =>
      page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
  await page.goto(base + "/components/hys-date-picker/");
  for (const name of [
    "weeks",
    "weekmultiple",
    "weekyear",
    "weekrules",
    "weekbounds",
  ]) {
    await scene(name).locator(".hys-ui-date-control").waitFor();
    check(
      "Dedicated week example " + name,
      (await scene(name).locator("h2").count()) === 1,
    );
  }
  await scene("weeks").locator(".hys-ui-date-trigger").click();
  await popup().waitFor();
  await popup()
    .locator(".hys-ui-date-week-number button")
    .filter({ hasText: "46" })
    .click();
  await popup().waitFor({ state: "hidden" });
  check(
    "Week number selects complete week and reports its dates",
    (await scene("weeks").locator("output").textContent()).includes(
      "2026-11-09 至 2026-11-15",
    ),
  );
  await scene("weeks").locator(".hys-ui-date-trigger").click();
  check(
    "All seven days in selected week are highlighted",
    (await popup().locator("[data-date][aria-selected=true]").count()) === 7,
  );
  await date("2026-11-18").hover();
  check(
    "Hover previews a complete week",
    (await popup().locator(".hys-ui-date-week-hover [data-date]").count()) ===
      7,
  );
  await popup().screenshot({
    path:
      "output/playwright/weeks-panel-" +
      page.context().browser().browserType().name() +
      ".png",
  });
  await page.keyboard.press("Escape");
  await scene("weekmultiple").locator(".hys-ui-date-trigger").click();
  await date("2026-11-25").click();
  check(
    "Multi-week draft does not commit early",
    !(await scene("weekmultiple").locator("output").textContent()).includes(
      "2026-11-23",
    ),
  );
  await popup().getByRole("button", { name: "确定", exact: true }).click();
  check(
    "Multi-week confirmation commits start dates",
    (await scene("weekmultiple").locator("output").textContent()).includes(
      "2026-11-23",
    ),
  );
  await scene("weekyear").locator(".hys-ui-date-input").click();
  check(
    "New Year day shares the previous ISO week-year",
    (await date("2021-01-01").getAttribute("aria-selected")) === "true",
  );
  await popup()
    .getByRole("button", { name: "2021 年第一周", exact: true })
    .click();
  await popup().waitFor({ state: "hidden" });
  check(
    "Week-year shortcut round trips through formatted binding",
    (await scene("weekyear").locator("output").textContent()).includes(
      "2021-W01",
    ),
  );
  await scene("weekrules")
    .getByRole("combobox", { name: "周编号规则", exact: true })
    .click();
  await page
    .getByRole("option", {
      name: "星期日开始，包含 1 月 1 日为第一周",
      exact: true,
    })
    .click();
  await scene("weekrules").locator(".hys-ui-date-trigger").click();
  check(
    "Custom week rule marks Sunday as week start",
    (await date("2026-12-27").getAttribute("aria-selected")) === "true",
  );
  const weekNumber = popup()
    .locator(".hys-ui-date-week-number button")
    .filter({ hasText: "W01" });
  check(
    "Week number formatter follows custom rule",
    (await weekNumber.count()) === 1,
  );
  check(
    "Cross-year week number reports correct week-year",
    (await weekNumber.getAttribute("aria-label")).startsWith("2027 "),
  );
  await page.keyboard.press("Escape");
  await scene("weekbounds").locator(".hys-ui-date-trigger").click();
  check(
    "Full validation disables incomplete boundary weeks",
    (await date("2026-11-04").isDisabled()) &&
      (await date("2026-11-24").isDisabled()),
  );
  check(
    "Business rule disables the entire unavailable week",
    await date("2026-11-18").isDisabled(),
  );
  check(
    "Complete available week stays selectable",
    !(await date("2026-11-10").isDisabled()),
  );
  await page.keyboard.press("Escape");
  await scene("weekbounds").getByRole("checkbox").uncheck();
  await scene("weekbounds").locator(".hys-ui-date-trigger").click();
  check(
    "Any-day validation permits incomplete boundary week",
    !(await date("2026-11-04").isDisabled()),
  );
  await page.keyboard.press("Escape");
  await page.goto(base + "/components/hys-date-range-picker/");
  await scene("weeks").locator(".hys-ui-date-trigger").waitFor();
  check(
    "Week range uses one trigger",
    (await scene("weeks").locator(".hys-ui-date-trigger").count()) === 1,
  );
  await scene("weeks").locator(".hys-ui-date-trigger").click();
  check(
    "Week range uses dual calendar panels",
    (await popup().locator(".hys-ui-date-panel").count()) === 2,
  );
  await date("2026-11-25").first().click();
  await date("2026-11-10").first().click();
  await popup().waitFor({ state: "hidden" });
  check(
    "Reverse weekly range is ordered and covers last Sunday",
    (await scene("weeks").locator("output").textContent()).includes(
      "2026-11-09 至 2026-11-29",
    ),
  );
  await page.goto(base + "/components/hys-table/");
  for (const name of [
    "layout",
    "sortfields",
    "selectioncustom",
    "filtercontrol",
    "expandcustom",
    "updatechildren",
    "scroll",
  ]) {
    await table(name).waitFor();
    check(
      "Dedicated Table example " + name,
      (await scene(name).locator("h2").count()) === 1,
    );
  }
  await scene("layout").getByRole("combobox").click();
  await page.getByRole("option", { name: "按内容布局", exact: true }).click();
  check(
    "Auto layout is reflected in browser computed style",
    (await table("layout")
      .locator("table")
      .evaluate((el) => getComputedStyle(el).tableLayout)) === "auto",
  );
  check(
    "Header row styles reach every header cell",
    await table("layout")
      .locator("thead th")
      .evaluateAll((cells) =>
        cells.every(
          (el) =>
            getComputedStyle(el).backgroundColor ===
            getComputedStyle(el.parentElement).backgroundColor,
        ),
      ),
  );
  await table("selectioncustom")
    .getByRole("checkbox", { name: "全选", exact: true })
    .check();
  check(
    "Custom selection controls apply bulk rules",
    (await table("selectioncustom").locator("tbody input:checked").count()) ===
      2,
  );
  check(
    "Business-locked selection stays disabled",
    await table("selectioncustom")
      .locator('[data-row-key="2"] input')
      .isDisabled(),
  );
  await scene("filtercontrol")
    .getByRole("button", { name: "打开姓名筛选", exact: true })
    .click();
  const filter = page.locator(".hys-ui-table-filter-panel");
  await filter
    .getByRole("textbox", { name: "姓名关键词", exact: true })
    .fill("张");
  await filter.getByRole("button", { name: "应用", exact: true }).click();
  check(
    "Continuous filter apply keeps its panel visible",
    await filter.isVisible(),
  );
  check(
    "Continuous filter updates table rows",
    (await table("filtercontrol").locator("tbody tr[data-row-key]").count()) ===
      1,
  );
  await filter.getByRole("button", { name: "清空草稿", exact: true }).click();
  check(
    "Clearing a draft does not clear applied filter",
    (await table("filtercontrol").locator("tbody tr[data-row-key]").count()) ===
      1,
  );
  await filter.getByRole("button", { name: "应用", exact: true }).click();
  check(
    "Applying empty draft resets results",
    (await table("filtercontrol").locator("tbody tr[data-row-key]").count()) ===
      3,
  );
  await filter.getByRole("button", { name: "完成", exact: true }).click();
  check("Controlled filter closes", (await filter.count()) === 0);
  await table("expandcustom")
    .locator("tbody .hys-ui-table-expand")
    .first()
    .click();
  check(
    "Custom expansion icon retains built-in behavior",
    (await table("expandcustom").locator(".hys-ui-table-detail").count()) === 1,
  );
  await scene("expandcustom").getByRole("checkbox").uncheck();
  check(
    "Expansion column may be hidden without losing detail",
    (await table("expandcustom").locator(".hys-ui-table-expand").count()) ===
      0 &&
      (await table("expandcustom").locator(".hys-ui-table-detail").count()) ===
        1,
  );
  await scene("updatechildren")
    .getByRole("button", { name: "更新目录任务", exact: true })
    .click();
  check(
    "Manual child updates immediately replace expanded data",
    (await table("updatechildren")
      .locator("tbody tr[data-row-key]")
      .count()) === 3,
  );
  await scene("updatechildren")
    .getByRole("button", { name: "清空子项", exact: true })
    .click();
  check(
    "Empty child updates remove descendants and expansion control",
    (await table("updatechildren")
      .locator("tbody tr[data-row-key]")
      .count()) === 1 &&
      (await table("updatechildren")
        .locator(".hys-ui-table-expand")
        .count()) === 0,
  );
  await scene("scroll")
    .getByRole("button", { name: "定位任务 25", exact: true })
    .click();
  await page.waitForTimeout(450);
  await settle();
  const centered = await table("scroll").evaluate((el) => {
    const port = el.querySelector(".hys-ui-table-scroll"),
      row = el.querySelector('[data-row-key="25"]'),
      a = port.getBoundingClientRect(),
      b = row.getBoundingClientRect();
    return port.scrollTop > 0 && b.top >= a.top && b.bottom <= a.bottom;
  });
  check("Row scrolling targets the internal viewport", centered);
  await scene("scroll")
    .getByRole("button", { name: "滚动到右侧", exact: true })
    .click();
  check(
    "Horizontal API scroll keeps fixed column in place",
    await table("scroll").evaluate((el) => {
      const p = el.querySelector(".hys-ui-table-scroll"),
        c = el.querySelector('tbody [data-column-key="id"]');
      return (
        p.scrollLeft > 0 &&
        Math.abs(
          p.getBoundingClientRect().left - c.getBoundingClientRect().left,
        ) < 2
      );
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  check(
    "Table documentation does not overflow a narrow screen",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.goto(base + "/components/hys-date-picker/");
  await scene("weekrules").locator(".hys-ui-date-trigger").waitFor();
  await scene("weeks").locator(".hys-ui-date-trigger").click();
  const box = await popup().boundingBox();
  check(
    "Week calendar remains inside narrow viewport",
    box && box.x >= 0 && box.x + box.width <= 391,
  );
  await page.keyboard.press("Escape");
  check(
    "No runtime errors or Vue warnings",
    !errors.length && !warnings.length,
  );
  return { base, checks, errors, warnings };
}