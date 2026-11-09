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
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  const metrics = () =>
    grid.evaluate((root) => {
      const port = root.querySelector(".hys-ui-pf-grid-scroll"),
        headers = [
          ...root.querySelectorAll("thead tr:first-child th[data-column-key]"),
        ],
        body = root.querySelector("tbody tr"),
        footer = root.querySelector("tfoot tr"),
        filter = root.querySelector(".hys-ui-pf-grid-filter-row"),
        rect = (e) => {
          const r = e.getBoundingClientRect();
          return { left: r.left, width: r.width, right: r.right };
        };
      return {
        columns: headers.map((th) => ({
          key: th.dataset.columnKey,
          head: rect(th),
          body: rect(
            body.querySelector(
              '[data-column-key="' + th.dataset.columnKey + '"]',
            ),
          ),
          footer: rect(
            footer.querySelector(
              '[data-column-key="' + th.dataset.columnKey + '"]',
            ),
          ),
          filter: filter
            ? rect(
                filter.querySelector(
                  '[data-column-key="' + th.dataset.columnKey + '"]',
                ),
              )
            : undefined,
        })),
        top: headers[0].getBoundingClientRect().top,
        portTop: port.getBoundingClientRect().top,
      };
    });
  const aligned = (rows) =>
    rows.every((c) =>
      ["body", "footer", ...(c.filter ? ["filter"] : [])].every(
        (part) =>
          Math.abs(c.head.left - c[part].left) < 1.5 &&
          Math.abs(c.head.width - c[part].width) < 1.5,
      ),
    );
  const visibleFixed = async () => {
    await scroll.scrollIntoViewIfNeeded();
    return grid.evaluate((root) =>
      ["id", "date"].map((key) => {
        const c = root.querySelector('thead th[data-column-key="' + key + '"]'),
          r = c.getBoundingClientRect(),
          hit = document.elementFromPoint(
            r.left + Math.min(r.width / 2, 45),
            r.top + r.height / 2,
          );
        return { key, hit: hit?.closest("th")?.dataset.columnKey };
      }),
    );
  };
  for (const position of [0, 0.5, 1]) {
    await scroll.evaluate(
      (s, p) => (s.scrollLeft = (s.scrollWidth - s.clientWidth) * p),
      position,
    );
    await settle();
    check(
      "Header, body and summary align at horizontal position " + position,
      aligned((await metrics()).columns),
    );
    check(
      "Fixed header contents remain on top at horizontal position " + position,
      (await visibleFixed()).every((v) => v.key === v.hit),
    );
  }
  await scroll.screenshot({
    path: "output/playwright/grid-columns-scrolled.png",
  });
  await grid
    .locator('thead th[data-column-key="id"] .hys-ui-pf-grid-filter')
    .click();
  for (const position of [0, 1]) {
    await scroll.evaluate(
      (s, p) => (s.scrollLeft = (s.scrollWidth - s.clientWidth) * p),
      position,
    );
    await settle();
    check(
      "Filter cells track their headers and data at horizontal position " +
        position,
      aligned((await metrics()).columns),
    );
    check(
      "Open filter row preserves fixed header visibility at " + position,
      (await visibleFixed()).every((v) => v.key === v.hit),
    );
  }
  for (const density of ["紧凑", "宽松", "标准"]) {
    await scene
      .getByRole("combobox", { name: "表格密度", exact: true })
      .click();
    await page.getByRole("option", { name: density, exact: true }).click();
    await settle();
    check(
      density + " density preserves all column geometry",
      aligned((await metrics()).columns),
    );
  }
  await scroll.evaluate((s) => (s.style.maxHeight = "320px"));
  await scroll.evaluate((s) => (s.scrollTop = 180));
  await settle();
  let g = await metrics();
  check(
    "Vertical sticky heading remains pinned without column drift",
    Math.abs(g.top - g.portTop) < 1.5 && aligned(g.columns),
  );
  check(
    "Two-axis scrolling preserves the fixed header stacking",
    (await visibleFixed()).every((v) => v.key === v.hit),
  );
  await scroll.evaluate((s) => {
    s.scrollTop = 0;
    s.style.maxHeight = "";
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await scroll.evaluate((s) => (s.scrollLeft = s.scrollWidth));
  await settle();
  check(
    "Mobile fixed header and body positions stay aligned",
    aligned((await metrics()).columns),
  );
  check("No grid alignment runtime errors", !errors.length);
  return { checks, errors };
}
