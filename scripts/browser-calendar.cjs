async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    warnings = [];
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "warning" && e.text().includes("[Vue warn]"))
      warnings.push(e.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-calendar");
  const scene = (name) => page.locator("#scene-" + name),
    chart = (name) => scene(name).locator(".hys-ui-calendar"),
    date = (name, day) => chart(name).locator('[data-date="' + day + '"]');
  await chart("configure").waitFor();
  check(
    "Dedicated examples have descriptive contents titles",
    (await page
      .locator(".doc-toc a")
      .filter({ hasText: "进阶用法" })
      .count()) === 0,
  );
  check(
    "Month grids start Monday by default",
    (
      await chart("configure").getByRole("columnheader").allTextContents()
    )[0] === "周一",
  );
  check(
    "Fixed weeks render forty-two date cells",
    (await chart("configure").locator("[data-date]").count()) === 42,
  );
  const years = chart("configure").getByRole("combobox", {
    name: "年",
    exact: true,
  });
  await years.click();
  await page.getByRole("option", { name: "2028年", exact: true }).click();
  check(
    "Year dropdown locates another year",
    (await chart("configure").locator("header").textContent()).includes(
      "2028年11月",
    ),
  );
  const months = chart("configure").getByRole("combobox", {
    name: "月",
    exact: true,
  });
  await months.click();
  await page.getByRole("option", { name: "二月", exact: true }).click();
  check(
    "Month dropdown displays leap day",
    (await date("configure", "2028-02-29").count()) === 1,
  );
  await date("selection", "2026-11-10").locator(".hys-ui-calendar-day").click();
  check(
    "Date-valued models retain local date fields",
    (await scene("selection").locator("output").textContent()).includes(
      "2026/11/10",
    ),
  );
  await chart("year").locator('[data-month="2"] .hys-ui-calendar-day').click();
  check(
    "Year mode selects a month while preserving its day",
    (await scene("year").locator("output").textContent()).includes(
      "2026-02-09",
    ),
  );
  await chart("year").getByRole("radio", { name: "月", exact: true }).click();
  check(
    "Controlled mode switches back to dates",
    (await chart("year")
      .locator('[data-date="2026-02-09"]')
      .getAttribute("aria-selected")) === "true",
  );
  check(
    "Card mode fits its compact container",
    (await chart("card").boundingBox()).width <= 361,
  );
  const eventDay = date("events", "2026-11-09");
  check(
    "Busy dates show only the configured event rows",
    (await eventDay.locator(".hys-ui-calendar-event").count()) === 2,
  );
  check(
    "Multi-day events appear on intersecting days",
    (await date("events", "2026-11-11").textContent()).includes("设计工作坊"),
  );
  await eventDay.locator(".hys-ui-calendar-more").click();
  const popup = page.locator(".hys-ui-calendar-popup");
  await popup.waitFor();
  check(
    "Overflow list contains every event",
    (await popup.locator(".hys-ui-calendar-event").count()) === 7,
  );
  await popup
    .locator(".hys-ui-calendar-event")
    .filter({ hasText: "需求讨论" })
    .click();
  check(
    "Event actions report the clicked day",
    (await scene("events").locator("output").textContent()).includes(
      "2026-11-09 · 需求讨论",
    ),
  );
  check(
    "Individually disabled events remain disabled",
    (await popup.locator(".hys-ui-calendar-event:disabled").count()) === 1,
  );
  await page.keyboard.press("Escape");
  check("Escape removes the event popup", (await popup.count()) === 0);
  await scene("custom")
    .getByRole("button", { name: "预约", exact: true })
    .click();
  check(
    "Custom cell controls act independently",
    (await scene("custom").locator("output").textContent()).includes(
      "2026-11-09 · 已预约",
    ),
  );
  await date("custom", "2026-11-10").click({ position: { x: 8, y: 40 } });
  check(
    "Date cell background also supports selection",
    (await scene("custom").locator("output").textContent()).includes(
      "2026-11-10",
    ),
  );
  check(
    "Display ranges align to full weeks",
    (await chart("range")
      .locator("[data-date]")
      .first()
      .getAttribute("data-date")) === "2026-11-23" &&
      (await chart("range")
        .locator("[data-date]")
        .last()
        .getAttribute("data-date")) === "2026-12-13",
  );
  check(
    "Padding outside fixed ranges is disabled",
    (await date("range", "2026-11-23").getAttribute("aria-disabled")) ===
      "true",
  );
  await date("range", "2026-12-05").locator(".hys-ui-calendar-day").click();
  check(
    "Cross-month range dates can be selected",
    (await scene("range").locator("output").textContent()).includes(
      "2026-12-05",
    ),
  );
  check(
    "Navigation respects the valid range",
    await chart("limits")
      .getByRole("button", { name: "上一月", exact: true })
      .isDisabled(),
  );
  await date("limits", "2026-11-06").focus();
  await page.keyboard.press("ArrowRight");
  check(
    "Keyboard focus skips disabled weekends",
    (await page.evaluate(() => document.activeElement.dataset.date)) ===
      "2026-11-09",
  );
  await page.keyboard.press("Enter");
  check(
    "Keyboard selection is committed explicitly",
    (await scene("limits").locator("output").textContent()).includes(
      "2026-11-09",
    ),
  );
  await scene("locale").getByRole("combobox").first().click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await scene("locale").getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "星期日", exact: true }).click();
  check(
    "Locale and week-start changes update headings",
    (await chart("locale").getByRole("columnheader").allTextContents())
      .slice(0, 2)
      .join(",") === "Wk,Sun",
  );
  await scene("methods")
    .getByRole("button", { name: "选择 2028 闰日", exact: true })
    .click();
  check(
    "Instance date selection reaches a valid leap day",
    (await scene("methods").locator("output").textContent()).includes(
      "2028-02-29 已选中闰日",
    ),
  );
  await scene("methods")
    .getByRole("button", { name: "聚焦日历", exact: true })
    .click();
  await page.keyboard.press("ArrowRight");
  check(
    "Cross-month keyboard moves focus without selecting",
    (await page.evaluate(() => document.activeElement.dataset.date)) ===
      "2028-03-01" &&
      (await scene("methods").locator("output").textContent()).includes(
        "2028-02-29",
      ),
  );
  await page.keyboard.press("Enter");
  await date("states", "2026-11-10").locator(".hys-ui-calendar-day").click();
  check(
    "Readonly blocks date writes",
    (await date("states", "2026-11-09").getAttribute("aria-selected")) ===
      "true",
  );
  await scene("states")
    .getByRole("checkbox", { name: "禁用", exact: true })
    .check();
  check(
    "Disabled state blocks navigation",
    await chart("states")
      .getByRole("button", { name: "下一月", exact: true })
      .isDisabled(),
  );
  await scene("states")
    .getByRole("checkbox", { name: "禁用", exact: true })
    .uncheck();
  await scene("states")
    .getByRole("checkbox", { name: "加载中", exact: true })
    .check();
  check(
    "Loading exposes busy semantics",
    (await chart("states").getAttribute("aria-busy")) === "true",
  );
  await scene("states")
    .getByRole("checkbox", { name: "加载中", exact: true })
    .uncheck();
  await chart("configure").screenshot({
    path: "output/playwright/calendar-month.png",
  });
  await chart("year").getByRole("radio", { name: "年", exact: true }).click();
  await chart("year").screenshot({
    path: "output/playwright/calendar-year.png",
  });
  await eventDay.locator(".hys-ui-calendar-more").click();
  await page.locator('a[href="/components/hys-select"]').click();
  await page.locator("#scene-manyoptions").waitFor();
  check(
    "Leaving a cached page removes event overlays",
    (await popup.count()) === 0,
  );
  await page.locator('a[href="/components/hys-calendar"]').click();
  await chart("configure").waitFor();
  check(
    "Cached calendars retain navigated months",
    (await chart("configure").locator("header").textContent()).includes(
      "2028年2月",
    ),
  );
  for (const [name, theme] of [['深色','dark'],['清新绿','green'],['紫色','purple'],['暖橙','orange'],['森林','forest'],['科技蓝','blue']]) {
    await page.getByRole('combobox',{name:'文档主题',exact:true}).click();
    await page.getByRole('option',{name,exact:true}).click();
    await date('events','2026-11-09').locator('.hys-ui-calendar-more').click();
    check('Calendar event popup follows '+theme+' theme', await popup.getAttribute('data-hys-theme')===theme && await chart('events').getAttribute('data-hys-theme')===theme);
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  check(
    "Calendar docs fit a narrow viewport",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await chart("card").screenshot({
    path: "output/playwright/calendar-mobile.png",
  });
  check('Compact selectors retain readable year and month labels', await chart('card').locator('.hys-ui-select-single-label').evaluateAll(labels=>labels.every(label=>label.scrollWidth<=label.clientWidth+1)));
  await date("events", "2026-11-09").locator(".hys-ui-calendar-more").click();
  const box = await popup.boundingBox();
  check(
    "Mobile overflow list remains inside the viewport",
    box.x >= 8 && box.x + box.width <= 382,
  );
  await page.keyboard.press("Escape");
  check(
    "No Calendar runtime errors or Vue warnings",
    !errors.length && !warnings.length,
  );
  return { checks, errors, warnings };
}
