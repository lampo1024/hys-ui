async (page) => {
  const errors = [], checks = [];
  page.on("pageerror", error => errors.push(error.message));
  const check = (label, valid) => {
    if (!valid) throw Error(label);
    checks.push(label);
  };
  const scene = id => page.locator("#scene-" + id);
  const button = (id, name) => scene(id).getByRole("button", { name, exact: true });
  const dialog = name => page.getByRole("dialog", { name, exact: true });
  const focused = locator => locator.evaluate(el => document.activeElement === el);
  const feedback = (id, message) => scene(id).getByText(message, { exact: true }).waitFor();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:5174/components/hys-popconfirm");

  const archive = button("basic", "归档季度报告");
  const basic = dialog("归档季度报告？");
  await archive.click();
  await basic.waitFor();
  await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "取消");
  check("Initial focus is the safer action", await focused(basic.getByRole("button", { name: "取消", exact: true })));
  check("Trigger and description reference the panel",
    await archive.getAttribute("aria-controls") === await basic.getAttribute("id") && !!await basic.getAttribute("aria-describedby"));
  const icon = basic.locator(".hys-popconfirm-icon");
  check("Default tone renders a tinted icon",
    await icon.locator("svg").count() === 1 && await icon.evaluate(el => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)"));
  await page.keyboard.press("Tab");
  check("Tab reaches the confirm action", await focused(basic.getByRole("button", { name: "归档报告", exact: true })));
  await page.keyboard.press("Escape");
  await basic.waitFor({ state: "hidden" });
  check("Escape restores trigger focus", await focused(archive));
  await page.keyboard.press("Space");
  await basic.getByRole("button", { name: "取消", exact: true }).click();
  await feedback("basic", "已取消归档");
  await archive.click();
  await basic.getByRole("button", { name: "归档报告", exact: true }).click();
  await feedback("basic", "季度报告已归档");
  check("Focus moves to the restore action after archive", await focused(button("basic", "恢复报告")));

  const publish = button("async", "发布公告");
  const asynchronous = dialog("发布系统公告？");
  await publish.click();
  await asynchronous.getByRole("button", { name: "确认发布", exact: true }).click();
  const loading = asynchronous.getByRole("button", { name: "正在发布", exact: true });
  await loading.waitFor();
  check("Loading disables duplicate confirmation", await loading.isDisabled());
  await page.keyboard.press("Escape");
  check("Escape leaves pending submission open", await asynchronous.isVisible());
  await asynchronous.getByRole("alert").waitFor();
  check("Rejected action exposes retry text", (await asynchronous.getByRole("alert").textContent()).includes("重试"));
  await asynchronous.getByRole("button", { name: "确认发布", exact: true }).click();
  await feedback("async", "公告已发布到工作区");
  await asynchronous.waitFor({ state: "hidden" });
  check("Successful retry restores trigger focus", await focused(publish));
  await publish.click();
  await asynchronous.getByRole("button", { name: "确认发布", exact: true }).click();
  await asynchronous.getByRole("button", { name: "取消", exact: true }).click();
  await feedback("async", "已取消发布");
  await asynchronous.waitFor({ state: "hidden" });
  checks.push("Pending work can be explicitly cancelled");

  await button("guard", "清空历史记录").click();
  const guard = dialog("清空历史记录？");
  await guard.getByRole("button", { name: "清空记录", exact: true }).click();
  await feedback("guard", "请先确认备份已完成");
  check("A guard veto keeps the confirmation open", await guard.isVisible());
  await guard.getByText("我已完成备份", { exact: true }).click();
  await guard.getByRole("button", { name: "清空记录", exact: true }).click();
  await feedback("guard", "已清空历史记录");

  await button("table", "删除库存盘点报告").click();
  await dialog("删除「库存盘点报告」？").getByRole("button", { name: "删除报告", exact: true }).click();
  await scene("table").getByText("库存盘点报告", { exact: true }).waitFor({ state: "hidden" });
  check("Row deletion focuses the adjacent row", await focused(button("table", "删除渠道数据汇总")));
  await button("controlled", "通过实例展开").click();
  await dialog("标记全部通知为已读？").waitFor();
  await button("controlled", "通过实例收起").click();
  await feedback("controlled", "收起原因 · programmatic");
  check("Controlled external reference supports instance methods", await button("controlled", "标记为已读").getAttribute("aria-expanded") === "false");
  await button("custom", "暂停提醒").click();
  await dialog("暂停工作区提醒？").getByRole("button", { name: "8 小时", exact: true }).click();
  await feedback("custom", "已暂停提醒 8 小时");
  checks.push("Custom actions can confirm with their chosen value");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button("placement", "停用链接").click();
  const placement = dialog("停用分享链接？");
  await placement.waitFor();
  const bounds = await placement.boundingBox();
  check("Popup stays within the narrow viewport", bounds.x >= 0 && bounds.x + bounds.width <= 391);
  check("Documentation has no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  check("Reduced motion disables the transition", await placement.evaluate(el => el.getAnimations({ subtree: true }).length === 0));
  await page.keyboard.press("Escape");
  await scene("placement").getByRole("combobox", { name: "触发方式" }).click();
  await page.getByRole("option", { name: "右键菜单", exact: true }).click();
  const contextTrigger = button("placement", "右键停用链接");
  await contextTrigger.click({ button: "right" });
  await placement.waitFor();
  await page.keyboard.press("Escape");
  check("Context menu opens and Escape restores its trigger", await focused(contextTrigger));
  await page.keyboard.press("Shift+F10");
  await placement.waitFor();
  checks.push("Context-menu trigger supports Shift+F10");
  check("No browser errors", errors.length === 0);
  return checks;
}
