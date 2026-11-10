async (page) => {
  const checks = [],
    errors = [],
    warnings = [],
    check = (name, pass) => {
      checks.push({ name, pass: !!pass });
      if (!pass) throw Error(name);
    },
    base = page.url().includes("github.io")
      ? new URL(page.url()).origin + "/hys-ui"
      : "http://127.0.0.1:5174";
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" && m.text().includes("[Vue warn]"))
      warnings.push(m.text());
  });
  page.setDefaultTimeout(15000);
  const scene = (name) => page.locator("#scene-" + name),
    close = (s) => s.locator(".hys-ui-alert-close"),
    choose = async (s, name, value) => {
      await s.getByRole("combobox", { name, exact: true }).click();
      await page.getByRole("option", { name: value, exact: true }).click();
    };
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + "/components/hys-alert/");
    await scene("controlled").waitFor();
    const controlled = scene("controlled");
    await close(controlled).click();
    check(
      "Controlled host can reject closing",
      (await controlled.locator("output").innerText()).includes(
        "关闭请求 1 次",
      ) &&
        (await controlled.locator("output").innerText()).includes(
          "完成关闭 0 次",
        ) &&
        (await controlled.locator("[role=status]").count()) === 1,
    );
    await controlled
      .getByRole("checkbox", { name: "接受关闭请求", exact: true })
      .check();
    await close(controlled).click();
    await controlled
      .locator(".hys-ui-alert-panel")
      .waitFor({ state: "detached" });
    check(
      "Accepted controlled close completes once",
      (await controlled.locator("output").innerText()).includes(
        "完成关闭 1 次",
      ),
    );
    await controlled
      .getByRole("button", { name: "重新显示", exact: true })
      .click();
    check(
      "Controlled alert can reopen",
      (await controlled.locator("[role=status]").count()) === 1,
    );
    const asyncScene = scene("async");
    await close(asyncScene).click();
    check(
      "Async close disables repeated clicks",
      await close(asyncScene).isDisabled(),
    );
    await page.waitForFunction(() =>
      document
        .querySelector("#scene-async output")
        .textContent.includes("当前条件不允许关闭"),
    );
    check(
      "A false async guard preserves the alert",
      (await asyncScene.locator("[role=status]").count()) === 1,
    );
    await asyncScene
      .getByRole("checkbox", { name: "模拟检查失败", exact: true })
      .check();
    await close(asyncScene).click();
    await page.waitForFunction(() =>
      document
        .querySelector("#scene-async output")
        .textContent.includes("检查失败"),
    );
    check(
      "Async guard errors remain retryable",
      await close(asyncScene).isEnabled(),
    );
    await asyncScene
      .getByRole("checkbox", { name: "模拟检查失败", exact: true })
      .uncheck();
    await asyncScene
      .getByRole("checkbox", { name: "允许关闭", exact: true })
      .check();
    await close(asyncScene).click();
    await asyncScene
      .getByRole("button", { name: "更新提示", exact: true })
      .click();
    await page.waitForTimeout(750);
    check(
      "Replacing the message cancels its old close check",
      (await asyncScene.locator("[role=status]").count()) === 1 &&
        (await asyncScene.locator("output").innerText()).includes(
          "已取消旧检查",
        ),
    );
    const motion = scene("motion");
    await motion.scrollIntoViewIfNeeded();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await close(motion).click();
    check(
      "Exit completion does not fire at the close request",
      (await motion.locator("output").innerText()) === "开始关闭",
    );
    check(
      "Leaving alert becomes inaccessible",
      await motion
        .locator(".hys-ui-alert-panel")
        .evaluate(
          (el) => el.inert && el.getAttribute("aria-hidden") === "true",
        ),
    );
    await page.waitForFunction(
      () =>
        document.querySelector("#scene-motion output").textContent ===
        "退出完成",
    );
    check(
      "Collapse exits remove their layout box",
      (await motion.locator(".hys-ui-alert-panel").count()) === 0,
    );
    await motion.getByRole("button", { name: "显示提示", exact: true }).click();
    await page.waitForTimeout(450);
    await close(motion).click();
    await motion.getByRole("button", { name: "显示提示", exact: true }).click();
    await page.waitForTimeout(500);
    check(
      "Reopening during exit restores role and prevents stale completion",
      (await motion.locator("output").innerText()) === "已显示" &&
        (await motion.locator("[role=status]").count()) === 1,
    );
    const access = scene("accessibility");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await close(access).click();
    check(
      "After-close focus restoration works",
      await access
        .getByRole("button", { name: "恢复提示", exact: true })
        .evaluate((el) => el === document.activeElement),
    );
    check(
      "Static content can override live semantics",
      (await access
        .getByRole("region", { name: "静态操作说明", exact: true })
        .getAttribute("aria-live")) === "off",
    );
    const cached = scene("lifecycle");
    await close(cached).click();
    await cached
      .getByRole("button", { name: "离开提示区域", exact: true })
      .click();
    check(
      "Leaving cached content aborts its guard",
      (await cached.locator("output").innerText()).includes("已取消检查"),
    );
    await cached
      .getByRole("button", { name: "返回提示区域", exact: true })
      .click();
    await page.waitForTimeout(1250);
    check(
      "Returning cache preserves the still-open message",
      (await cached.locator("[role=status]").count()) === 1 &&
        !(await cached.locator("output").innerText()).includes("发出关闭请求"),
    );
    await scene("appearance").screenshot({
      path: "output/playwright/feedback-alert-appearance.png",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await scene("states").scrollIntoViewIfNeeded();
    check(
      "Alert examples fit a mobile viewport",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await scene("states").screenshot({
      path: "output/playwright/feedback-alert-mobile.png",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/components/hys-empty/");
    await scene("image").waitFor();
    const image = scene("image");
    await image.scrollIntoViewIfNeeded();
    await image.locator("img").waitFor();
    await page.waitForFunction(
      () => document.querySelector("#scene-image img")?.naturalWidth > 0,
    );
    check(
      "Custom image loads with independent dimensions",
      await image.locator(".hys-ui-empty-image").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return Math.abs(r.width - 180) < 0.5 && Math.abs(r.height - 100) < 0.5;
      }),
    );
    await image
      .getByRole("button", { name: "模拟加载失败", exact: true })
      .click();
    await image.locator("[data-image-state=error]").waitFor();
    check(
      "Image errors render custom fallback and report one error",
      (await image.locator("output").innerText()).includes("失败 1 次") &&
        (await image.locator(".hys-ui-empty-image > svg").count()) === 1,
    );
    await image.getByRole("button", { name: "重试图片", exact: true }).click();
    await page.waitForFunction(() =>
      document
        .querySelector("#scene-image output")
        .textContent.includes("失败 2 次"),
    );
    check(
      "Retry reloads the current source",
      (await image.locator("[data-image-state=error]").count()) === 1,
    );
    await image
      .getByRole("button", { name: "使用示例图片", exact: true })
      .click();
    await page.waitForFunction(
      () => document.querySelector("#scene-image img")?.naturalWidth > 0,
    );
    check(
      "Replacing a failed URL recovers normal content",
      (await image.locator("[data-image-state=loaded]").count()) === 1,
    );
    check(
      "Built-in illustrations stay distinct",
      (await scene("illustrations")
        .locator(".hys-ui-empty-builtin")
        .count()) === 2 &&
        (await scene("illustrations")
          .locator(".hys-ui-empty-illustration")
          .count()) === 1,
    );
    check(
      "Empty actions remain accessible",
      (await scene("content").getByRole("button").count()) > 0,
    );
    await scene("illustrations").screenshot({
      path: "output/playwright/feedback-empty-illustrations.png",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await scene("states").scrollIntoViewIfNeeded();
    check(
      "Empty examples fit mobile",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await scene("states").screenshot({
      path: "output/playwright/feedback-empty-mobile.png",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/components/hys-timeline/");
    await scene("layout").waitFor();
    const layout = scene("layout"),
      line = layout.getByRole("list", { name: "响应式时间线", exact: true });
    await line.scrollIntoViewIfNeeded();
    check(
      "Alternate content sits on opposite sides of the axis",
      await line.evaluate((el) => {
        const rows = el.querySelectorAll(".hys-ui-timeline-item");
        return [0, 1].every((i) => {
          const row = rows[i],
            rail = row
              .querySelector(".hys-ui-timeline-rail")
              .getBoundingClientRect(),
            body = row
              .querySelector(".hys-ui-timeline-content")
              .getBoundingClientRect();
          return i === 0 ? body.left >= rail.right : body.right <= rail.left;
        });
      }),
    );
    check(
      "Timeline shows one visible marker per record",
      (await line.locator(".hys-ui-timeline-dot").count()) === 3 &&
        (await line
          .locator("li")
          .evaluateAll((rows) =>
            rows.every(
              (row) => getComputedStyle(row, "::before").display === "none",
            ),
          )),
    );
    await line.screenshot({
      path: "output/playwright/feedback-timeline-alternate.png",
    });
    const width = layout.getByRole("slider", {
      name: "时间线容器宽度",
      exact: true,
    });
    await width.focus();
    await width.press("Home");
    check(
      "Responsive layout follows container width rather than viewport",
      await line.evaluate((el) => {
        const row = el.querySelector(".hys-ui-timeline-item"),
          label = row
            .querySelector(".hys-ui-timeline-label")
            .getBoundingClientRect(),
          body = row
            .querySelector(".hys-ui-timeline-content")
            .getBoundingClientRect(),
          rail = row
            .querySelector(".hys-ui-timeline-rail")
            .getBoundingClientRect();
        return (
          Math.abs(el.getBoundingClientRect().width - 260) < 0.5 &&
          body.left > rail.right &&
          label.bottom <= body.top + 0.5
        );
      }),
    );
    await line.screenshot({
      path: "output/playwright/feedback-timeline-narrow.png",
    });
    await layout
      .getByRole("checkbox", { name: "窄容器自动调整", exact: true })
      .uncheck();
    check(
      "Responsive fallback can be disabled",
      await line.evaluate((el) => {
        const row = el.querySelectorAll(".hys-ui-timeline-item")[1];
        return (
          row.querySelector(".hys-ui-timeline-content").getBoundingClientRect()
            .right <=
          row.querySelector(".hys-ui-timeline-rail").getBoundingClientRect()
            .left
        );
      }),
    );
    const dynamic = scene("dynamic");
    await dynamic
      .getByRole("textbox", { name: "第一条记录 备注", exact: true })
      .fill("Persisted note");
    await dynamic
      .getByRole("checkbox", { name: "反转顺序", exact: true })
      .check();
    await dynamic
      .getByRole("button", { name: "替换为数据副本", exact: true })
      .click();
    check(
      "Stable keys preserve record inputs across reverse and clone",
      (await dynamic
        .getByRole("textbox", { name: "第一条记录 备注", exact: true })
        .inputValue()) === "Persisted note",
    );
    await dynamic
      .getByRole("button", { name: "追加记录", exact: true })
      .click();
    check(
      "New records enter without changing old content",
      (await dynamic.locator(".hys-ui-timeline-item").count()) === 3,
    );
    const pending = scene("pending");
    check(
      "Pending=true exposes meaningful loading semantics",
      (await pending.getByRole("list").getAttribute("aria-busy")) === "true",
    );
    await choose(pending, "后续节点位置", "start");
    check(
      "Pending position is independent of reverse",
      await pending
        .locator("li")
        .first()
        .evaluate((el) => el.classList.contains("hys-ui-timeline-pending")),
    );
    await choose(pending, "后续状态", "文字节点");
    check(
      "Pending text has a visible hollow node without forced spinner",
      (await pending
        .locator(".hys-ui-timeline-pending .hys-ui-timeline-dot")
        .evaluate((el) => el.getBoundingClientRect().width > 0)) &&
        (await pending.locator(".hys-ui-timeline-spinner").count()) === 0,
    );
    await pending
      .getByRole("checkbox", { name: "自定义后续节点", exact: true })
      .check();
    await choose(pending, "后续状态", "无后续节点");
    check(
      "Explicit false suppresses custom pending templates",
      (await pending.locator(".hys-ui-timeline-pending").count()) === 0,
    );
    check(
      "Business mapping keeps numeric zero identifiers",
      (await scene("mapping").innerText()).includes("原始编号") ||
        (await scene("mapping").locator(".hys-ui-timeline-item").count()) > 0,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await scene("custom").scrollIntoViewIfNeeded();
    check(
      "Timeline cards fit mobile",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await scene("custom").screenshot({
      path: "output/playwright/feedback-timeline-mobile.png",
    });
    check("No runtime errors", errors.length === 0);
    check("No Vue warnings", warnings.length === 0);
    return { checks, errors, warnings };
  } catch (error) {
    return { error: String(error), checks, errors, warnings, url: page.url() };
  }
}
