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
  await page.setViewportSize({ width: 1680, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-gantt");
  const scene = page.locator("#scene-multipledependencies"),
    chart = scene.locator(".hys-ui-pg-gantt"),
    viewport = chart.locator(".hys-ui-pg-scroll"),
    trigger = chart.locator(".hys-ui-pg-incoming-trigger"),
    panel = page.getByRole("dialog", {
      name: "选择前置依赖：集成发布",
      exact: true,
    });
  await trigger.waitFor();
  const open = async () => {
    if (await panel.count()) return;
    await viewport.scrollIntoViewIfNeeded();
    await trigger.evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    await settle();
    const box = await trigger
      .locator(".hys-ui-pg-incoming-hit")
      .first()
      .boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await panel.waitFor();
    await settle();
  };
  try {
    await open();
    check(
      "Relationship rows have no nested interactive controls",
      (await panel.locator("button button").count()) === 0,
    );
    check(
      "Target and its compact label share one line",
      await panel.locator(".hys-ui-pg-picker-target-main").evaluate((el) => {
        const label = el.querySelector("span").getBoundingClientRect(),
          title = el.querySelector("strong").getBoundingClientRect();
        return Math.abs(label.top - title.top) < 5 && title.left > label.right;
      }),
    );
    check(
      "Rows show source names without repeating predecessor labels",
      (await panel
        .locator(".hys-ui-pg-picker-options")
        .innerText()
        .then(
          (text) => !text.includes("前置任务") && !text.includes("后置任务"),
        )) &&
        (await panel
          .locator(".hys-ui-pg-picker-option")
          .evaluateAll((els) =>
            els.every((el) => el.getBoundingClientRect().height <= 42),
          )),
    );
    check(
      "Every row offers independent locate, reconnect and delete controls",
      (await panel.getByRole("button", { name: /^定位前置任务：/ }).count()) ===
        3 &&
        (await panel.getByRole("button", { name: /^修改终点：/ }).count()) ===
          3 &&
        (await panel.getByRole("button", { name: /^删除依赖：/ }).count()) ===
          3,
    );
    const search = panel.getByRole("textbox", {
      name: "搜索前置关系",
      exact: true,
    });
    await search.fill("BACKEND");
    check(
      "Predecessors can be filtered by their identifiers",
      (await panel.locator("[data-pg-choice]").count()) === 1 &&
        (await panel.locator("[data-pg-choice]").getAttribute("aria-label")) ===
          "接口实现 → 集成发布",
    );
    await search.fill("页面");
    check(
      "Source names are searchable independently",
      (await panel.locator("[data-pg-choice]").count()) === 1 &&
        (await panel.locator("[data-pg-choice]").getAttribute("aria-label")) ===
          "页面实现 → 集成发布",
    );
    await search.press("Home");
    check(
      "Home in the search box keeps normal text-editing focus",
      await search.evaluate((el) => document.activeElement === el),
    );
    await search.fill("不存在的关系");
    check(
      "Empty search results have explicit feedback",
      (await panel.locator("[data-pg-choice]").count()) === 0 &&
        (await panel
          .getByText("没有匹配的前置关系", { exact: true })
          .count()) === 1,
    );
    await search.fill("");
    await panel
      .getByRole("button", { name: "页面实现 → 集成发布", exact: true })
      .click();
    await open();
    await panel
      .getByRole("button", {
        name: "删除依赖：需求确认 → 集成发布",
        exact: true,
      })
      .click();
    await settle();
    check(
      "Quick deletion removes only its own relation without changing the chosen edge",
      (await chart
        .locator(".hys-ui-pg-edge-current")
        .getAttribute("data-edge-key")) ===
        JSON.stringify(["frontend", "release"]) &&
        (await scene
          .locator("output")
          .innerText()
          .then((text) =>
            text.startsWith("集成发布的前置：页面实现、接口实现"),
          )),
    );
    await open();
    await panel
      .getByRole("button", { name: "定位前置任务：接口实现", exact: true })
      .click();
    await settle();
    check(
      "Locating a predecessor selects its task and closes the picker",
      (await panel.count()) === 0 &&
        (await chart
          .locator('.hys-ui-pg-task-label[data-row-index="2"]')
          .getAttribute("aria-pressed")) === "true",
    );
    await open();
    await panel
      .getByRole("button", { name: "定位后置任务", exact: true })
      .click();
    await settle();
    check(
      "The compact target header locates its successor task",
      (await panel.count()) === 0 &&
        (await chart
          .locator('.hys-ui-pg-task-label[data-row-index="3"]')
          .getAttribute("aria-pressed")) === "true",
    );
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: "暖橙", exact: true }).click();
    await page.setViewportSize({ width: 1680, height: 650 });
    await open();
    const appearance = await panel.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      blur: getComputedStyle(el).backdropFilter,
      height: el.getBoundingClientRect().height,
    }));
    check(
      "The compact warm-theme picker retains visible glass transparency",
      appearance.background.includes("0.75") &&
        appearance.blur.includes("10px") &&
        appearance.height < 310,
    );
    await panel.screenshot({
      path: "output/playwright/gantt-picker-actions-orange.png",
    });
    await page.screenshot({
      path: "output/playwright/gantt-picker-actions-context.png",
    });
    await panel
      .getByRole("button", {
        name: "修改终点：接口实现 → 集成发布",
        exact: true,
      })
      .click();
    await settle();
    check(
      "The reconnect action starts editing while retaining the saved connection",
      (await panel.count()) === 0 &&
        (await chart.locator(".hys-ui-pg-link-preview").count()) === 1 &&
        (await chart
          .getByRole("button", {
            name: "依赖 backend → release，选中后按 Delete 移除",
            exact: true,
          })
          .count()) === 1,
    );
    await chart.locator('.hys-ui-pg-task-label[data-row-index="4"]').click();
    await settle();
    check(
      "Choosing a new task from action-driven reconnection updates the intended relation",
      (await scene
        .locator("output")
        .innerText()
        .then(
          (text) =>
            text.startsWith("集成发布的前置：页面实现") &&
            text.includes("已改接 接口实现：集成发布 → 备选验收"),
        )) &&
        (await chart
          .getByRole("button", {
            name: "依赖 backend → alternative，选中后按 Delete 移除",
            exact: true,
          })
          .count()) === 1,
    );
    await page.setViewportSize({ width: 1680, height: 1000 });
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: "科技蓝", exact: true }).click();
    check(
      "No runtime errors or Vue warnings from picker quick actions",
      errors.length === 0 && warnings.length === 0,
    );
    return { checks, errors, warnings, appearance };
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
