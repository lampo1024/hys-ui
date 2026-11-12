async (page) => {
  const verified = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const check = (name, condition) => {
    if (!condition) throw Error(name);
    verified.push(name);
  };
  const scene = (id) => page.locator("#scene-" + id);
  const toast = (message) =>
    page.locator(".hys-ui-toast").filter({ hasText: message });
  const click = (id, name) =>
    scene(id).getByRole("button", { name, exact: true }).click();
  const dismiss = async (item) => {
    await item.getByRole("button", { name: "关闭提示", exact: true }).click();
    await item.waitFor({ state: "hidden" });
  };
  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "none" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:5174/components/hys-toast");
  await click("basic", "成功");
  const basic = toast("保存成功");
  await basic.waitFor();
  await basic.evaluate((el) =>
    Promise.all(
      el.getAnimations().map((item) => item.finished.catch(() => {})),
    ),
  );
  const box = await basic.boundingBox();
  check(
    "Default position and inset",
    Math.abs(
      box.x +
        box.width / 2 -
        (await basic.evaluate((el) => parseFloat(getComputedStyle(el).left))),
    ) < 2 && Math.abs(box.y - 24) < 2,
  );
  await dismiss(basic);
  await click("service", "成功提示");
  const short = toast("保存成功");
  await short.waitFor();
  const row = await short.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const centers = [
      ".hys-ui-toast-icon",
      ".hys-ui-toast-message",
      ".hys-ui-toast-dismiss",
    ].map((selector) => {
      const box = el.querySelector(selector).getBoundingClientRect();
      return box.y + box.height / 2;
    });
    const clip = el.closest(".hys-ui-toast-stack").getBoundingClientRect();
    return {
      height: rect.height,
      spread: Math.max(...centers) - Math.min(...centers),
      shadowRoom: rect.left - clip.left,
    };
  });
  check(
    "Short service toast stays in one row with room for its shadow",
    row.height < 62 && row.spread < 2 && row.shadowRoom >= 40,
  );
  await dismiss(short);

  await click("queue", "添加 A 组任务");
  await click("queue", "添加 A 组任务");
  await click("queue", "添加 B 组任务");
  await click("queue", "添加紧急任务");
  check(
    "Queue waits at capacity",
    (await toast("紧急任务 4").count()) === 0 &&
      (await scene("queue").getByText("等待中", { exact: true }).count()) === 2,
  );
  await dismiss(toast("普通任务 1"));
  await toast("紧急任务 4").waitFor();
  check(
    "Highest priority promoted first",
    (await toast("普通任务 3").count()) === 0,
  );
  await click("queue", "清空等待队列");
  await click("queue", "关闭全部");
  await page.locator("[data-hys-toast-host]").waitFor({ state: "detached" });

  await click("tasks", "模拟网络失败");
  const transfer = page.locator("[data-toast-id=transfer]");
  await transfer.getByRole("progressbar").waitFor();
  await transfer.getByRole("button", { name: "重试" }).waitFor();
  await transfer.getByRole("button", { name: "重试" }).click();
  await transfer.getByText("上传完成", { exact: true }).waitFor();
  check(
    "Retry updates one Toast through error and progress to success",
    (await transfer.count()) === 1,
  );
  await dismiss(transfer);

  await click("stack", "显示一组提示");
  const stack = page.locator(".hys-ui-toast-stack");
  const toggle = stack.locator(".hys-ui-toast-stack-toggle");
  const back = toast("同步成员列表");
  const front = page.locator("[data-toast-id=stack-0]");
  await front.waitFor();
  check(
    "Stack shows two layered previews",
    (await stack.locator(".hys-ui-toast-layer-preview").count()) === 2 &&
      !(await back.isVisible()),
  );
  const peek = stack.locator(".hys-ui-toast-layer-preview").first();
  const hit = await peek.evaluate((el) => {
    const edge = el.getBoundingClientRect(),
      face = el.parentElement
        .querySelector(".hys-ui-toast")
        .getBoundingClientRect();
    return { x: edge.x + edge.width / 2, y: (edge.y + face.y) / 2 };
  });
  check(
    "Pointer starts on the exposed layer",
    await peek.evaluate(
      (el, point) => document.elementFromPoint(point.x, point.y) === el,
      hit,
    ),
  );
  await toggle.evaluate((el) => {
    window.toastDisclosureChanges = [];
    new MutationObserver(() =>
      window.toastDisclosureChanges.push(el.getAttribute("aria-expanded")),
    ).observe(el, { attributes: true, attributeFilter: ["aria-expanded"] });
  });
  await page.mouse.move(hit.x, hit.y);
  await back.waitFor({ state: "visible" });
  await page.waitForTimeout(1100);
  check(
    "A stationary pointer on a revealed edge does not repeatedly toggle the stack",
    (await back.isVisible()) &&
      (await page.evaluate(
        () => JSON.stringify(window.toastDisclosureChanges) === '["true"]',
      )),
  );
  await page.mouse.move(800, 200);
  await back.waitFor({ state: "hidden" });
  verified.push("Hover reveals rear messages and leaving collapses them");
  await page.mouse.click(hit.x, hit.y);
  await back.waitFor({ state: "visible" });
  await page.mouse.move(800, 200);
  await page.waitForTimeout(220);
  check("Click pins the open stack", await back.isVisible());
  await toggle.focus();
  await page.keyboard.press("Enter");
  await back.waitFor({ state: "hidden" });
  verified.push("Keyboard toggles the pinned stack");
  await click("stack", "切换第一条的位置");
  check(
    "A displayed toast moves to another stack",
    await page
      .locator("[data-toast-id=stack-0]")
      .evaluate((el) =>
        el.classList.contains("hys-ui-toast-position-top-right"),
      ),
  );
  await click("stack", "清理示例提示");
  await page.waitForFunction(
    () => !document.querySelector(".hys-ui-toast-stack"),
  );

  await scene("interactions").getByText("阻止关闭", { exact: true }).click();
  await click("interactions", "显示可操作提示");
  const interactive = toast("工单状态更新");
  await interactive.waitFor();
  await interactive.getByRole("button", { name: "关闭提示" }).click();
  await scene("interactions")
    .getByText(/关闭条件尚未满足/)
    .waitFor();
  check("Async close guard holds the message", await interactive.isVisible());
  await scene("interactions").getByText("阻止关闭", { exact: true }).click();
  const title = await interactive.locator(".hys-ui-toast-title").boundingBox();
  await page.mouse.move(title.x + 20, title.y + 7);
  await page.mouse.down();
  await page.mouse.move(title.x + 166, title.y + 7, { steps: 10 });
  await page.mouse.up();
  await interactive.waitFor({ state: "hidden" });
  await scene("interactions")
    .getByText("关闭完成 · swipe", { exact: true })
    .waitFor();
  verified.push("Mouse swipe dismisses and reports its reason");

  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => /Chrome\//.test(navigator.userAgent))) {
    await click("interactions", "显示可操作提示");
    const touchTitle = await interactive
      .locator(".hys-ui-toast-title")
      .boundingBox();
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: true,
        maxTouchPoints: 1,
      });
      const x = touchTitle.x + 10,
        y = touchTitle.y + 6;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (const distance of [12, 30, 58, 85, 112]) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x + distance, y }],
        });
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await interactive.waitFor({ state: "hidden" });
      await scene("interactions")
        .getByText("关闭完成 · swipe", { exact: true })
        .waitFor();
      verified.push("A touch swipe dismisses the message at mobile width");
    } finally {
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
      await cdp.detach();
    }
  }
  await click("appearance", "预览定制提示");
  const appearance = page.locator("[data-toast-id=appearance]");
  await appearance.getByRole("button", { name: "展开内容" }).click();
  const narrow = await appearance.boundingBox();
  check(
    "Long content and actions fit the viewport",
    narrow.x >= 12 && narrow.x + narrow.width <= 378 && narrow.height > 100,
  );
  await dismiss(appearance);

  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await click("motion", "播放动画");
  const motion = toast("动画预览");
  await motion.waitFor();
  const appearanceStyles = await motion.evaluate((el) => ({
    duration: getComputedStyle(el).transitionDuration,
    border: getComputedStyle(el).borderTopWidth,
  }));
  check(
    "Reduced motion and forced color border",
    appearanceStyles.duration
      .split(",")
      .every((value) => parseFloat(value) === 0) &&
      appearanceStyles.border === "1px",
  );
  await dismiss(motion);
  check("No browser runtime errors", errors.length === 0);
  return verified;
}
