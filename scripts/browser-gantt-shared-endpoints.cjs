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
  const scene = page.locator("#scene-multipledependencies"),
    chart = scene.locator(".hys-ui-pg-gantt"),
    viewport = chart.locator(".hys-ui-pg-scroll"),
    trigger = chart.locator(".hys-ui-pg-incoming-trigger"),
    panel = page.getByRole("dialog", {
      name: "选择前置依赖：集成发布",
      exact: true,
    });
  await trigger.waitFor();
  const open = async (terminal = false) => {
    await viewport.scrollIntoViewIfNeeded();
    await trigger.evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    await settle();
    const hit = trigger.locator(".hys-ui-pg-incoming-hit");
    let box = await (terminal ? hit.last() : hit.first()).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await panel.waitFor();
    await settle();
  };
  const choose = async (source) => {
    await panel
      .getByRole("button", { name: source + " → 集成发布", exact: true })
      .click();
    await settle();
  };
  const current = () =>
    chart.locator(".hys-ui-pg-edge-current").getAttribute("data-edge-key");
  try {
    check(
      "Multiple incoming relations display a single explicit chooser",
      (await trigger
        .getAttribute("aria-label")
        .then((text) => text.includes("3 条"))) &&
        (await chart
          .locator(".hys-ui-pg-edge-shared .hys-ui-pg-edge-endpoint-hit")
          .evaluateAll((els) =>
            els.every((el) => getComputedStyle(el).pointerEvents === "none"),
          )),
    );
    await open(true);
    check(
      "Clicking the shared terminal opens named relation choices",
      (await panel.locator("[data-pg-choice]").count()) === 3,
    );
    const style = await panel.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      blur: getComputedStyle(el).backdropFilter,
    }));
    check(
      "The panel retains slight translucency with a blurred backdrop",
      style.background.includes("0.75") && style.blur.includes("10px"),
    );
    await choose("页面实现");
    check(
      "Choosing a source identifies one exact edge",
      (await current()) === JSON.stringify(["frontend", "release"]) &&
        (await chart.locator(".hys-ui-pg-edge-current").count()) === 1,
    );
    const handleState = await chart
      .locator(".hys-ui-pg-edge-endpoint-hit")
      .evaluateAll((els) =>
        els.map((el) => ({
          key: el.closest(".hys-ui-pg-edge-group").dataset.edgeKey,
          active: getComputedStyle(el).pointerEvents !== "none",
        })),
      );
    check(
      "Only the chosen shared endpoint can intercept pointer dragging",
      handleState.filter((item) => item.active).length === 1 &&
        handleState.find((item) => item.active).key ===
          JSON.stringify(["frontend", "release"]),
    );
    check(
      "The full chosen relation is named in chart feedback",
      await chart
        .getByRole("status")
        .innerText()
        .then((text) => text.includes("页面实现 → 集成发布")),
    );
    check(
      "Other incoming edges are visually subdued",
      await chart
        .locator(
          ".hys-ui-pg-edge-group:not(.hys-ui-pg-edge-current) .hys-ui-pg-edge-line",
        )
        .evaluateAll((els) =>
          els.every((el) => Number(getComputedStyle(el).opacity) < 0.3),
        ),
    );
    const chosenHandle = chart.getByRole("button", {
      name: "改接依赖终点：frontend → release",
      exact: true,
    });
    const actualHit = await chosenHandle.evaluate((el) => {
      const box = el.getBoundingClientRect(),
        hit = document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );
      return hit === el;
    });
    check(
      "The chosen endpoint sits above other overlapping SVG hit regions",
      actualHit,
    );
    await open();
    check(
      "The chooser marks the currently selected predecessor",
      (await panel
        .getByRole("button", { name: "页面实现 → 集成发布", exact: true })
        .getAttribute("aria-pressed")) === "true",
    );
    await panel
      .getByRole("button", { name: "关闭前置关系列表", exact: true })
      .click();
    check(
      "Closing the chooser preserves the explicit relation selection",
      (await panel.count()) === 0 &&
        (await current()) === JSON.stringify(["frontend", "release"]),
    );
    await open();
    await choose("接口实现");
    await open();
    await panel.screenshot({
      path: "output/playwright/gantt-shared-picker.png",
    });
    await panel
      .getByRole("button", { name: "关闭前置关系列表", exact: true })
      .click();
    const moving = chart.getByRole("button", {
      name: "改接依赖终点：backend → release",
      exact: true,
    });
    let box = await moving.boundingBox(),
      target = await chart
        .locator('.hys-ui-pg-task-label[data-row-index="4"]')
        .boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + 60, target.y + target.height / 2, {
      steps: 10,
    });
    await page.mouse.up();
    await settle();
    check(
      "Dragging the chosen shared endpoint changes only that predecessor",
      (await scene
        .locator("output")
        .innerText()
        .then(
          (text) =>
            text.includes("集成发布的前置：需求确认、页面实现") &&
            text.includes("已改接 接口实现：集成发布 → 备选验收"),
        )) && (await chart.locator(".hys-ui-pg-edge-hit").count()) === 3,
    );
    check(
      "The group count updates after a single relationship leaves",
      await trigger
        .getAttribute("aria-label")
        .then((text) => text.includes("2 条")),
    );
    await open();
    await panel
      .getByRole("button", { name: "需求确认 → 集成发布", exact: true })
      .focus();
    await panel
      .getByRole("button", { name: "需求确认 → 集成发布", exact: true })
      .press("ArrowDown");
    await page.keyboard.press("Enter");
    await settle();
    check(
      "Keyboard choices select the intended remaining relation",
      (await current()) === JSON.stringify(["frontend", "release"]),
    );
    await open();
    await page.keyboard.press("Escape");
    check(
      "Escape dismisses the chooser without changing relations",
      (await panel.count()) === 0 &&
        (await chart.locator(".hys-ui-pg-edge-hit").count()) === 3,
    );
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: "深色", exact: true }).click();
    await open();
    const dark = await panel.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      blur: getComputedStyle(el).backdropFilter,
    }));
    check(
      "The translucent picker follows the dark theme",
      dark.background.includes("0.75") &&
        dark.background !== style.background &&
        dark.blur.includes("10px"),
    );
    await panel.screenshot({
      path: "output/playwright/gantt-shared-picker-dark.png",
    });
    await panel
      .getByRole("button", { name: "关闭前置关系列表", exact: true })
      .click();
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: "科技蓝", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await open();
    box = await panel.boundingBox();
    check(
      "The chooser fits within the mobile viewport",
      box.x >= 9 &&
        box.x + box.width <= 381 &&
        box.y >= 9 &&
        box.y + box.height <= 835,
    );
    await panel.screenshot({
      path: "output/playwright/gantt-shared-picker-mobile.png",
    });
    await panel
      .getByRole("button", { name: "关闭前置关系列表", exact: true })
      .click();
    await page.setViewportSize({ width: 1680, height: 1000 });
    await open();
    await page
      .locator('.docs-sidebar a[href="/components/hys-rating"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysRating" }).waitFor();
    check(
      "Cached-page leave removes the teleported chooser",
      (await panel.count()) === 0,
    );
    await page
      .locator('.docs-sidebar a[href="/components/hys-gantt"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysGantt" }).waitFor();
    await settle();
    check(
      "Returning to a cached page does not reopen the old chooser",
      (await panel.count()) === 0,
    );
    await open();
    await choose("页面实现");
    await chart.getByRole("button", { name: "移除依赖", exact: true }).click();
    await settle();
    check(
      "Removing the chosen relationship preserves the other incoming edge",
      (await scene
        .locator("output")
        .innerText()
        .then((text) => text.startsWith("集成发布的前置：需求确认"))) &&
        (await trigger.count()) === 0 &&
        (await chart
          .getByRole("button", {
            name: "改接依赖终点：planning → release",
            exact: true,
          })
          .count()) === 1,
    );
    check(
      "No runtime errors or Vue warnings while resolving shared endpoints",
      errors.length === 0 && warnings.length === 0,
    );
    return { checks, errors, warnings, style, dark };
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
