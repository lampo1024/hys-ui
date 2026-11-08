async (page) => {
  const base = "http://127.0.0.1:5174",
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1680, height: 1000 });
  // Record from before Vue mounts, so a reload cannot hide the first visible jump.
  const initialPage = await page.context().newPage();
  initialPage.on("pageerror", (error) => errors.push(error.message));
  await initialPage.setViewportSize({ width: 1680, height: 1000 });
  await initialPage.route("**/src/examples/HysInput/*.vue*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });
  await initialPage.addInitScript(() => {
    window.__tocInitialFrames = [];
    window.__tocInitialRecording = true;
    const frame = () => {
      if (!window.__tocInitialRecording) return;
      const elements = Array.from(document.querySelectorAll(".doc-toc")).filter(
        (el) => el.getBoundingClientRect().width,
      );
      if (elements.length)
        window.__tocInitialFrames.push(
          elements.map((el) => {
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width };
          }),
        );
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    setTimeout(() => (window.__tocInitialRecording = false), 4000);
  });
  async function initialResult() {
    await initialPage.locator("#scene-graphemes input").first().waitFor();
    await initialPage.waitForTimeout(700);
    return initialPage.evaluate(() => {
      window.__tocInitialRecording = false;
      const frames = window.__tocInitialFrames,
        points = frames.flat(),
        xs = points.map((p) => p.x),
        ys = points.map((p) => p.y);
      return {
        frames: frames.length,
        maxVisible: Math.max(0, ...frames.map((frame) => frame.length)),
        horizontalShift: Math.max(...xs) - Math.min(...xs),
        verticalShift: Math.max(...ys) - Math.min(...ys),
      };
    });
  }
  await initialPage.goto(base + "/components/hys-input");
  const initial = await initialResult();
  await initialPage.reload();
  const reload = await initialResult();
  await initialPage.close();
  await page.goto(base + "/components/hys-button");
  await page.locator("#scene-basic").waitFor();
  await page.waitForTimeout(400);
  await page.route("**/src/examples/HysInput/*.vue*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });
  async function start() {
    await page.evaluate(() => {
      window.__tocFrames = [];
      window.__tocRecording = true;
      const frame = () => {
        if (!window.__tocRecording) return;
        const visible = Array.from(
          document.querySelectorAll(".doc-toc"),
        ).filter((el) => el.getBoundingClientRect().width);
        window.__tocFrames.push({
          positions: visible.map((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          }),
          scrollY,
        });
      };
      window.__tocTake = frame;
      window.__tocTimer = setInterval(frame, 16);
      frame();
    });
  }
  async function stop() {
    return page.evaluate(() => {
      window.__tocTake();
      window.__tocRecording = false;
      clearInterval(window.__tocTimer);
      const frames = window.__tocFrames,
        points = frames.flatMap((frame) => frame.positions),
        xs = points.map((p) => p.x),
        ys = points.map((p) => p.y);
      return {
        frames: frames.length,
        visibleFrames: frames.filter((f) => f.positions.length).length,
        maxVisible: Math.max(...frames.map((f) => f.positions.length)),
        horizontalShift: Math.max(...xs) - Math.min(...xs),
        verticalShift: Math.max(...ys) - Math.min(...ys),
        x: xs.at(-1),
        y: ys.at(-1),
      };
    });
  }
  await start();
  await page
    .locator('.docs-sidebar a[href="/components/hys-input"]')
    .evaluate((el) => el.click());
  await page.locator("h1").filter({ hasText: "HysInput" }).waitFor();
  await page.locator("#scene-graphemes").waitFor();
  await page.waitForTimeout(1000);
  const cold = await stop();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('.doc-toc a[href="#scene-length"]').click();
  await page.waitForTimeout(100);
  const anchor = {
    visible: await page
      .locator("#scene-length")
      .evaluate((el) => Math.abs(el.getBoundingClientRect().top - 100) < 20),
    top: await page
      .locator("#scene-length")
      .evaluate((el) => el.getBoundingClientRect().top),
    hash: await page.evaluate(() => location.hash),
  };
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start();
  await page
    .locator('.docs-sidebar a[href="/components/hys-button"]')
    .evaluate((el) => el.click());
  await page.locator("h1").filter({ hasText: "HysButton" }).waitFor();
  await page.waitForTimeout(400);
  await page
    .locator('.docs-sidebar a[href="/components/hys-input"]')
    .evaluate((el) => el.click());
  await page.locator("h1").filter({ hasText: "HysInput" }).waitFor();
  await page.waitForTimeout(500);
  const cached = await stop();
  await page.setViewportSize({ width: 1680, height: 600 });
  const fits = await page.locator(".doc-toc").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return (
      r.top >= 74 &&
      r.bottom <= innerHeight &&
      el.scrollHeight > el.clientHeight
    );
  });
  await page.locator('.doc-toc a[href="#usage"]').scrollIntoViewIfNeeded();
  const lastReachable = await page
    .locator('.doc-toc a[href="#usage"]')
    .isVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const hidden = await page.locator(".doc-toc").isHidden();
  await page.setViewportSize({ width: 1680, height: 1000 });
  const stable = (result) =>
    result.frames > 0 &&
    result.maxVisible === 1 &&
    result.horizontalShift <= 1 &&
    result.verticalShift <= 1;
  return {
    initial,
    reload,
    cold,
    cached,
    anchor,
    fits,
    lastReachable,
    hidden,
    errors,
    pass:
      [initial, reload, cold, cached].every(stable) &&
      anchor.visible &&
      anchor.hash === "" &&
      fits &&
      lastReachable &&
      hidden &&
      errors.length === 0,
  };
}
