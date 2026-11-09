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
  const dates = (title) => title.match(/\d{4}-\d{2}-\d{2}/g);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (event) => {
    if (event.type() === "warning" && event.text().includes("[Vue warn]"))
      warnings.push(event.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-gantt");
  const scene = page.locator("#scene-history"),
    chart = scene.locator(".hys-ui-pg-gantt"),
    view = chart.locator(".hys-ui-pg-scroll"),
    bar = chart.locator(".hys-ui-pg-bar").first(),
    undo = chart.getByRole("button", { name: "撤销", exact: true }),
    redo = chart.getByRole("button", { name: "重做", exact: true });
  await bar.waitFor();
  const baseline = dates(await bar.getAttribute("title"));
  const drag = async (target, offset) => {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + offset,
      box.y + box.height / 2,
      { steps: 12 },
    );
  };
  try {
    check(
      "Initial history controls are visibly disabled",
      (await undo.isDisabled()) && (await redo.isDisabled()),
    );
    await drag(bar, 72);
    check(
      "Dragging is a preview before the release",
      JSON.stringify(dates(await bar.getAttribute("title"))) ===
        JSON.stringify(baseline),
    );
    await page.mouse.up();
    await settle();
    const moved = dates(await bar.getAttribute("title"));
    check(
      "One full pointer gesture records one transaction",
      (await scene
        .locator("output")
        .innerText()
        .then((text) => text.includes("可撤销 1 步"))) &&
        Date.parse(moved[0]) - Date.parse(baseline[0]) === 2 * 86400000,
    );
    await undo.click();
    await settle();
    check(
      "Toolbar undo restores both task dates",
      JSON.stringify(dates(await bar.getAttribute("title"))) ===
        JSON.stringify(baseline) && (await redo.isEnabled()),
    );
    await redo.click();
    await settle();
    check(
      "Redo restores the accepted move without duplicating history",
      JSON.stringify(dates(await bar.getAttribute("title"))) ===
        JSON.stringify(moved) &&
        (await scene
          .locator("output")
          .innerText()
          .then((text) => text.includes("可撤销 1 步"))),
    );
    await view.press("Control+z");
    await settle();
    check(
      "Scoped Control-Z undoes the chart operation",
      JSON.stringify(dates(await bar.getAttribute("title"))) ===
        JSON.stringify(baseline),
    );
    await view.press("Control+y");
    await settle();
    check(
      "Control-Y redoes the operation",
      JSON.stringify(dates(await bar.getAttribute("title"))) ===
        JSON.stringify(moved),
    );
    await chart
      .locator(".hys-ui-pg-conflict-summary")
      .getByRole("button", { name: "查看详情", exact: true })
      .click();
    const input = chart.getByRole("textbox", {
      name: "搜索排期冲突",
      exact: true,
    });
    await input.fill("接口");
    await input.press("Control+z");
    check(
      "Text-field undo never consumes Gantt history",
      JSON.stringify(dates(await bar.getAttribute("title"))) ===
        JSON.stringify(moved) &&
        (await scene
          .locator("output")
          .innerText()
          .then((text) => text.includes("可撤销 1 步"))),
    );
    await undo.click();
    await scene.getByRole("button", { name: "清空历史", exact: true }).click();
    await scene
      .getByRole("button", { name: "添加前置关系", exact: true })
      .click();
    await settle();
    check(
      "Dependency creation enters the same history stack",
      (await chart
        .getByRole("button", {
          name: "依赖 design → review，选中后按 Delete 移除",
          exact: true,
        })
        .count()) === 1 &&
        (await scene
          .locator("output")
          .innerText()
          .then((text) => text.includes("可撤销 1 步"))),
    );
    await undo.click();
    await settle();
    check(
      "Undo removes only the newly added predecessor",
      (await chart
        .getByRole("button", {
          name: "依赖 design → review，选中后按 Delete 移除",
          exact: true,
        })
        .count()) === 0 &&
        (await chart
          .getByRole("button", {
            name: "依赖 build → review，选中后按 Delete 移除",
            exact: true,
          })
          .count()) === 1,
    );
    await redo.click();
    await settle();
    const endpoint = chart.getByRole("button", {
      name: "改接依赖终点：design → build",
      exact: true,
    });
    await endpoint.evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    await settle();
    let a = await endpoint.boundingBox(),
      b = await chart
        .locator('.hys-ui-pg-task-label[data-row-index="3"]')
        .boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + 50, b.y + b.height / 2, { steps: 10 });
    await page.mouse.up();
    await settle();
    check(
      "Endpoint retargeting is recorded as one atomic operation",
      (await chart
        .getByRole("button", {
          name: "依赖 design → release，选中后按 Delete 移除",
          exact: true,
        })
        .count()) === 1 &&
        (await scene
          .locator("output")
          .innerText()
          .then((text) => text.includes("可撤销 2 步"))),
    );
    await undo.click();
    await settle();
    check(
      "Undo restores the original endpoint and removes the replacement together",
      (await chart
        .getByRole("button", {
          name: "依赖 design → build，选中后按 Delete 移除",
          exact: true,
        })
        .count()) === 1 &&
        (await chart
          .getByRole("button", {
            name: "依赖 design → release，选中后按 Delete 移除",
            exact: true,
          })
          .count()) === 0,
    );
    await scene
      .getByRole("button", { name: "模拟外部更新", exact: true })
      .click();
    await settle();
    check(
      "External schedule replacement invalidates previous history",
      (await undo.isDisabled()) && (await redo.isDisabled()),
    );
    await scene
      .getByRole("checkbox", { name: "显示历史按钮", exact: true })
      .uncheck();
    const beforeHidden = dates(await bar.getAttribute("title"));
    await bar.press("Alt+ArrowRight");
    await settle();
    await view.press("Control+z");
    await settle();
    check(
      "Hidden toolbar controls leave the history API and shortcut available",
      (await chart.locator(".hys-ui-pg-history-controls").count()) === 0 &&
        JSON.stringify(dates(await bar.getAttribute("title"))) ===
          JSON.stringify(beforeHidden),
    );
    await scene
      .getByRole("checkbox", { name: "显示历史按钮", exact: true })
      .check();
    const limit = scene.getByRole("spinbutton", {
      name: "历史记录步数",
      exact: true,
    });
    await limit.fill("2");
    await limit.press("Enter");
    await scene.getByRole("button", { name: "清空历史", exact: true }).click();
    for (let n = 0; n < 3; n++) {
      await bar.press("Alt+ArrowRight");
      await settle();
    }
    check(
      "Configured history limits keep only the latest operations",
      await scene
        .locator("output")
        .innerText()
        .then((text) => text.includes("可撤销 2 步")),
    );
    const countBefore = await scene.locator("output").innerText();
    await page
      .locator('.docs-sidebar a[href="/components/hys-rating"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysRating" }).waitFor();
    await page
      .locator('.docs-sidebar a[href="/components/hys-gantt"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysGantt" }).waitFor();
    await settle();
    check(
      "Cached-page return retains settled undo history",
      (await scene.locator("output").innerText()) === countBefore &&
        (await undo.isEnabled()),
    );
    await chart.screenshot({ path: "output/playwright/gantt-history.png" });
    const diagnostics = page.locator("#scene-conflicts"),
      diagnosticChart = diagnostics.locator(".hys-ui-pg-gantt");
    await diagnosticChart
      .locator(".hys-ui-pg-conflict-summary")
      .getByRole("button", { name: "查看详情", exact: true })
      .click();
    check(
      "Initial diagnostics cover date ordering, invalid dates, missing references and cycles",
      (await diagnostics
        .locator("output")
        .innerText()
        .then((text) => text.includes("5 项"))) &&
        (await diagnosticChart
          .locator(".hys-ui-pg-conflict-list li")
          .count()) === 5,
    );
    check(
      "Invalid-date items are explained without an unusable location action",
      await diagnosticChart
        .getByRole("button", {
          name: "定位冲突任务：日期格式错误的任务",
          exact: true,
        })
        .isDisabled(),
    );
    const filter = diagnosticChart.getByRole("textbox", {
      name: "搜索排期冲突",
      exact: true,
    });
    await filter.fill("removed");
    check(
      "Conflict details can be filtered by the missing reference",
      (await diagnosticChart.locator(".hys-ui-pg-conflict-list li").count()) ===
        1,
    );
    await filter.fill("");
    await diagnosticChart
      .getByRole("button", {
        name: "定位冲突任务：接口开发 · 开始过早",
        exact: true,
      })
      .click();
    check(
      "Conflict location reveals the affected task",
      (await diagnosticChart
        .locator('.hys-ui-pg-task-label[data-row-index="1"]')
        .getAttribute("aria-pressed")) === "true",
    );
    await diagnosticChart.screenshot({
      path: "output/playwright/gantt-conflicts.png",
    });
    await diagnostics
      .getByRole("checkbox", { name: "显示冲突提示", exact: true })
      .uncheck();
    check(
      "Hiding warnings preserves the diagnostic results",
      (await diagnosticChart.locator(".hys-ui-pg-conflict-area").count()) ===
        0 &&
        (await diagnostics
          .locator("output")
          .innerText()
          .then((text) => text.includes("5 项"))),
    );
    await diagnostics
      .getByRole("checkbox", { name: "显示冲突提示", exact: true })
      .check();
    await diagnostics
      .getByRole("button", { name: "修正示例数据", exact: true })
      .click();
    await settle();
    check(
      "Correcting host data clears warnings without automatic rescheduling",
      (await diagnostics
        .locator("output")
        .innerText()
        .then((text) => text.includes("0 项"))) &&
        (await diagnosticChart.locator(".hys-ui-pg-task-warning").count()) ===
          0,
    );
    const preview = page.locator("#scene-conflictpreview"),
      previewChart = preview.locator(".hys-ui-pg-gantt"),
      target = previewChart.locator(".hys-ui-pg-bar").nth(1),
      previewView = previewChart.locator(".hys-ui-pg-scroll"),
      original = await target.getAttribute("title");
    await drag(target, -72);
    check(
      "A drag previews newly introduced dependency conflicts before committing",
      (await previewChart
        .locator(".hys-ui-pg-conflict-preview")
        .innerText()
        .then((text) => text.includes("新增 1 项"))) &&
        (await target.getAttribute("title")) === original,
    );
    await page.mouse.up();
    await settle();
    check(
      "A conflicting edit is retained with warnings instead of silently changing the schedule",
      (await target.getAttribute("title")) !== original &&
        (await previewChart.locator(".hys-ui-pg-edge-conflict").count()) > 0,
    );
    await previewChart
      .getByRole("button", { name: "撤销", exact: true })
      .click();
    await settle();
    check(
      "Undo clears conflicts by restoring the accepted dates",
      (await target.getAttribute("title")) === original &&
        (await previewChart.locator(".hys-ui-pg-conflict-area").count()) === 0,
    );
    await target.press("Alt+ArrowRight");
    await settle();
    const committed = await target.getAttribute("title");
    await drag(target, -108);
    await page.keyboard.press("Control+z");
    await page.mouse.up();
    await settle();
    check(
      "Control-Z cancels an active drag before consuming committed history",
      (await target.getAttribute("title")) === committed &&
        (await previewChart
          .getByRole("button", { name: "撤销", exact: true })
          .isEnabled()),
    );
    await previewView.press("Control+z");
    await settle();
    check(
      "The next Control-Z restores the previous committed schedule",
      (await target.getAttribute("title")) === original,
    );
    const large = page.locator("#scene-largedata"),
      largeChart = large.locator(".hys-ui-pg-gantt");
    await large.getByRole("button", { name: "末项", exact: true }).click();
    const last = largeChart.locator(
      '.hys-ui-pg-row[data-row-index="4999"] .hys-ui-pg-bar',
    );
    await last.waitFor();
    const oldLast = await last.getAttribute("title");
    await last.press("Alt+ArrowRight");
    await settle();
    await largeChart.getByRole("button", { name: "撤销", exact: true }).click();
    await settle();
    check(
      "Undo works on deep virtual tasks while rendering remains bounded",
      (await last.getAttribute("title")) === oldLast &&
        (await largeChart.locator(".hys-ui-pg-row").count()) < 40,
    );
    check(
      "No runtime errors or Vue warnings from history and conflict inspection",
      errors.length === 0 && warnings.length === 0,
    );
    return { checks, errors, warnings };
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
