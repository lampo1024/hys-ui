async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    warnings = [];
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (event) => {
    if (event.type() === "warning" && event.text().includes("[Vue warn]"))
      warnings.push(event.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-gantt");
  const scene = page.locator("#scene-scrolling"),
    chart = scene.locator(".hys-ui-pg-gantt"),
    viewport = chart.locator(".hys-ui-pg-scroll"),
    label = chart.locator(".hys-ui-pg-task-label").first(),
    bar = chart.locator(".hys-ui-pg-bar").first();
  await label.waitFor();
  await label.click();
  check(
    "Task selection is exposed on both label and bar",
    (await label.getAttribute("aria-pressed")) === "true" &&
      (await bar.getAttribute("aria-pressed")) === "true" &&
      (await scene
        .locator("output")
        .innerText()
        .then((text) => text.includes("task-0"))),
  );
  await viewport.press("Escape");
  check(
    "Escape clears the controlled task model and its visual selection",
    (await chart
      .locator('.hys-ui-pg-task-label[aria-pressed="true"]')
      .count()) === 0 &&
      (await scene
        .locator("output")
        .innerText()
        .then((text) => text.includes("未选择"))),
  );
  await label.click();
  await viewport.evaluate((el) => (el.scrollLeft = 0));
  await viewport.scrollIntoViewIfNeeded();
  let box = await viewport.boundingBox(),
    width = await chart
      .locator(".hys-ui-pg-labels")
      .evaluate((el) => el.getBoundingClientRect().width);
  await page.mouse.click(box.x + width + 25, box.y + 90);
  check(
    "Clicking empty timeline space clears task selection",
    (await label.getAttribute("aria-pressed")) === "false" &&
      (await scene
        .locator("output")
        .innerText()
        .then((text) => text.includes("未选择"))),
  );
  await label.click();
  await chart.getByRole("button", { name: "定位今天", exact: true }).click();
  check(
    "Toolbar navigation preserves the selected task",
    (await label.getAttribute("aria-pressed")) === "true",
  );
  const port = chart.locator(".hys-ui-pg-link-port").first();
  await port.press("Enter");
  await viewport.press("Escape");
  check(
    "Escape first cancels connection editing and preserves task selection",
    (await chart.locator(".hys-ui-pg-link-preview").count()) === 0 &&
      (await label.getAttribute("aria-pressed")) === "true",
  );
  await viewport.press("Escape");
  check(
    "A subsequent Escape clears the task model",
    (await label.getAttribute("aria-pressed")) === "false",
  );
  await label.click();
  const edge = chart.locator(".hys-ui-pg-edge-hit").first();
  await edge.focus();
  await edge.press("Escape");
  check(
    "Escape first clears edge selection while retaining the selected task",
    (await chart.locator(".hys-ui-pg-edge-current").count()) === 0 &&
      (await label.getAttribute("aria-pressed")) === "true",
  );
  await viewport.press("Escape");
  check(
    "Task selection then clears independently of dependency data",
    (await label.getAttribute("aria-pressed")) === "false" &&
      (await chart.locator(".hys-ui-pg-edge-hit").count()) > 0,
  );
  await bar.scrollIntoViewIfNeeded();
  const title = await bar.getAttribute("title");
  box = await bar.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 72, box.y + box.height / 2, {
    steps: 6,
  });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  check(
    "Escape cancels a date drag before clearing its task selection",
    (await bar.getAttribute("title")) === title &&
      (await label.getAttribute("aria-pressed")) === "true",
  );
  await viewport.press("Escape");
  check(
    "Task selection can be cleared after an interrupted drag",
    (await label.getAttribute("aria-pressed")) === "false",
  );
  check(
    "No runtime errors or Vue warnings while clearing task selection",
    errors.length === 0 && warnings.length === 0,
  );
  return { checks, errors, warnings };
}
