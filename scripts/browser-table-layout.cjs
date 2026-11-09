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
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.goto(base + "/components/hys-table");
  const scene = (n) => page.locator("#scene-" + n),
    table = (n) => scene(n).locator(".hys-ui-table").first(),
    fixed = table("fixed"),
    port = fixed.locator(".hys-ui-table-scroll");
  await fixed.waitFor();
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  const same = (values) =>
    values.length > 1 &&
    new Set(values).size === 1 &&
    !["transparent", "rgba(0, 0, 0, 0)"].includes(values[0]);
  const colors = () =>
    fixed.evaluate((root) => {
      const read = (s) =>
        [...root.querySelectorAll(s)].map(
          (e) => getComputedStyle(e).backgroundColor,
        );
      return {
        head: read("thead th"),
        row: read("tbody tr[data-row-key]:first-child td"),
        foot: read("tfoot td"),
      };
    });
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
    await port.evaluate((e) => {
      e.scrollLeft = 0;
      e.scrollTop = 0;
    });
    await fixed
      .locator("tbody tr[data-row-key]")
      .first()
      .locator("td")
      .first()
      .hover();
    await settle();
    const c = await colors();
    check(
      theme + " keeps fixed and ordinary cell backgrounds consistent",
      same(c.head) && same(c.row) && same(c.foot),
    );
    await table("filters")
      .getByRole("button", { name: "筛选姓名", exact: true })
      .click();
    check(
      theme + " filter layer inherits theme",
      (await page
        .locator(".hys-ui-table-filter-panel")
        .getAttribute("data-hys-theme")) === theme,
    );
    await page.keyboard.press("Escape");
  }
  await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
  await page.getByRole("option", { name: "科技蓝", exact: true }).click();
  await port.evaluate((e) => {
    e.scrollTop = 0;
    e.scrollLeft = 0;
  });
  await settle();
  check(
    "Numeric cell alignment positions content at the right edge",
    await fixed
      .locator("tbody tr[data-row-key]")
      .first()
      .locator('[data-column-key="budget"]')
      .evaluate((td) => {
        const span = td.querySelector(".hys-ui-table-cell-text");
        return (
          Math.abs(
            td.getBoundingClientRect().right -
              parseFloat(getComputedStyle(td).paddingRight) -
              span.getBoundingClientRect().right,
          ) < 2
        );
      }),
  );
  const grouped = table("grouped");
  await grouped.evaluate((e) => (e.style.maxWidth = "430px"));
  const gv = grouped.locator(".hys-ui-table-scroll");
  await gv.evaluate((e) => (e.scrollLeft = e.scrollWidth));
  await settle();
  check(
    "Grouped fixed leaf headings align after horizontal scroll",
    await grouped.evaluate((root) =>
      [...root.querySelectorAll("th[data-leaf]")].every((th) => {
        const td = root.querySelector(
          'tbody tr[data-row-key] [data-column-key="' +
            th.dataset.columnKey +
            '"]',
        );
        return (
          Math.abs(
            td.getBoundingClientRect().left - th.getBoundingClientRect().left,
          ) < 2
        );
      }),
    ),
  );
  await grouped.evaluate((e) => (e.style.maxWidth = ""));
  const resize = table("resize"),
    head = resize.locator('th[data-column-key="name"]'),
    handle = resize.getByRole("separator", {
      name: "调整姓名列宽",
      exact: true,
    });
  await handle.scrollIntoViewIfNeeded();
  const before = (await head.boundingBox()).width,
    b = await handle.boundingBox();
  await page.mouse.move(b.x + 4, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + 94, b.y + b.height / 2, { steps: 4 });
  await settle();
  check(
    "Column resize previews before committing",
    (await head.boundingBox()).width > before + 50,
  );
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await settle();
  check(
    "Escape cancels resizing without changing accepted width",
    Math.abs((await head.boundingBox()).width - before) < 2 &&
      (await scene("resize").locator("output").textContent()).includes(
        "拖动列右侧边缘",
      ),
  );
  const slider = scene("responsive").getByRole("slider");
  await slider.focus();
  await page.keyboard.press("Home");
  await settle();
  check(
    "Container responsive columns hide secondary fields",
    (await table("responsive").locator("col").count()) === 2,
  );
  await page.keyboard.press("End");
  await settle();
  check(
    "Expanding a container restores hidden fields",
    (await table("responsive").locator("col").count()) === 4,
  );
  check(
    "Localized selection and sorting labels are available",
    (await table("locale")
      .getByRole("checkbox", { name: "Select current page", exact: true })
      .count()) === 1 &&
      (await table("locale")
        .getByRole("button", { name: "Sort Age ascending", exact: true })
        .count()) === 1,
  );
  await scene("locale")
    .getByRole("checkbox", { name: "空数据", exact: true })
    .check();
  check(
    "Locale overrides the built-in empty state",
    (await table("locale").textContent()).includes("No data"),
  );
  await scene("states")
    .getByRole("checkbox", { name: "空数据", exact: true })
    .check();
  check(
    "Custom empty slot keeps semantic content",
    (await table("states").textContent()).includes("还没有成员"),
  );
  await scene("states")
    .getByRole("checkbox", { name: "加载中", exact: true })
    .check();
  check(
    "Loading exposes busy and status semantics",
    (await table("states").getAttribute("aria-busy")) === "true" &&
      (await table("states").getByRole("status").count()) === 1,
  );
  await table("overflow")
    .locator('[data-column-key="note"] .hys-ui-table-cell-text')
    .first()
    .focus();
  await page.getByRole("tooltip").waitFor();
  await page.locator('a[href="/components/hys-select"]').click();
  await page.locator("#scene-basic").waitFor();
  check(
    "Cached-page navigation clears keyboard-opened overflow layers",
    (await page.getByRole("tooltip").count()) === 0,
  );
  await page.locator('a[href="/components/hys-table"]').click();
  await fixed.waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await table("filters")
    .getByRole("button", { name: "筛选姓名", exact: true })
    .click();
  let box = await page.locator(".hys-ui-table-filter-panel").boundingBox();
  check(
    "Mobile filter layer fits the viewport",
    box.x >= 8 && box.x + box.width <= 382,
  );
  await page.keyboard.press("Escape");
  await settle();
  check(
    "No horizontal document overflow after interactive scenarios",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  check("No layout runtime errors", !errors.length);
  return { checks, errors };
}
