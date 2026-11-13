async (page) => {
  const verified = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const check = (name, condition) => { if (!condition) throw Error(name); verified.push(name); };
  const scene = name => page.locator("#scene-" + name);
  const button = (scope, name) => scene(scope).getByRole("button", { name, exact: true });
  const goto = name => page.goto("http://127.0.0.1:5174/components/hys-" + name);
  await page.addInitScript(() => localStorage.removeItem("hys-docs-icon-picker"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await goto("spin");
  await button("animations", "暂停").waitFor();
  const sample = scene("animations").locator(".spin-preview .hys-spin-rotate").first();
  const animation = () => sample.evaluate(el => {
    const css = getComputedStyle(el);
    return { name: css.animationName, state: css.animationPlayState, active: el.getAnimations().length };
  });
  check("Spin renders a running SVG animation", (await animation()).active > 0);
  await button("animations", "暂停").click();
  check("Spin pauses the existing animation", (await animation()).state === "paused");
  await button("animations", "继续").click();
  check("Spin resumes the existing animation", (await animation()).state === "running");
  await button("animations", "停止").click();
  check("Spin stops the animation", (await animation()).name === "none");
  await button("animations", "重播").click();
  check("Spin restarts", (await animation()).active > 0);
  check("All 30 Spin presets are available", await scene("animations").locator(".spin-animation-grid button").count() === 30);
  await button("timing", "模拟 100 ms 请求").click();
  await page.waitForTimeout(250);
  check("Short tasks skip the delayed indicator", !(await scene("timing").locator(".hys-spin-layer").count()));
  await button("timing", "模拟 500 ms 请求").click();
  await scene("timing").locator(".hys-spin-layer").waitFor();
  await scene("timing").locator(".hys-spin-layer").waitFor({ state: "hidden" });
  verified.push("Longer tasks display and then release the indicator");

  await button("tasks", "模拟失败").click();
  await scene("tasks").locator('[role="progressbar"]').waitFor();
  await scene("tasks").getByRole("button", { name: "重试", exact: true }).click();
  await scene("tasks").locator('.hys-spin-layer[data-status="success"]').waitFor();
  await button("tasks", "同步报表").click();
  await scene("tasks").getByRole("button", { name: "取消加载", exact: true }).click();
  await scene("tasks").locator('.hys-spin-layer[data-status="cancelled"]').waitFor();
  verified.push("Progress, failure, retry, success and cancellation render in the same Spin");

  const launch = button("overlay", "打开全屏加载");
  await launch.click();
  const screen = page.locator('.hys-spin-layer[data-mode="fullscreen"]');
  await screen.waitFor();
  check("Fullscreen Spin locks scrolling", await page.evaluate(() => document.body.style.overflow === "hidden"));
  await page.keyboard.press("Escape");
  await screen.waitFor({ state: "hidden" });
  check("Fullscreen Spin restores scrolling and focus", await launch.evaluate(el => document.body.style.overflow === "" && document.activeElement === el));
  await button("custom", "运行服务任务").click();
  const target = scene("custom").locator(".spin-service-target");
  await target.locator(".hys-spin-layer").waitFor();
  check("A service can cover and block a specific region", await target.locator("strong").evaluate(el => el.hasAttribute("inert")));
  await target.locator(".hys-spin-layer").waitFor({ state: "hidden" });
  check("Local service restores the region", await target.locator("strong").evaluate(el => !el.hasAttribute("inert")));

  await goto("icon");
  const image = scene("sources").locator(".hys-icon-graphic:is(img)");
  await image.waitFor();
  await image.evaluate(el => el.decode());
  check("External SVG renders as a real image", await image.evaluate(el => el.complete && el.naturalWidth > 0));
  check("Sprite points to an existing symbol", await scene("sources").locator(".hys-ui-icon use").evaluate(el => !!document.getElementById(el.getAttribute("href").slice(1))));
  const motion = scene("motion").getByRole("button", { name: "图标动效预览" }).locator(".hys-icon-motion");
  check("Icon plays its animation", await motion.evaluate(el => el.getAnimations().length > 0));
  await button("motion", "暂停").click();
  check("Icon pause applies to CSS motion", await motion.evaluate(el => getComputedStyle(el).animationPlayState === "paused"));
  const favorite = scene("interactions").getByRole("button", { name: "收藏项目" });
  await favorite.focus();
  await page.keyboard.press("Space");
  check("Keyboard activates the icon button", await favorite.getAttribute("aria-pressed") === "true");
  await scene("interactions").getByText("RTL 排版", { exact: true }).click();
  const arrow = scene("interactions").getByRole("link", { name: "定位当前示例" }).locator(".hys-icon-orientation");
  check("Directional icons mirror in RTL", await arrow.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a === -1));

  await button("registry", "替换为 2.0").click();
  check("Registered aliases follow replacement", (await scene("registry").locator("small").textContent()).includes("2.0"));
  await button("registry", "测试缺失回退").click();
  await scene("registry").getByText("未找到图标，已显示回退", { exact: true }).waitFor();
  verified.push("Unknown icons show fallback and emit failure");

  const picker = scene("picker").locator(".hys-icon-picker");
  await picker.waitFor();
  await picker.getByRole("searchbox").fill("工作台");
  await picker.getByRole("option", { name: /工作台/ }).click();
  await picker.getByRole("button", { name: "收藏图标", exact: true }).click();
  await picker.getByRole("button", { name: "收藏", exact: true }).click();
  check("Picker searches, selects and saves favorites", await picker.getByRole("option", { name: /工作台/ }).count() === 1);
  await picker.locator('input[type="file"]').setInputFiles({
    name: "test-chart.svg", mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" viewBox="0 0 24 24"><script>alert(1)</script><path d="M2 20L20 2" onclick="alert(2)" /></svg>'),
  });
  const uploaded = picker.getByRole("option", { name: /test-chart/ });
  await uploaded.click();
  check("SVG upload renders only allowlisted content", await uploaded.locator("path").count() === 1 && !(await uploaded.locator("script,[onclick],[onload]").count()));

  await page.setViewportSize({ width: 390, height: 844 });
  check("Icon examples fit a narrow viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await picker.getByRole("combobox").first().selectOption("");
  await picker.getByRole("button", { name: "下一页", exact: true }).waitFor();
  check("Narrow Icon Picker limits results and keeps the preview close", await picker.getByRole("listbox").getByRole("option").count() === 9);
  await picker.getByRole("button", { name: "下一页", exact: true }).click();
  check("Narrow Icon Picker pagination moves to the next results", (await picker.locator(".hys-icon-picker-pages").textContent()).trim().startsWith("2 /"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  check("Icon honors system reduced motion", await motion.evaluate(el => getComputedStyle(el).animationName === "none"));
  await goto("spin");
  check("Spin examples fit a narrow viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  check("Spin honors system reduced motion", (await animation()).name === "none");
  check("No uncaught browser errors", !errors.length);
  return verified;
}
