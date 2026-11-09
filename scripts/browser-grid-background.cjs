async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    check = (name, pass) => {
      checks.push({ name, pass: !!pass });
      if (!pass) throw Error(name);
    };
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(10000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/components/hys-data-grid");
  const scene = page.locator("#scene-basic"),
    grid = scene.locator(".hys-ui-pf-grid"),
    scroll = grid.locator(".hys-ui-pf-grid-scroll");
  await scene.getByRole("button", { name: "恢复默认列", exact: true }).click();
  await grid.locator('thead th[data-column-key="id"]').waitFor();
  const metrics = () =>
    grid.evaluate((root) => {
      const colors = (selector) =>
          [...root.querySelectorAll(selector)].map(
            (e) => getComputedStyle(e).backgroundColor,
          ),
        ports = root.querySelector(".hys-ui-pf-grid-scroll"),
        left = root.querySelector('thead th[data-column-key="id"]'),
        right = root.querySelector('thead th[data-column-key="date"]');
      return {
        header: colors("thead tr:first-child th"),
        body: colors("tbody tr:first-child td"),
        summary: colors("tfoot td"),
        filter: colors(".hys-ui-pf-grid-filter-row td"),
        leftSticky: getComputedStyle(left).position === "sticky",
        rightSticky: getComputedStyle(right).position === "sticky",
        left: left.getBoundingClientRect().left,
        right: right.getBoundingClientRect().right,
        viewport: ports.getBoundingClientRect().toJSON(),
      };
    });
  const same = (colors) =>
    colors.length > 1 &&
    new Set(colors).size === 1 &&
    colors[0] !== "rgba(0, 0, 0, 0)" &&
    colors[0] !== "transparent";
  for (const [name, theme] of [
    ["科技蓝", "blue"],
    ["深色", "dark"],
    ["清新绿", "green"],
    ["紫色", "purple"],
    ["暖橙", "orange"],
    ["森林", "forest"],
  ]) {
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name, exact: true }).click();
    await scroll.evaluate((s) => (s.scrollLeft = 0));
    await page.mouse.move(5, 5);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    let g = await metrics();
    check(theme + " headers use one opaque surface", same(g.header));
    check(
      theme + " summary cells match across pinned and ordinary columns",
      same(g.summary),
    );
    const before = g.body[0];
    await grid.locator("tbody tr").first().locator("td").first().hover();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    g = await metrics();
    check(
      theme + " hovered fixed and ordinary cells share one surface",
      same(g.body) && g.body[0] !== before,
    );
    await page.mouse.move(5, 5);
    await scroll.evaluate((s) => (s.scrollLeft = s.scrollWidth));
    g = await metrics();
    check(
      theme +
        " scrolling preserves matching header backgrounds and pinned edges",
      same(g.header) &&
        g.leftSticky &&
        g.rightSticky &&
        Math.abs(g.left - (g.viewport.left + 44)) < 2 &&
        Math.abs(g.right - g.viewport.right) < 2,
    );
  }
  await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
  await page.getByRole("option", { name: "科技蓝", exact: true }).click();
  await scroll.evaluate((s) => (s.scrollLeft = 0));
  await grid.getByRole("checkbox", { name: "选择第1行", exact: true }).check();
  check(
    "Row selection does not change fixed-column surface consistency",
    same((await metrics()).body),
  );
  await grid
    .locator('thead th[data-column-key="id"] .hys-ui-pf-grid-filter')
    .click();
  check(
    "Filter row also has consistent opaque fixed surfaces",
    same((await metrics()).filter),
  );
  await grid
    .locator("thead")
    .screenshot({ path: "output/playwright/grid-fixed-header.png" });
  await grid.evaluate((root) =>
    root.style.setProperty("--hys-ui-surface-secondary", "#d7e7f9"),
  );
  check(
    "Custom header surface overrides apply to every fixed and regular cell",
    same((await metrics()).header) &&
      (await metrics()).header[0] === "rgb(215, 231, 249)",
  );
  await grid.evaluate((root) =>
    root.style.removeProperty("--hys-ui-surface-secondary"),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await scroll.evaluate((s) => (s.scrollLeft = s.scrollWidth));
  check(
    "Narrow horizontally scrolled headers retain a matching background",
    same((await metrics()).header),
  );
  check("No DataGrid runtime errors", !errors.length);
  return { checks, errors };
}
