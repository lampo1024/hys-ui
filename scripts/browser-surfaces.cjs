async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    warnings = [];
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "warning" && e.text().includes("[Vue warn]"))
      warnings.push(e.text());
  });
  page.setDefaultTimeout(10000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1680, height: 1000 });
  const scene = (name) => page.locator("#scene-" + name),
    settle = () =>
      page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
  await page.goto(base + "/components/hys-card");
  await scene("content").waitFor();
  await scene("content")
    .getByRole("button", { name: "收藏", exact: true })
    .click();
  check(
    "Card cover and actions render without layout overflow",
    (await scene("content")
      .getByRole("button", { name: "已收藏", exact: true })
      .count()) === 1 &&
      (await scene("content").locator(".hys-ui-card-cover").count()) === 1,
  );
  await scene("content").screenshot({
    path: "output/playwright/surfaces-card.png",
  });
  const tabs = scene("tabs").getByRole("tablist", {
    name: "团队空间内容",
    exact: true,
  });
  await tabs.getByRole("tab", { name: "概览", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  check(
    "Card tab keyboard interaction updates controlled slot content",
    (await scene("tabs").getByRole("tabpanel").first().textContent()).includes(
      "今天新增",
    ),
  );
  await page.keyboard.press("ArrowRight");
  check(
    "Card tab navigation skips disabled entries",
    (await tabs
      .getByRole("tab", { name: "概览", exact: true })
      .getAttribute("aria-selected")) === "true",
  );
  const loading = scene("loading");
  check(
    "Card loading uses skeletons with status semantics",
    (await loading.getByRole("status").count()) === 2,
  );
  await loading
    .getByRole("checkbox", { name: "加载中", exact: true })
    .uncheck();
  check(
    "Card content replaces skeleton after loading completes",
    (await loading.getByRole("status").count()) === 0 &&
      (await loading.textContent()).includes("加载完成后展示正文"),
  );
  await page.goto(base + "/components/hys-badge");
  await scene("counters").waitFor();
  const value = scene("counters").getByRole("spinbutton").first();
  await value.fill("120");
  await value.press("Tab");
  check(
    "Badge counts clamp at max while preserving the full title",
    (await scene("counters")
      .locator('sup[title="120"]')
      .first()
      .textContent()) === "99+",
  );
  await scene("counters")
    .getByRole("checkbox", { name: "隐藏计数", exact: true })
    .check();
  check(
    "Hiding a badge preserves the host button",
    (await scene("counters")
      .getByRole("button", { name: "待处理消息", exact: true })
      .count()) === 1 &&
      (await scene("counters").locator('sup[title="120"]').count()) === 1,
  );
  const counter = scene("placement").locator("sup").first();
  await counter.scrollIntoViewIfNeeded();
  let before = await counter.boundingBox();
  const x = scene("placement").getByRole("spinbutton").first();
  await x.fill("10");
  await x.press("Tab");
  await counter.scrollIntoViewIfNeeded();
  await settle();
  let after = await counter.boundingBox();
  check(
    "Badge horizontal offset moves the counter by the requested amount",
    Math.abs(after.x - before.x - 10) < 1,
  );
  const selectable = scene("selectable"),
    choice = selectable.getByRole("button", { name: "只看关注", exact: true });
  await choice.focus();
  await page.keyboard.press("Space");
  check(
    "Checkable labels support native keyboard activation",
    (await choice.getAttribute("aria-pressed")) === "false",
  );
  await selectable
    .getByRole("checkbox", { name: "禁用交互", exact: true })
    .check();
  check("Disabled labels stop selection", await choice.isDisabled());
  await scene("appearance")
    .getByRole("button", { name: "关闭标签", exact: true })
    .click();
  check(
    "Close event lets the host remove a label",
    (await scene("appearance")
      .getByRole("button", { name: "恢复标签", exact: true })
      .count()) === 1,
  );
  check(
    "Reduced motion disables status-dot animation",
    (await scene("status")
      .locator(".hys-ui-badge-processing")
      .first()
      .evaluate((e) => getComputedStyle(e, "::after").animationName)) ===
      "none",
  );
  await scene("status").screenshot({
    path: "output/playwright/surfaces-badge.png",
  });
  await page.goto(base + "/components/hys-divider");
  await scene("styles").waitFor();
  const separators = scene("styles").getByRole("separator");
  check(
    "Divider supports actual dotted and double line rendering",
    (await separators
      .nth(2)
      .evaluate((e) => getComputedStyle(e, "::before").borderTopStyle)) ===
      "dotted" &&
      (await separators
        .nth(3)
        .evaluate((e) => getComputedStyle(e, "::before").borderTopStyle)) ===
        "double",
  );
  check(
    "Vertical dividers expose orientation without text",
    (await scene("direction")
      .locator('[aria-orientation="vertical"]')
      .count()) === 2,
  );
  check(
    "Logical divider alignment follows RTL direction",
    await scene("direction")
      .locator('[dir="rtl"] .hys-ui-divider-start')
      .evaluate((e) => {
        const r = e.getBoundingClientRect(),
          t = e.querySelector("span").getBoundingClientRect();
        return r.right - t.right < t.left - r.left;
      }),
  );
  await page.goto(base + "/components/hys-skeleton");
  await scene("variants").locator(".hys-ui-skeleton-circle").waitFor();
  check(
    "All skeleton shapes render in their own examples",
    (await scene("variants").getByRole("status").count()) === 6,
  );
  check(
    "Reduced motion disables skeleton animation",
    (await scene("variants")
      .locator(".hys-ui-skeleton")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName)) === "none",
  );
  await scene("variants").screenshot({
    path: "output/playwright/surfaces-skeleton.png",
  });
  const delay = scene("loading");
  await delay.getByRole("button", { name: "快速请求", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector("#scene-loading output")
      ?.textContent.includes("已结束"),
  );
  check(
    "Short loading requests never leave a skeleton visible",
    (await delay.locator(".hys-ui-skeleton-root>[role=status]").count()) ===
      0 && (await delay.locator("output").textContent()).includes("隐藏"),
  );
  await delay.getByRole("button", { name: "慢速请求", exact: true }).click();
  await delay.locator(".hys-ui-skeleton-root>[role=status]").waitFor();
  await page.waitForFunction(() =>
    document
      .querySelector("#scene-loading output")
      ?.textContent.includes("已结束"),
  );
  check(
    "Visible skeleton remains until its minimum display duration",
    (await delay.locator(".hys-ui-skeleton-root>[role=status]").count()) === 1,
  );
  await delay
    .locator(".hys-ui-skeleton-root>[role=status]")
    .waitFor({ state: "detached" });
  check(
    "Skeleton returns to the host content",
    (await delay.textContent()).includes("加载完成的内容"),
  );
  await delay.getByRole("button", { name: "慢速请求", exact: true }).click();
  await page.locator('a[href="/components/hys-card"]').click();
  await scene("content").waitFor();
  await page.locator('a[href="/components/hys-skeleton"]').click();
  await scene("variants").waitFor();
  check(
    "Cached example leave cancels the in-flight demo request",
    (await scene("loading")
      .locator(".hys-ui-skeleton-root>[role=status]")
      .count()) === 0,
  );
  for (const name of ["hys-card", "hys-badge", "hys-divider", "hys-skeleton"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/components/" + name);
    await scene("configure").waitFor();
    check(
      name + " examples fit mobile viewport",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
  }
  check(
    "No runtime errors or Vue warnings",
    !errors.length && !warnings.length,
  );
  return { checks, errors, warnings };
}
