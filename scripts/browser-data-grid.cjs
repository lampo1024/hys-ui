async page => {
  const base = page.url().includes("github.io") ? new URL(page.url()).origin + "/hys-ui" : "http://127.0.0.1:5174";
  const checks = [], errors = [], warnings = [];
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw new Error(name);
  };
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", event => {
    if (event.type() === "warning" && event.text().includes("[Vue warn]")) warnings.push(event.text());
  });
  page.setDefaultTimeout(12000);
  const scene = name => page.locator("#scene-" + name);
  const row = (scope, token) => scope.locator("[data-grid-row]").filter({ hasText: token });
  const button = (scope, name) => scope.getByRole("button", { name, exact: true });
  const checkbox = (scope, name) => scope.getByRole("checkbox", { name, exact: true });
  const currentPage = scope => scope.locator('[aria-current="page"]').textContent();
  const storageKey = "hys-ui-grid:hys-docs-data-grid-resize";
  const storage = () => page.evaluate(key => localStorage.getItem(key), storageKey);
  const near = (a, b) => Math.abs(a - b) <= 2;
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(key => localStorage.removeItem(key), storageKey);
    await page.goto(base + "/components/hys-data-grid/");
    const controlled = scene("controlled");
    await row(controlled, "库存商品 11").first().waitFor();
    check("Controlled query applies its initial page and nested field", (await currentPage(controlled)).trim() === "2");
    await checkbox(controlled, "接受查询变更").uncheck();
    await button(controlled, "第 3 页").click();
    check("A rejected page keeps the same records", (await currentPage(controlled)).trim() === "2" && await row(controlled, "库存商品 11").count() === 1);
    await checkbox(controlled, "接受查询变更").check();
    await button(controlled, "第 3 页").click();
    check("Accepted pagination changes records", (await currentPage(controlled)).trim() === "3" && await row(controlled, "库存商品 21").count() === 1);
    await button(controlled, "库存量降序").click();
    check("Controlled sort resets the page", (await currentPage(controlled)).trim() === "1" &&
      await controlled.locator('th[data-column-key="units"]').getAttribute("aria-sort") === "descending");
    await button(controlled, "筛选库存量").click();
    const filter = controlled.getByRole("textbox", { name: "过滤库存量", exact: true });
    await filter.fill("42");
    const quantities = await controlled.locator('tbody td[data-column-key="units"]').allTextContents();
    check("Custom filter compares numeric inventory", quantities.length > 0 && quantities.every(value => Number(value) >= 42));
    await filter.press("Escape");
    check("Escape closes filter row and restores focus", await filter.count() === 0 &&
      await button(controlled, "筛选库存量").evaluate(el => document.activeElement === el));

    const selection = scene("selection");
    await checkbox(selection, "选择当前页全部行").check();
    check("Select page preserves numeric and text key types", (await selection.locator("output").textContent()).includes('[0,"0"]'));
    check("Locked row stays disabled", await checkbox(selection, "选择第3行").isDisabled());
    await checkbox(selection, "替换当前数据").check();
    check("Selection keys survive replacement", (await selection.locator("output").textContent()).includes('[0,"0"]'));
    await button(selection, "清空选择").click();
    check("Clear selection removes reserved keys", (await selection.locator("output").textContent()).includes("[]"));
    await checkbox(selection, "替换当前数据").uncheck();
    await checkbox(selection, "单选模式").check();
    await selection.getByRole("radio", { name: "选择第1行", exact: true }).check();
    await selection.getByRole("radio", { name: "选择第2行", exact: true }).check();
    check("Radio mode keeps one typed key", (await selection.locator("output").textContent()).includes('["0"]') &&
      !(await selection.getByRole("radio", { name: "选择第1行", exact: true }).isChecked()));

    const server = scene("server");
    await row(server, "远程任务 21").waitFor();
    check("Managed loader starts on page three", (await currentPage(server)).trim() === "3");
    await checkbox(server, "模拟请求失败").check();
    await button(server, "第 4 页").click();
    await server.getByText("加载失败", { exact: true }).waitFor();
    await checkbox(server, "模拟请求失败").uncheck();
    await button(server, "重试").click();
    await row(server, "远程任务 31").waitFor();
    check("Retry uses the current remote query", (await currentPage(server)).trim() === "4");
    const search = server.getByRole("searchbox", { name: "搜索表格", exact: true });
    await search.fill("远程任务 2");
    await search.fill("远程任务 4");
    await row(server, "远程任务 45").waitFor();
    check("Latest query determines the remote data", (await currentPage(server)).trim() === "1" &&
      (await server.locator("[data-grid-row]").allTextContents()).every(value => value.includes("远程任务 4")));

    const tree = scene("tree");
    check("Tree initially omits collapsed descendants", await tree.locator("[data-grid-row]").count() === 2);
    await button(tree, "展开子行").click();
    check("Expanded tree shows descendants", await tree.locator("[data-grid-row]").count() === 4);
    await button(tree, "折叠子行").click();

    const resize = scene("resize");
    const handle = resize.getByRole("separator", { name: "调整项目列宽", exact: true });
    await handle.scrollIntoViewIfNeeded();
    const point = async () => handle.evaluate(el => {
      const r = el.getBoundingClientRect();
      for (let x = Math.floor(r.left + 1); x < r.right; x++) {
        const y = (r.top + r.bottom) / 2;
        if (document.elementFromPoint(x, y) === el) return { x, y };
      }
      throw new Error("Resize handle is not hit-testable");
    });
    const width = async () => Number(await handle.getAttribute("aria-valuenow"));
    const start = await point();
    const initial = await width();
    const saved = await storage();
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 36, start.y, { steps: 7 });
    await page.waitForFunction(() => document.querySelector('#scene-resize [aria-label="调整项目列宽"]').getAttribute("aria-valuenow") === "306");
    check("Drag previews without persisting", (await storage()) === saved);
    await page.mouse.up();
    check("Pointer release persists the preview width", await width() === initial + 36 && JSON.parse(await storage()).widths.name === initial + 36);
    const committed = await storage();
    const next = await point();
    await page.mouse.move(next.x, next.y);
    await page.mouse.down();
    await page.mouse.move(next.x + 28, next.y, { steps: 5 });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    check("Escape restores the committed width", await width() === initial + 36 && (await storage()) === committed);
    await handle.press("End");
    check("End sets the configured upper bound", await width() === 420);
    await handle.press("Home");
    check("Home sets the configured lower bound", await width() === 120);
    await handle.press("Shift+ArrowRight");
    check("Shift and arrow adjusts by 40 pixels", await width() === 160);

    const port = resize.getByRole("region", { name: "表格滚动区域" });
    await port.evaluate(el => { el.scrollTop = 170; el.scrollLeft = 160; });
    const geometry = await port.evaluate(el => {
      const box = el.getBoundingClientRect();
      const left = el.querySelector('thead [data-column-key="id"]');
      const right = el.querySelector('thead [data-column-key="status"]');
      const a = left.getBoundingClientRect(), b = right.getBoundingClientRect();
      return {
        top: box.top, left: box.left, right: box.left + el.clientWidth, header: a.top,
        pinnedLeft: a.left, pinnedRight: b.right,
        color: getComputedStyle(left).backgroundColor,
        regular: getComputedStyle(el.querySelector('thead [data-column-key="owner"]')).backgroundColor,
        topOffset: el.scrollTop, leftOffset: el.scrollLeft,
      };
    });
    check("Fixed header and columns align after scrolling both axes",
      geometry.topOffset > 0 && geometry.leftOffset > 0 && near(geometry.header, geometry.top) &&
      near(geometry.pinnedLeft, geometry.left + 44) && near(geometry.pinnedRight, geometry.right));
    check("Fixed and scrolling headers share opaque backgrounds", geometry.color === geometry.regular && geometry.color !== "rgba(0, 0, 0, 0)");
    await resize.screenshot({ path: "output/playwright/data-grid-resize-" + (await page.evaluate(() => /Firefox/.test(navigator.userAgent) ? "firefox" : "chrome")) + ".png" });
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await port.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth }));
    check("Narrow screens retain a horizontal table viewport", narrow.width < 390 && narrow.content > narrow.width);
    check("No browser errors", errors.length === 0);
    check("No Vue warnings", warnings.length === 0);
    return { checks, errors, warnings };
  } catch (error) {
    return { checks, errors, warnings, error: String(error) };
  }
}
