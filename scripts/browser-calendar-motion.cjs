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
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base + "/components/hys-calendar");
  const scene = page.locator("#scene-motion"),
    chart = scene.locator(".hys-ui-calendar"),
    selector = scene.getByRole("combobox", {
      name: "日历切换动画",
      exact: true,
    }),
    next = chart.getByRole("button", { name: "下一月", exact: true }),
    prev = chart.getByRole("button", { name: "上一月", exact: true });
  await chart.waitFor();
  await scene
    .getByRole("spinbutton", { name: "日历动画时长", exact: true })
    .fill("600");
  await scene
    .getByRole("spinbutton", { name: "日历动画时长", exact: true })
    .press("Enter");
  const state = () =>
    chart.evaluate((c) => ({
      pages: [...c.querySelectorAll(".hys-ui-calendar-page")].map((p) => ({
        key: p.dataset.calendarPanel,
        classes: p.className,
        hidden: p.getAttribute("aria-hidden"),
        inert: p.inert,
        transform: getComputedStyle(p).transform,
        opacity: getComputedStyle(p).opacity,
        duration: getComputedStyle(p).transitionDuration,
      })),
      height: c.querySelector(".hys-ui-calendar-body").clientHeight,
      active: c.querySelectorAll(
        '.hys-ui-calendar-page:not([aria-hidden="true"]) [role="grid"]',
      ).length,
    }));
  for (const [label, type] of [
    ["横向滑动", "slide"],
    ["淡入淡出", "fade"],
    ["纵向滑动", "slide-up"],
    ["轻微缩放", "zoom"],
  ]) {
    await selector.click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await next.click();
    let s = await state();
    check(
      type + " uses a configured CSS transition",
      s.pages.some(
        (p) =>
          p.classes.includes("hys-ui-calendar-" + type) &&
          p.classes.includes("active") &&
          p.duration.split(",").every(v=>v.trim()==="0.6s"),
      ),
    );
    check(
      type + " exposes only the incoming panel to interaction",
      s.active === 1 &&
        s.pages.filter((p) => p.hidden === "true").every((p) => p.inert),
    );
    await page.waitForTimeout(650);
    check(
      type + " removes the departed panel",
      (await chart.locator(".hys-ui-calendar-page").count()) === 1,
    );
  }
  await selector.click();
  await page.getByRole("option", { name: "横向滑动", exact: true }).click();
  await prev.click();
  check(
    "Previous months reverse the slide direction",
    (await state()).pages.some((p) =>
      p.classes.includes("slide-prev-enter-active"),
    ),
  );
  await page.waitForTimeout(650);
  await chart.locator('[role="gridcell"][tabindex="0"]').focus();
  await page.keyboard.press("PageDown");
  check(
    "Keyboard focus enters the new panel during animation",
    (await chart
      .locator(
        '.hys-ui-calendar-page:not([aria-hidden="true"]) [role="gridcell"]:focus',
      )
      .count()) === 1,
  );
  await page.waitForTimeout(650);
  await selector.click();
  await page.getByRole("option", { name: "关闭动画", exact: true }).click();
  await next.click();
  check(
    "None switches immediately without a second panel",
    (await state()).pages.length === 1,
  );
  await selector.click();
  await page.getByRole("option", { name: "轻微缩放", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(30);
  await next.click();
  check(
    "Reduced motion bypasses configured animations",
    (await state()).pages.length === 1 &&
      !(await state()).pages[0].classes.includes("active"),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(30);
  await next.click();
  await next.click();
  await prev.click();
  await page.waitForTimeout(650);
  check(
    "Rapid navigation settles to one accessible panel",
    (await state()).pages.length === 1 && (await state()).active === 1,
  );
  check("No motion runtime errors", !errors.length);
  return { checks, errors };
}
