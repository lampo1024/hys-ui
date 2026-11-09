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
  const scene = page.locator("#scene-reconnecting"),
    chart = scene.locator(".hys-ui-pg-gantt"),
    viewport = chart.locator(".hys-ui-pg-scroll"),
    labels = chart.locator(".hys-ui-pg-task-label"),
    edges = chart.locator(".hys-ui-pg-edge-hit");
  const endpoint = (target) =>
    chart.getByRole("button", {
      name: "改接依赖终点：source → " + target,
      exact: true,
    });
  const edge = (target) =>
    chart.getByRole("button", {
      name: "依赖 source → " + target + "，选中后按 Delete 移除",
      exact: true,
    });
  await endpoint("first").waitFor();
  const originalDates = await chart
      .locator(".hys-ui-pg-bar")
      .evaluateAll((els) => els.map((el) => el.title)),
    count = await edges.count();
  const begin = async (target) => {
    await viewport.scrollIntoViewIfNeeded();
    await endpoint(target).evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    await settle();
    const box = await endpoint(target).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
  };
  const move = async (target, row, reason) => {
    await begin(target);
    const box = await labels.nth(row).boundingBox();
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 10 });
    await settle();
    check(
      "Original relation stays present while moving its endpoint",
      (await edge(target).count()) === 1 &&
        (await chart.locator(".hys-ui-pg-link-preview").count()) === 1,
    );
    await page.mouse.up();
    await settle();
    if (reason)
      check(
        "Invalid retarget preserves the original relation: " + reason,
        (await edge(target).count()) === 1 &&
          (await scene
            .locator("output")
            .innerText()
            .then(
              (text) =>
                text.includes('"type":"move"') &&
                text.includes('"reason":"' + reason + '"'),
            )),
      );
  };
  try {
    await move("first", 3);
    check(
      "Dragging an existing endpoint replaces its target without adding an extra edge",
      (await edge("first").count()) === 0 &&
        (await edge("second").count()) === 1 &&
        (await edges.count()) === count &&
        (await scene.locator("output").innerText()) ===
          "已改接：first → second",
    );
    check(
      "Retargeting preserves every task date",
      JSON.stringify(
        await chart
          .locator(".hys-ui-pg-bar")
          .evaluateAll((els) => els.map((el) => el.title)),
      ) === JSON.stringify(originalDates),
    );
    check(
      "The newly connected edge remains selected for further editing",
      await edge("second").evaluate((el) =>
        el.parentElement.classList.contains("hys-ui-pg-edge-current"),
      ),
    );
    await move("second", 1, "self");
    await move("second", 0, "cycle");
    await move("second", 4, "disabled");
    await begin("second");
    let box = await labels.nth(2).boundingBox();
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 6 });
    await viewport.press("Escape");
    await page.mouse.up();
    await settle();
    check(
      "Escape preserves the old target and closes the draft",
      (await edge("second").count()) === 1 &&
        (await chart.locator(".hys-ui-pg-link-preview").count()) === 0,
    );
    await begin("second");
    box = await viewport.boundingBox();
    await page.mouse.move(box.x + 80, box.y + 20, { steps: 5 });
    await page.mouse.up();
    await settle();
    check(
      "Dropping onto a date header keeps the saved relationship",
      (await edge("second").count()) === 1 &&
        (await chart.locator(".hys-ui-pg-link-preview").count()) === 0,
    );
    const message = await scene.locator("output").innerText();
    await move("second", 3);
    check(
      "Dropping back onto the same task is a no-op",
      (await edge("second").count()) === 1 &&
        (await edges.count()) === count &&
        (await scene.locator("output").innerText()) === message,
    );
    await endpoint("second").click();
    await labels.nth(2).click();
    await settle();
    check(
      "Endpoint click followed by a task click retargets the saved relationship",
      (await edge("first").count()) === 1 &&
        (await scene.locator("output").innerText()) ===
          "已改接：second → first",
    );
    await endpoint("first").press("Enter");
    await viewport.press("ArrowDown");
    await viewport.press("Enter");
    await settle();
    check(
      "Keyboard endpoint selection performs an atomic retarget",
      (await edge("second").count()) === 1 &&
        (await edge("first").count()) === 0,
    );
    await endpoint("second").press("Enter");
    await viewport.press("ArrowUp");
    await viewport.press("Escape");
    check(
      "Keyboard cancellation preserves the current endpoint",
      (await edge("second").count()) === 1 &&
        (await chart.locator(".hys-ui-pg-link-preview").count()) === 0,
    );
    await endpoint("second").focus();
    await chart.screenshot({
      path: "output/playwright/gantt-reconnecting.png",
    });
    for (const surface of ["blank", "task", "header", "toolbar"]) {
      await edge("second").focus();
      if (surface === "blank") {
        const bounds = await viewport.boundingBox();
        await page.mouse.click(bounds.x + bounds.width - 40, bounds.y + 86);
      } else if (surface === "task") await labels.first().click();
      else if (surface === "header")
        await chart
          .locator(".hys-ui-pg-label-head")
          .click({ position: { x: 30, y: 22 } });
      else
        await chart
          .getByRole("button", { name: "定位今天", exact: true })
          .click();
      await settle();
      check(
        "Clicking " + surface + " clears only edge selection",
        (await chart.locator(".hys-ui-pg-edge-current").count()) === 0 &&
          (await edge("second").count()) === 1 &&
          (await chart
            .getByRole("button", { name: "移除依赖", exact: true })
            .count()) === 0,
      );
    }
    await scene
      .getByRole("button", { name: "还原原终点", exact: true })
      .click();
    check(
      "Instance-based retargeting updates the same relation",
      (await edge("first").count()) === 1,
    );
    const large = page.locator("#scene-largedata"),
      largeChart = large.locator(".hys-ui-pg-gantt"),
      largeView = largeChart.locator(".hys-ui-pg-scroll");
    await large.getByRole("button", { name: "首项", exact: true }).click();
    await largeView.scrollIntoViewIfNeeded();
    const originalEndpoint = largeChart.getByRole("button", {
      name: "改接依赖终点：bulk-5 → bulk-6",
      exact: true,
    });
    await originalEndpoint.evaluate((el) =>
      el.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    await settle();
    box = await originalEndpoint.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const view = await largeView.boundingBox();
    await page.mouse.move(view.x + 60, view.y + view.height - 7, { steps: 8 });
    await page.waitForFunction(
      () =>
        document.querySelector("#scene-largedata .hys-ui-pg-scroll").scrollTop >
        900,
    );
    await settle();
    check(
      "Retargeting keeps pointer capture when the original virtual endpoint unmounts",
      (await originalEndpoint.count()) === 0 &&
        (await largeChart.locator(".hys-ui-pg-link-preview").count()) === 1,
    );
    await page.mouse.move(view.x + 60, view.y + 170, { steps: 3 });
    await settle();
    const index = await largeChart
      .locator(".hys-ui-pg-task-label.hys-ui-pg-link-target")
      .getAttribute("data-row-index");
    await page.mouse.up();
    await settle();
    check(
      "Releasing after virtual auto-scroll saves the newly chosen target",
      index !== null &&
        (await large
          .locator("output")
          .innerText()
          .then((text) =>
            text.includes(
              "已改接 bulk-5：bulk-6 → bulk-" + (Number(index) + 1),
            ),
          )),
    );
    await begin("first");
    box = await labels.nth(3).boundingBox();
    await page.mouse.move(box.x + 50, box.y + 20, { steps: 5 });
    await page
      .locator('.docs-sidebar a[href="/components/hys-rating"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysRating" }).waitFor();
    await page.mouse.up();
    await page
      .locator('.docs-sidebar a[href="/components/hys-gantt"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysGantt" }).waitFor();
    await settle();
    check(
      "Cached-page leave cancels endpoint retargeting and retains the original edge",
      (await edge("first").count()) === 1 &&
        (await edge("second").count()) === 0 &&
        (await chart.locator(".hys-ui-pg-link-preview").count()) === 0,
    );
    check(
      "No runtime errors or Vue warnings during endpoint editing",
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
