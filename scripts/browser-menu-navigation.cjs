async (page) => {
  const base = page.url().includes("github.io")
    ? new URL(page.url()).origin + "/hys-ui"
    : "http://127.0.0.1:5174";
  const checks = [],
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
  page.setDefaultTimeout(15000);
  const section = async (name) => {
    const el = page.locator("#scene-" + name);
    await el.scrollIntoViewIfNeeded();
    await el.locator(".example-stage").waitFor();
    return el;
  };
  const panel = (level) =>
    page
      .locator('.hys-ui-menu-panel[data-level="' + level + '"]')
      .filter({ visible: true });
  const item = (name, level = 0) =>
    panel(level).getByRole("menuitem", { name, exact: true });
  const clear = async () => {
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector(".hys-ui-menu-panel"),
    );
  };
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(base + "/components/hys-context-menu/");
    const sub = await section("submenus");
    await sub.getByRole("button", { name: "文档操作", exact: true }).click();
    await item("导出").hover();
    await panel(1).waitFor();
    await item("表格", 1).hover();
    await panel(2).waitFor();
    await item("CSV 文件", 2).click();
    check(
      "Hovering enters both nested flyouts and executes one leaf",
      (await sub.locator("output").innerText()) === "导出 / 表格 / CSV 文件",
    );
    await page.waitForFunction(
      () => !document.querySelector(".hys-ui-menu-panel"),
    );
    await sub.getByRole("button", { name: "文档操作", exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    check(
      "Keyboard enters the first nested menu",
      await item("PDF 文档", 1).evaluate((el) => el === document.activeElement),
    );
    await page.keyboard.press("ArrowLeft");
    check(
      "Keyboard returns focus to the parent item",
      await item("导出").evaluate((el) => el === document.activeElement),
    );
    await clear();
    check(
      "Escape returns focus to the real trigger",
      await sub
        .getByRole("button", { name: "文档操作", exact: true })
        .evaluate((el) => el === document.activeElement),
    );
    const checking = await section("checking");
    await checking
      .getByRole("button", { name: "显示设置", exact: true })
      .click();
    await panel(0)
      .getByRole("menuitemcheckbox", { name: "行号", exact: true })
      .click();
    check(
      "Checkbox keeps menu open and updates checked state",
      (await panel(0)
        .getByRole("menuitemcheckbox", { name: "行号", exact: true })
        .getAttribute("aria-checked")) === "true",
    );
    await panel(0)
      .getByRole("menuitemradio", { name: "紧凑", exact: true })
      .click();
    check(
      "Radio changes only its group",
      (await panel(0)
        .getByRole("menuitemradio", { name: "紧凑", exact: true })
        .getAttribute("aria-checked")) === "true" &&
        (await panel(0)
          .getByRole("menuitemradio", { name: "标准", exact: true })
          .getAttribute("aria-checked")) === "false",
    );
    check(
      "Adjacent menu highlights have a visible gap",
      await panel(0)
        .locator(".hys-ui-menu-body")
        .evaluate((el) => parseFloat(getComputedStyle(el).rowGap) >= 3),
    );
    await page.waitForTimeout(220);
    const idleReads = await page.evaluate(async () => {
      const original = HTMLElement.prototype.getBoundingClientRect;
      let count = 0;
      HTMLElement.prototype.getBoundingClientRect = function () {
        if (this.closest(".hys-ui-menu-layer")) count++;
        return original.call(this);
      };
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return count;
      } finally {
        HTMLElement.prototype.getBoundingClientRect = original;
      }
    });
    check("Idle menu does not run a recurring layout loop", idleReads < 12);
    await panel(0).screenshot({ path: "output/playwright/menu-checking.png" });
    await clear();
    const configure = await section("configure");
    await configure.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "focus", exact: true }).click();
    await configure
      .getByRole("button", { name: "打开操作菜单", exact: true })
      .focus();
    await panel(0).waitFor();
    await clear();
    check(
      "Focus-triggered menu stays closed after Escape",
      (await page.locator(".hys-ui-menu-panel").count()) === 0,
    );
    const custom = await section("custom");
    await custom
      .getByRole("button", { name: "自定义菜单", exact: true })
      .click();
    await panel(0).getByRole("textbox", { name: "菜单备注" }).fill("测试备注");
    await page.keyboard.press("ArrowDown");
    check(
      "Header input keeps native text editing and focus",
      await panel(0)
        .getByRole("textbox", { name: "菜单备注" })
        .evaluate((el) => el === document.activeElement),
    );
    await panel(0)
      .getByRole("button", { name: "关闭菜单", exact: true })
      .click();
    await page.waitForFunction(
      () => !document.querySelector(".hys-ui-menu-panel"),
    );
    const position = await section("position");
    await position
      .getByRole("button", { name: "长菜单与位置", exact: true })
      .click();
    await panel(0).waitFor();
    await page.waitForTimeout(220);
    const long = await panel(0).evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      width: el.getBoundingClientRect().width,
      scroll: el.querySelector(".hys-ui-menu-body").scrollHeight,
      client: el.querySelector(".hys-ui-menu-body").clientHeight,
    }));
    check(
      "Long menu respects total maximum height and scrolls internally",
      long.height <= 241 && long.scroll > long.client,
    );
    await page.keyboard.press("End");
    check(
      "End focuses and reveals the last item",
      await item("操作 120").evaluate(
        (el) =>
          el === document.activeElement &&
          el.closest(".hys-ui-menu-body").scrollTop > 0,
      ),
    );
    await clear();
    const states = await section("states");
    await states.getByRole("checkbox", { name: "加载中", exact: true }).check();
    await states.getByRole("button", { name: "查看状态", exact: true }).click();
    check(
      "Loading uses a status region and disables actions",
      (await panel(0).getByRole("status").count()) === 1 &&
        (await panel(0).locator("[data-hys-menu-item]").count()) === 0,
    );
    await clear();
    const nested = await section("nested");
    await nested
      .getByRole("button", { name: "弹窗内的菜单", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "资源操作", exact: true });
    await dialog.getByRole("button", { name: "资源操作", exact: true }).click();
    await item("导出").click();
    await item("CSV 文件", 1).waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector(".hys-ui-menu-panel"),
    );
    check(
      "Escape dismisses nested menu before its Modal",
      await dialog.isVisible(),
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/components/hys-context-menu/");
    const mobile = await section("submenus");
    await mobile.getByRole("button", { name: "文档操作", exact: true }).click();
    await item("导出").click();
    await panel(1).waitFor();
    check(
      "Mobile menu uses a single visible level and offers Back",
      (await panel(0).count()) === 0 &&
        (await panel(1)
          .getByRole("button", { name: "返回 · 导出", exact: true })
          .isVisible()),
    );
    const rect = await panel(1).boundingBox();
    check(
      "Mobile flyout stays within viewport",
      rect.x >= 7 && rect.x + rect.width <= 383,
    );
    await panel(1)
      .getByRole("button", { name: "返回 · 导出", exact: true })
      .click();
    await panel(0).waitFor();
    check("Mobile Back reveals parent menu", await item("导出").isVisible());
    await clear();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/components/hys-breadcrumb/");
    const drop = await section("dropdown");
    await drop
      .getByRole("button", { name: "设计文档 的其他页面", exact: true })
      .click();
    await item("历史版本").click();
    await item("2025 归档", 1).click();
    check(
      "Breadcrumb nested dropdown emits full navigation path",
      (await drop.locator("output").innerText()).includes(
        "历史版本 / 2025 归档",
      ),
    );
    await page.waitForFunction(
      () => !document.querySelector(".hys-ui-menu-panel"),
    );
    const collapsed = await section("collapse");
    check(
      "Breadcrumb collapse keeps expected visible count",
      (await collapsed.locator("ol>li").count()) === 4,
    );
    await collapsed
      .getByRole("button", { name: "更多层级", exact: true })
      .click();
    check(
      "Collapsed ancestors stay accessible as links",
      (await panel(0)
        .getByRole("menuitem", { name: "文档中心", exact: true })
        .getAttribute("href")) === "#level-2",
    );
    await clear();
    const router = await section("router");
    check(
      "Host router controls normal breadcrumb href",
      (await router
        .getByRole("link", { name: "文档首页", exact: true })
        .getAttribute("href")) ===
        base.replace(new URL(base).origin, "") + "/",
    );
    await router
      .getByRole("button", { name: "组件导航 的其他页面", exact: true })
      .click();
    check(
      "Host router controls dropdown href without placeholder",
      (await item("按钮").getAttribute("href")).endsWith(
        "/components/hys-button",
      ),
    );
    await clear();
    const truncate = await section("truncate");
    check(
      "Long breadcrumb labels clamp and retain full title",
      await truncate
        .locator(".hys-ui-breadcrumb-label")
        .last()
        .evaluate(
          (el) =>
            getComputedStyle(el).textOverflow === "ellipsis" &&
            el.title.includes("当前页面"),
        ),
    );
    check(
      "Breadcrumb current label inherits readable text color",
      await truncate
        .locator('[aria-current="page"]')
        .evaluate(
          (el) =>
            getComputedStyle(el).color ===
            getComputedStyle(el.querySelector(".hys-ui-breadcrumb-label"))
              .color,
        ),
    );
    await truncate.screenshot({
      path: "output/playwright/breadcrumb-layout.png",
    });
    check("No page errors", errors.length === 0);
    check("No Vue warnings", warnings.length === 0);
    return { checks, errors, warnings };
  } catch (error) {
    return { error: String(error), checks, errors, warnings, url: page.url() };
  }
}
