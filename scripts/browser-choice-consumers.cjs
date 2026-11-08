async (page) => {
  const base = "http://127.0.0.1:5174";
  const checks = [],
    errors = [],
    warnings = [];
  const check = (name, result) => {
    checks.push({ name, pass: !!result });
    if (!result) throw Error(name);
  };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" && message.text().includes("[Vue warn]"))
      warnings.push(message.text());
  });
  await page.setViewportSize({ width: 1680, height: 1000 });
  const visit = async (slug) => {
    await page.goto(base + "/components/" + slug);
    const stage = page.locator("#scene-basic");
    await stage.getByRole("checkbox").first().waitFor();
    return stage;
  };

  const tree = await visit("hys-tree");
  const root = tree.getByRole("checkbox", {
    name: "勾选研发中心",
    exact: true,
  });
  await root.check();
  check(
    "Tree checkbox cascades to visible child groups",
    (await tree
      .getByRole("checkbox", { name: "勾选平台开发组", exact: true })
      .isChecked()) &&
      (await tree
        .getByRole("checkbox", { name: "勾选质量保障组", exact: true })
        .isChecked()),
  );
  await tree
    .getByRole("checkbox", { name: "勾选平台开发组", exact: true })
    .uncheck();
  check(
    "Tree parent becomes mixed after a child group is cleared",
    (await root.getAttribute("aria-checked")) === "mixed",
  );

  const transfer = await visit("hys-transfer");
  let panes = transfer.locator(".hys-ui-v4-pane");
  await panes
    .first()
    .getByRole("checkbox", { name: "Keller", exact: true })
    .check();
  check(
    "Transfer change-only checkbox handlers accept selection",
    await transfer
      .getByRole("button", { name: "添加选中项", exact: true })
      .isEnabled(),
  );
  await transfer
    .getByRole("button", { name: "添加选中项", exact: true })
    .click();
  await panes
    .last()
    .getByRole("checkbox", { name: "Keller", exact: true })
    .waitFor();
  check(
    "Transfer moves selected items to the target pane",
    await panes
      .last()
      .getByRole("checkbox", { name: "Keller", exact: true })
      .isVisible(),
  );
  await panes
    .last()
    .getByRole("checkbox", { name: "Keller", exact: true })
    .check();
  await transfer
    .getByRole("button", { name: "移除选中项", exact: true })
    .click();
  await panes
    .last()
    .getByRole("checkbox", { name: "Keller", exact: true })
    .waitFor({ state: "detached" });
  check(
    "Transfer returns selected items after its leave animation",
    await panes
      .first()
      .getByRole("checkbox", { name: "Keller", exact: true })
      .isVisible(),
  );

  const matrix = await visit("hys-permission-matrix");
  const all = matrix.getByRole("checkbox", {
    name: "全选所有权限",
    exact: true,
  });
  await matrix
    .getByRole("checkbox", { name: "项目 - 管理员", exact: true })
    .check();
  check(
    "Permission selection updates its mixed summary",
    (await all.getAttribute("aria-checked")) === "mixed",
  );
  await all.check();
  check(
    "Permission select-all updates every cell",
    await matrix
      .getByRole("checkbox")
      .evaluateAll((elements) => elements.every((element) => element.checked)),
  );
  await matrix
    .getByRole("checkbox", { name: "全选资源 项目", exact: true })
    .uncheck();
  check(
    "Permission resource clearing updates the summary",
    (await all.getAttribute("aria-checked")) === "mixed" &&
      !(await matrix
        .getByRole("checkbox", { name: "项目 - 管理员", exact: true })
        .isChecked()),
  );

  const grid = await visit("hys-data-grid");
  await grid.getByRole("checkbox", { name: "选择第1行", exact: true }).check();
  check(
    "Data grid row selection updates its count",
    (await grid.locator(".hys-ui-pf-grid-count").textContent()).includes(
      "已选 1",
    ),
  );
  const pageAll = grid.getByRole("checkbox", {
    name: "选择当前页全部行",
    exact: true,
  });
  check(
    "Data grid header reflects partial selection",
    (await pageAll.getAttribute("aria-checked")) === "mixed",
  );
  await pageAll.check();
  check(
    "Data grid header selects the entire page",
    (await grid.locator(".hys-ui-pf-grid-count").textContent()).includes(
      "已选 12",
    ),
  );
  await pageAll.uncheck();
  check(
    "Data grid header clears the current page",
    (await grid.locator(".hys-ui-pf-grid-count").textContent()).includes(
      "已选 0",
    ),
  );
  check(
    "Existing consumers render without runtime errors or Vue warnings",
    errors.length === 0 && warnings.length === 0,
  );
  return { checks, errors, warnings };
}
