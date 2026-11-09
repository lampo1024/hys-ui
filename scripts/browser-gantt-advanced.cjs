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
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (event) => {
    if (event.type() === "warning" && event.text().includes("[Vue warn]"))
      warnings.push(event.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-gantt");
  const large = page.locator("#scene-largedata"),
    chart = large.locator(".hys-ui-pg-gantt"),
    viewport = chart.locator(".hys-ui-pg-scroll");
  const rows = chart.locator(".hys-ui-pg-row"),
    labels = chart.locator(".hys-ui-pg-task-label");
  await rows.first().waitFor();
  const layout = () =>
    chart.evaluate((el) => {
      const port = el.querySelector(".hys-ui-pg-scroll"),
        names = [...el.querySelectorAll(".hys-ui-pg-task-label")],
        rows = [...el.querySelectorAll(".hys-ui-pg-row")],
        box = port.getBoundingClientRect(),
        head = el
          .querySelector(".hys-ui-pg-label-head")
          .getBoundingClientRect(),
        pane = el.querySelector(".hys-ui-pg-labels").getBoundingClientRect();
      return {
        count: rows.length,
        indices: rows.map((row) => Number(row.dataset.rowIndex)),
        top: port.scrollTop,
        left: port.scrollLeft,
        height: port.clientHeight,
        total: port.scrollHeight,
        width: pane.width,
        clientWidth: port.clientWidth,
        aligned:
          names.length === rows.length &&
          names.every(
            (name, index) =>
              name.dataset.rowIndex === rows[index].dataset.rowIndex &&
              Math.abs(
                name.getBoundingClientRect().top -
                  rows[index].getBoundingClientRect().top,
              ) < 1,
          ),
        pinned:
          Math.abs(head.top - box.top) < 1 &&
          Math.abs(pane.left - box.left) < 1,
      };
    });
  const choose = async (name, value) => {
    await large.getByRole("combobox", { name, exact: true }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
    await settle();
  };
  const locate = async (name, index) => {
    await large.getByRole("button", { name, exact: true }).click();
    await chart
      .locator('.hys-ui-pg-task-label[data-row-index="' + index + '"]')
      .waitFor();
    await settle();
  };
  const navigate = async (name) => {
    await page
      .locator('.docs-sidebar a[href="/components/hys-' + name + '"]')
      .evaluate((el) => el.click());
    await page
      .locator("h1")
      .filter({ hasText: name === "gantt" ? "HysGantt" : "HysRating" })
      .waitFor();
    await settle();
  };
  try {
    let state = await layout();
    check(
      "Five thousand tasks use bounded, aligned virtual rows",
      state.count < 40 && state.aligned && state.total === 5000 * 44 + 66,
    );
    await choose("大数据任务数量", "10,000 项任务");
    state = await layout();
    check(
      "Ten thousand tasks preserve one full shared scroll extent",
      state.total === 10000 * 44 + 66 && state.count < 40 && state.aligned,
    );
    await locate("末项", 9999);
    state = await layout();
    check(
      "Locating the last virtual task renders it without blank rows",
      state.indices.includes(9999) &&
        state.count < 40 &&
        state.aligned &&
        state.pinned,
    );
    check(
      "Location and selection highlight the corresponding row",
      await chart
        .locator('.hys-ui-pg-task-label[data-row-index="9999"]')
        .getAttribute("class")
        .then((value) => value.includes("hys-ui-selected")),
    );
    await viewport.scrollIntoViewIfNeeded();
    await chart.screenshot({ path: "output/playwright/gantt-large-last.png" });
    const lastBar = chart.locator(
        '.hys-ui-pg-row[data-row-index="9999"] .hys-ui-pg-bar',
      ),
      dates = (title) => title.match(/\d{4}-\d{2}-\d{2}/g);
    await lastBar.scrollIntoViewIfNeeded();
    const before = dates(await lastBar.getAttribute("title")),
      box = await lastBar.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 36, box.y + box.height / 2, {
      steps: 6,
    });
    await page.mouse.up();
    await settle();
    check(
      "Date dragging updates a deep virtual task",
      dates(await lastBar.getAttribute("title")).every(
        (date, index) =>
          Date.parse(date) - Date.parse(before[index]) === 86400000,
      ),
    );
    await lastBar.press("Alt+ArrowLeft");
    check(
      "Keyboard editing restores the deep task dates",
      JSON.stringify(dates(await lastBar.getAttribute("title"))) ===
        JSON.stringify(before),
    );
    await locate("中间", 4999);
    state = await layout();
    check(
      "Direct jumps render the middle window and keep pinned headings",
      state.aligned &&
        state.indices.includes(4999) &&
        state.count < 40 &&
        state.pinned,
    );
    const input = large.getByRole("spinbutton", {
      name: "定位任务序号",
      exact: true,
    });
    await input.fill("7513");
    await input.press("Enter");
    await locate("定位指定任务", 7512);
    check(
      "An arbitrary task ordinal locates the matching model row",
      (await layout()).indices.includes(7512),
    );
    for (const top of [120000, 280000, 440000, 75000, 1000]) {
      await viewport.evaluate((el, top) => (el.scrollTop = top), top);
      await settle();
      state = await layout();
      if (!state.aligned || state.count > 40 || state.count < 1)
        throw Error("virtual scroll mismatch at " + top);
    }
    check("Repeated distant scrolls keep both virtual windows aligned", true);
    await locate("首项", 0);
    await viewport.scrollIntoViewIfNeeded();
    const portBox = await viewport.boundingBox();
    await page.mouse.move(portBox.x + 30, portBox.y + 130);
    await page.mouse.wheel(0, 1400);
    await page.waitForFunction(
      () =>
        document.querySelector("#scene-largedata .hys-ui-pg-scroll").scrollTop >
        500,
    );
    await settle();
    check(
      "Fast wheel input uses one shared virtual scroll position",
      (await layout()).aligned,
    );
    await locate("中间", 4999);
    const cached = await layout();
    await navigate("rating");
    await navigate("gantt");
    state = await layout();
    check(
      "Cached large-data page restores scroll and selected task",
      Math.abs(state.top - cached.top) < 1 &&
        Math.abs(state.left - cached.left) < 1 &&
        state.aligned &&
        (await chart
          .locator(
            '.hys-ui-pg-task-label[data-row-index="4999"].hys-ui-selected',
          )
          .count()) === 1,
    );
    const divider = chart.getByRole("separator", {
      name: "任务名称列宽",
      exact: true,
    });
    await viewport.scrollIntoViewIfNeeded();
    const original = Number(await divider.getAttribute("aria-valuenow"));
    let handle = await divider.boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + 110);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 90, handle.y + 110, {
      steps: 12,
    });
    await page.mouse.up();
    await settle();
    state = await layout();
    check(
      "Dragging the task-column divider resizes deep virtual rows",
      state.width === original + 90 &&
        state.aligned &&
        state.pinned &&
        state.count < 40,
    );
    const committed = state.width;
    handle = await divider.boundingBox();
    await page.mouse.move(handle.x + 4, handle.y + 130);
    await page.mouse.down();
    await page.mouse.move(handle.x + 64, handle.y + 130, { steps: 5 });
    await divider.press("Escape");
    await page.mouse.up();
    await settle();
    check(
      "Escape rolls back an in-progress column resize",
      (await layout()).width === committed,
    );
    await divider.press("ArrowLeft");
    await divider.press("Shift+ArrowRight");
    check(
      "Keyboard column resizing supports regular and coarse steps",
      (await layout()).width === committed + 40,
    );
    await divider.press("Home");
    check(
      "Home respects the configured minimum width",
      (await layout()).width === 120,
    );
    await divider.press("End");
    check(
      "End respects the maximum and preserves timeline space",
      (await layout()).width === 600,
    );
    await divider.dblclick({ position: { x: 4, y: 100 } });
    check(
      "Double click restores the initial configured task-column width",
      (await layout()).width === 220,
    );
    await choose("大数据任务数量", "1,000 项任务");
    state = await layout();
    check(
      "Shrinking large data resets to a valid aligned first window",
      state.total === 1000 * 44 + 66 &&
        state.top === 0 &&
        state.aligned &&
        state.indices.includes(0),
    );
    await locate("首项", 0);
    await viewport.scrollIntoViewIfNeeded();
    const source = chart.locator(
      '.hys-ui-pg-row[data-row-index="0"] .hys-ui-pg-link-port',
    );
    await source.evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    await settle();
    let start = await source.boundingBox();
    await page.mouse.move(
      start.x + start.width / 2,
      start.y + start.height / 2,
    );
    await page.mouse.down();
    let view = await viewport.boundingBox();
    await page.mouse.move(view.x + 70, view.y + view.height - 7, { steps: 8 });
    await page.waitForFunction(
      () =>
        document.querySelector("#scene-largedata .hys-ui-pg-scroll").scrollTop >
        900,
    );
    await settle();
    state = await layout();
    check(
      "Dependency dragging auto-scrolls after the virtual source leaves the DOM",
      !state.indices.includes(0) &&
        (await chart.locator(".hys-ui-pg-link-preview").count()) === 1 &&
        state.aligned,
    );
    await page.mouse.move(view.x + 70, view.y + 170, { steps: 3 });
    await settle();
    const targetIndex = await chart
      .locator(".hys-ui-pg-task-label.hys-ui-pg-link-target")
      .getAttribute("data-row-index");
    await page.mouse.up();
    await settle();
    check(
      "Releasing after virtual auto-scroll saves the correct target relationship",
      targetIndex !== null &&
        (await large
          .locator("output")
          .innerText()
          .then((text) =>
            text.includes("已连接 bulk-1 → bulk-" + (Number(targetIndex) + 1)),
          )),
    );
    const dep = page.locator("#scene-dependencies"),
      depChart = dep.locator(".hys-ui-pg-gantt"),
      depView = depChart.locator(".hys-ui-pg-scroll"),
      edge = depChart.locator(".hys-ui-pg-edge-hit");
    const label = (index) =>
        depChart.locator(
          '.hys-ui-pg-task-label[data-row-index="' + index + '"]',
        ),
      connection = (index) =>
        depChart.locator(
          '.hys-ui-pg-row[data-row-index="' + index + '"] .hys-ui-pg-link-port',
        );
    const dragLink = async (from, to, reason) => {
      await depView.scrollIntoViewIfNeeded();
      const port = connection(from);
      await port.evaluate((el) =>
        el.scrollIntoView({ block: "nearest", inline: "nearest" }),
      );
      await settle();
      const a = await port.boundingBox(),
        b = await label(to).boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + 60, b.y + b.height / 2, { steps: 10 });
      await settle();
      check(
        reason
          ? "Invalid drop is visibly identified: " + reason
          : "A valid dependency target is highlighted",
        await label(to).evaluate(
          (el, invalid) =>
            el.classList.contains("hys-ui-pg-link-target") &&
            el.classList.contains("hys-ui-pg-link-invalid") === invalid,
          !!reason,
        ),
      );
      await page.mouse.up();
      await settle();
      if (reason)
        check(
          "Rejected dependency explains " + reason,
          await dep
            .locator("output")
            .innerText()
            .then((text) => text.includes('"reason":"' + reason + '"')),
        );
    };
    const originalEdges = await edge.count();
    await dragLink(0, 1);
    check(
      "Dragging to a task name adds a predecessor without changing dates",
      (await edge.count()) === originalEdges + 1 &&
        (await dep.locator("output").innerText()) ===
          "已连接：需求确认 → 接口开发",
    );
    await dragLink(0, 1, "duplicate");
    await dragLink(0, 0, "self");
    await dragLink(3, 1, "cycle");
    await dragLink(0, 5, "disabled");
    check(
      "Invalid pointer drops leave all accepted relations intact",
      (await edge.count()) === originalEdges + 1,
    );
    await connection(2).press("Enter");
    await depView.press("ArrowDown");
    await depView.press("ArrowDown");
    await depView.press("Enter");
    await settle();
    check(
      "Keyboard selection and confirmation create a dependency",
      (await dep.locator("output").innerText()) ===
        "已连接：页面开发 → 发布验收",
    );
    const newEdge = depChart.getByRole("button", {
      name: "依赖 frontend → release，选中后按 Delete 移除",
      exact: true,
    });
    await newEdge.focus();
    await newEdge.press("Delete");
    await settle();
    check(
      "Delete removes a focused dependency",
      (await newEdge.count()) === 0 &&
        (await dep.locator("output").innerText()) ===
          "已移除：页面开发 → 发布验收",
    );
    const added = depChart.getByRole("button", {
      name: "依赖 requirements → backend，选中后按 Delete 移除",
      exact: true,
    });
    await added.focus();
    await depChart
      .getByRole("button", { name: "移除依赖", exact: true })
      .click();
    check(
      "The inline removal action deletes the selected relation",
      (await added.count()) === 0,
    );
    await depView.scrollIntoViewIfNeeded();
    await connection(0).evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    await connection(0).click();
    await label(2).click();
    await settle();
    check(
      "Clicking a connection point then a target creates the same relation",
      (await dep.locator("output").innerText()) ===
        "已连接：需求确认 → 页面开发",
    );
    const clickEdge = depChart.getByRole("button", {
      name: "依赖 requirements → frontend，选中后按 Delete 移除",
      exact: true,
    });
    const hit = await clickEdge.evaluate((el) => {
      const port = el.closest(".hys-ui-pg-scroll").getBoundingClientRect(),
        matrix = el.getScreenCTM(),
        length = el.getTotalLength();
      for (let i = 1; i < 100; i++) {
        const point = el.getPointAtLength((length * i) / 100),
          screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
        if (
          screen.x > port.left &&
          screen.x < port.right &&
          screen.y > port.top + 66 &&
          screen.y < port.bottom &&
          document.elementFromPoint(screen.x, screen.y) === el
        )
          return { x: screen.x, y: screen.y };
      }
      return null;
    });
    check(
      "Dependency lines expose an unobscured mouse selection area",
      hit !== null,
    );
    await page.mouse.click(hit.x, hit.y);
    check(
      "Mouse selection highlights the edge and exposes removal",
      (await depChart.locator(".hys-ui-pg-edge-selected").count()) === 1 &&
        (await depChart
          .getByRole("button", { name: "移除依赖", exact: true })
          .count()) === 1,
    );
    await clickEdge.press("Delete");
    await settle();
    await connection(0).evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    let from = await connection(0).boundingBox(),
      targetBar = depChart.locator(
        '.hys-ui-pg-row[data-row-index="1"] .hys-ui-pg-bar',
      ),
      to = await targetBar.boundingBox();
    await page.mouse.move(from.x + 7, from.y + 7);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
    await settle();
    check(
      "Dropping directly on a task bar also establishes the predecessor",
      (await dep.locator("output").innerText()) ===
        "已连接：需求确认 → 接口开发",
    );
    await connection(0).press("Enter");
    await depView.press("Escape");
    check(
      "Escape cancels keyboard connection without saving",
      (await depChart.locator(".hys-ui-pg-link-preview").count()) === 0,
    );
    await connection(0).evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    start = await connection(0).boundingBox();
    await page.mouse.move(start.x + 6, start.y + 6);
    await page.mouse.down();
    await page.mouse.move(start.x + 35, start.y + 15, { steps: 3 });
    await depView.press("Escape");
    await page.mouse.up();
    await settle();
    check(
      "Escape cancels a pointer connection without a late click restarting it",
      (await depChart.locator(".hys-ui-pg-link-preview").count()) === 0,
    );
    const total = await edge.count();
    await dep
      .getByRole("checkbox", { name: "显示依赖连线", exact: true })
      .uncheck();
    check(
      "Hiding dependency graphics removes ports and lines",
      (await edge.count()) === 0 &&
        (await depChart.locator(".hys-ui-pg-link-port").count()) === 0,
    );
    await dep
      .getByRole("checkbox", { name: "显示依赖连线", exact: true })
      .check();
    check(
      "Showing dependency graphics restores the saved relationships",
      (await edge.count()) === total,
    );
    await dep
      .getByRole("checkbox", { name: "允许编辑依赖", exact: true })
      .uncheck();
    check(
      "Dependency editing can be disabled independently of date editing",
      (await edge.count()) === 0 &&
        (await depChart.locator(".hys-ui-pg-edge-line").count()) === total &&
        (await depChart.locator(".hys-ui-pg-handle").count()) > 0,
    );
    await dep
      .getByRole("checkbox", { name: "允许编辑依赖", exact: true })
      .check();
    await depView.scrollIntoViewIfNeeded();
    await connection(0).press("Enter");
    await depView.press("ArrowDown");
    await depChart.screenshot({
      path: "output/playwright/gantt-dependency-edit.png",
    });
    await navigate("rating");
    await navigate("gantt");
    check(
      "Leaving a cached page cancels unfinished dependency connections",
      (await depChart.locator(".hys-ui-pg-link-preview").count()) === 0 &&
        (await edge.count()) === total,
    );
    await depView.scrollIntoViewIfNeeded();
    await connection(0).evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    from = await connection(0).boundingBox();
    await page.mouse.move(from.x + 7, from.y + 7);
    await page.mouse.down();
    await page.mouse.move(from.x + 25, from.y + 30, { steps: 3 });
    await navigate("rating");
    await page.mouse.up();
    await navigate("gantt");
    check(
      "Leaving during pointer capture discards the pending dependency",
      (await depChart.locator(".hys-ui-pg-link-preview").count()) === 0 &&
        (await edge.count()) === total,
    );
    const scrolling = page.locator("#scene-scrolling");
    await scrolling
      .getByRole("checkbox", { name: "允许拖动任务列宽", exact: true })
      .uncheck();
    check(
      "The task-column resize handle can be disabled",
      (await scrolling.getByRole("separator").count()) === 0,
    );
    await scrolling
      .getByRole("checkbox", { name: "允许拖动任务列宽", exact: true })
      .check();
    await page.setViewportSize({ width: 390, height: 844 });
    await locate("末项", 999);
    await viewport.scrollIntoViewIfNeeded();
    state = await layout();
    check(
      "Mobile task widths leave the timeline usable and aligned",
      state.clientWidth - state.width >= 79 &&
        state.aligned &&
        state.pinned &&
        state.count < 40,
    );
    await chart.screenshot({
      path: "output/playwright/gantt-large-mobile.png",
    });
    await page.setViewportSize({ width: 1680, height: 1000 });
    check(
      "No runtime errors or Vue warnings",
      errors.length === 0 && warnings.length === 0,
    );
    return { checks, errors, warnings, lastLayout: await layout() };
  } catch (error) {
    throw Error(
      "After " +
        checks.at(-1)?.name +
        ": " +
        error.message +
        "; errors=" +
        JSON.stringify(errors) +
        "; warnings=" +
        JSON.stringify(warnings),
    );
  }
}
