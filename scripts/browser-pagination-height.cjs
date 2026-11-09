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
  await page.goto(base + "/components/hys-pagination");
  const scene = page.locator("#scene-basic"),
    pager = scene.locator(".hys-ui-pf-pagination");
  await pager.waitFor();
  const metrics = (locator) =>
    locator.evaluate((root) => {
      const box = (selector) => {
        const e = root.querySelector(selector),
          r = e.getBoundingClientRect();
        return { height: r.height, center: (r.top + r.bottom) / 2 };
      };
      return {
        page: box(".hys-ui-pf-pagination-controls>button"),
        size: box(".hys-ui-pf-pagination-size .hys-ui-select"),
        jump: box(".hys-ui-pf-pagination-jump .hys-ui-ex-number"),
        wrapper: box(".hys-ui-pf-pagination-jump-input"),
        confirm: box(".hys-ui-pf-pagination-jump>button"),
      };
    });
  const aligned = (m) =>
      Object.values(m).every((x) => Math.abs(x.height - 32) < 1),
    centered = (m) =>
      Math.max(...Object.values(m).map((x) => x.center)) -
        Math.min(...Object.values(m).map((x) => x.center)) <
      1;
  let m = await metrics(pager);
  check(
    "Standalone pagination controls have the same thirty-two-pixel height",
    aligned(m),
  );
  check("Standalone jump box and buttons share a center line", centered(m));
  const jump = pager.getByRole("spinbutton", { name: "跳转到", exact: true });
  await jump.focus();
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.keyboard.type("5");
  check(
    "Jump focus retains full-value selection",
    (await jump.inputValue()) === "5",
  );
  check(
    "Jump keeps numeric semantics without plus or minus controls",
    (await pager
      .locator(
        '.hys-ui-pf-pagination-jump [aria-label="增加"],.hys-ui-pf-pagination-jump [aria-label="减少"]',
      )
      .count()) === 0,
  );
  await jump.press("Enter");
  check(
    "Keyboard jump still updates the selected page",
    (await pager
      .getByRole("button", { name: "第 5 页", exact: true })
      .getAttribute("aria-current")) === "page",
  );
  await pager.screenshot({ path: "output/playwright/pagination-aligned.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  m = await metrics(pager);
  check(
    "Narrow pagination retains matching control heights after wrapping",
    aligned(m),
  );
  await pager.screenshot({
    path: "output/playwright/pagination-mobile-aligned.png",
  });
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.goto(base + "/components/hys-data-grid");
  const basic = page.locator("#scene-basic"),
    grid = basic.locator(".hys-ui-pf-grid"),
    footer = grid.locator(".hys-ui-pf-pagination");
  await footer.waitFor();
  m = await metrics(footer);
  check(
    "DataGrid footer does not inflate the jump input",
    aligned(m) && centered(m),
  );
  const density = basic.getByRole("combobox", {
      name: "表格密度",
      exact: true,
    }),
    restore = basic.getByRole("button", { name: "恢复默认列", exact: true });
  check(
    "Density selector matches the adjacent restore button",
    Math.abs(
      (await density.boundingBox()).height -
        (await restore.boundingBox()).height,
    ) < 1 && (await density.boundingBox()).height === 32,
  );
  const toolbar = grid.locator(".hys-ui-pf-grid-toolbar"),
    heights = await toolbar.evaluate((root) =>
      [
        root.querySelector(".hys-ui-input-shell"),
        root.querySelector(".hys-ui-select"),
        root.querySelector('[aria-label="配置显示列"]'),
        [...root.querySelectorAll("button")].find((b) =>
          b.textContent.includes("导出 CSV"),
        ),
      ]
        .filter(Boolean)
        .map((e) => e.getBoundingClientRect().height),
    );
  check(
    "DataGrid toolbar inputs, selects and action buttons share one height",
    heights.length === 4 && heights.every((h) => Math.abs(h - 32) < 1),
  );
  await basic
    .locator(".grid-demo-controls")
    .screenshot({ path: "output/playwright/grid-density-aligned.png" });
  await footer
    .getByRole("spinbutton", { name: "跳转到", exact: true })
    .fill("3");
  await footer.getByRole("button", { name: "确定", exact: true }).click();
  check(
    "Grid pagination still jumps correctly",
    (await footer
      .getByRole("button", { name: "第 3 页", exact: true })
      .getAttribute("aria-current")) === "page",
  );
  check("No pagination runtime errors", !errors.length);
  return { checks, errors };
}
