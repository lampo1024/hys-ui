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
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/components/hys-data-grid");
  const scene = page.locator("#scene-basic"),
    grid = scene.locator(".hys-ui-pf-grid"),
    trigger = grid.getByRole("button", { name: "筛选编号", exact: true }),
    name = grid.getByRole("button", { name: "筛选任务名称", exact: true }),
    row = grid.locator(".hys-ui-pf-grid-filter-row");
  await scene.getByRole("button", { name: "恢复默认列", exact: true }).click();
  await trigger.click();
  const input = grid.getByRole("textbox", { name: "过滤编号", exact: true });
  await input.fill("TASK-0001");
  check(
    "Search icon opens and focuses the associated field",
    await input.evaluate((e) => e === document.activeElement),
  );
  check(
    "No standalone collapse button is rendered",
    (await grid
      .getByRole("button", { name: "收起筛选", exact: true })
      .count()) === 0,
  );
  await trigger.click();
  check(
    "Clicking the same search icon collapses the filter row",
    (await row.count()) === 0 &&
      (await trigger.getAttribute("aria-expanded")) === "false",
  );
  check(
    "Collapsing keeps active filter conditions",
    (await grid.locator("tbody tr").count()) === 1 &&
      (await trigger
        .getAttribute("class")
        .then((c) => c.includes("hys-ui-is-filtered"))),
  );
  await trigger.click();
  check(
    "Reopening restores filter text",
    (await input.inputValue()) === "TASK-0001",
  );
  await name.click();
  const other = grid.getByRole("textbox", {
    name: "过滤任务名称",
    exact: true,
  });
  check(
    "Other column icons focus their corresponding field",
    await other.evaluate((e) => e === document.activeElement),
  );
  await other.press("Escape");
  check(
    "Escape collapses and restores focus to the active column icon",
    (await row.count()) === 0 &&
      (await name.evaluate((e) => e === document.activeElement)),
  );
  check(
    "Escape preserves the applied filter",
    (await grid.locator("tbody tr").count()) === 1,
  );
  check("No filter interaction runtime errors", !errors.length);
  return { checks, errors };
}
