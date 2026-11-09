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
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/components/hys-select");
  const scene = page.locator("#scene-manyoptions"),
    single = scene.getByRole("combobox", { name: "多选项单选", exact: true }),
    multi = scene.getByRole("combobox", { name: "多选项多选", exact: true });
  await single.waitFor();
  const geometry = () =>
    page.locator(".hys-ui-select-options").evaluate((p) => {
      const l = p.querySelector(".hys-ui-select-list"),
        r = p.getBoundingClientRect();
      return {
        height: r.height,
        top: r.top,
        bottom: r.bottom,
        vh: innerHeight,
        list: l.clientHeight,
        scroll: l.scrollHeight,
        overflow: getComputedStyle(l).overflowY,
        panelScroll: p.scrollHeight > p.clientHeight + 1,
      };
    });
  await single.click();
  let g = await geometry();
  check(
    "Many options remain in a bounded internal scrollport",
    g.list <= 240 &&
      g.scroll > g.list &&
      g.overflow === "auto" &&
      g.height < 400,
  );
  check("Popup stays within the viewport", g.top >= 8 && g.bottom <= g.vh - 8);
  check("Popup itself does not acquire a second scrollbar", !g.panelScroll);
  await page.getByRole("textbox", { name: "搜索选项" }).fill("成员 80");
  check(
    "Filtering reduces a short list to natural height",
    (await geometry()).list < 80,
  );
  await page
    .getByRole("option", { name: "成员 80 · 运营支持", exact: true })
    .click();
  check(
    "A late option updates the model",
    (await scene.locator("output").textContent()).includes("单选：80"),
  );
  await single.click();
  await page.getByRole("textbox", { name: "搜索选项" }).fill("");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  check(
    "Keyboard End reaches the last item through internal scrolling",
    (await scene.locator("output").textContent()).includes("单选：80"),
  );
  await multi.click();
  g = await geometry();
  check(
    "Header and footer coexist with a bounded list",
    g.list <= 240 &&
      !g.panelScroll &&
      (await page.locator(".hys-ui-select-header").isVisible()) &&
      (await page.locator(".hys-ui-select-footer").isVisible()),
  );
  await page
    .locator(".hys-ui-select-list")
    .evaluate((e) => (e.scrollTop = e.scrollHeight));
  check(
    "Footer remains visible after scrolling",
    await page.locator(".hys-ui-select-footer").isVisible(),
  );
  await page
    .locator(".hys-ui-select-options")
    .screenshot({ path: "output/playwright/select-many-options.png" });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 360 });
  await multi.click();
  g = await geometry();
  check(
    "Short mobile windows shrink the popup and keep internal scrolling",
    g.height <= 216 + 2 &&
      g.list <= 162 &&
      g.bottom <= 352 &&
      g.top >= 8 &&
      g.scroll > g.list &&
      !g.panelScroll,
  );
  await page.getByRole("textbox", { name: "搜索选项" }).fill("成员 75");
  await page
    .getByRole("option", { name: "成员 75 · 质量保障", exact: true })
    .click();
  check(
    "Mobile filtering and selection remain usable",
    (await scene.locator("output").textContent()).includes("75"),
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const virtual = page.locator("#scene-virtual");
  await virtual.getByRole("combobox").click();
  g = await geometry();
  check(
    "Ten thousand options keep both DOM and popup height bounded",
    (await page.getByRole("option").count()) < 60 && g.list <= 252,
  );
  await page.keyboard.press("Escape");
  check("No Select runtime errors", !errors.length);
  return { checks, errors };
}
