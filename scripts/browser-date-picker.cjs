async (page) => {
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
  try {
    page.setDefaultTimeout(15000);
    await page.setViewportSize({ width: 1680, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("http://127.0.0.1:5174/components/hys-date-picker");
    const scene = (n) => page.locator("#scene-" + n),
      trigger = (n) => scene(n).locator(".hys-ui-date-trigger"),
      out = (n) => scene(n).locator("output"),
      panel = () => page.locator(".hys-ui-date-popup:not(.hys-ui-date-inline)"),
      day = (iso) =>
        panel()
          .locator('[data-date="' + iso + '"]')
          .first(),
      period = (iso) =>
        panel()
          .locator('[data-period="' + iso + '"]')
          .first(),
      dismiss = async () => {
        await page.keyboard.press("Escape");
        await panel().waitFor({ state: "detached" });
      };
    await trigger("basic").waitFor();
    check(
      "Single-date examples have descriptive independent scenes",
      (await page.locator(".example-card").count()) === 16,
    );
    await trigger("basic").click();
    await day("2026-11-06").waitFor();
    check(
      "The default calendar starts on Monday",
      (
        await panel()
          .locator(".hys-ui-date-weekdays span")
          .first()
          .textContent()
      ).includes("一"),
    );
    check(
      "Calendar grids expose semantic rows",
      (await panel().getByRole("row").count()) === 6,
    );
    check(
      "Default navigation icons are visible",
      (await panel().locator(".hys-ui-date-navigation svg").count()) === 4,
    );
    await panel().screenshot({
      path: "output/playwright/date-picker-basic.png",
    });
    await day("2026-11-09").click();
    await panel().waitFor({ state: "detached" });
    check(
      "A single date commits immediately",
      (await out("basic").textContent()).includes("2026-11-09"),
    );
    check(
      "Selection restores trigger focus",
      await trigger("basic").evaluate((el) => el === document.activeElement),
    );
    await scene("basic")
      .getByRole("button", { name: "清空", exact: true })
      .click();
    check(
      "The input clear icon clears the value",
      (await out("basic").textContent()).includes("未选择"),
    );
    await trigger("types").nth(1).click();
    await day("2026-11-12").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Week selection returns its Monday anchor",
      (await out("types").textContent()).includes("2026-11-09"),
    );
    await trigger("types").nth(2).click();
    await period("2026-12-01").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Month selection returns YYYY-MM",
      (await out("types").textContent()).includes("2026-12"),
    );
    await trigger("types").nth(3).click();
    await period("2026-07-01").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Quarter selection returns a quarter value",
      (await out("types").textContent()).includes("2026-Q3"),
    );
    await trigger("types").nth(4).click();
    await period("2027-01-01").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Year selection returns YYYY",
      (await out("types").textContent()).includes("2027"),
    );
    check(
      "Display formatting is independent from the stored value",
      (await trigger("formats").nth(0).textContent()).includes("06.11.2026"),
    );
    check(
      "Timestamp zero remains visible",
      (await trigger("formats").nth(2).textContent()).includes("1970"),
    );
    await trigger("formats").nth(1).click();
    await day("2026-11-09").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Date-object bindings update through the same panel",
      (await out("formats").textContent()).includes("2026"),
    );
    await trigger("multiple").nth(0).click();
    await day("2026-11-10").click();
    check(
      "Multiple selection keeps a draft",
      (await out("multiple").textContent()).includes("2026-11-06") &&
        !(await out("multiple").textContent()).includes("2026-11-10"),
    );
    await day("2026-11-11").click();
    await panel().getByRole("alert").waitFor();
    check(
      "Selection limits provide visible feedback",
      (await panel().getByRole("alert").textContent()).includes("3"),
    );
    await day("2026-11-06").click();
    await panel().getByRole("button", { name: "确定", exact: true }).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Multiple-date confirmation submits the staged set",
      (await out("multiple").textContent()).includes("2026-11-10") &&
        !(await out("multiple").textContent()).includes("2026-11-06"),
    );
    await trigger("shortcuts").click();
    await panel()
      .getByRole("button", { name: "项目启动日", exact: true })
      .click();
    await panel().waitFor({ state: "detached" });
    check(
      "Shortcuts obey normal date output",
      (await out("shortcuts").textContent()).includes("2026-11-02"),
    );
    await trigger("bounds").click();
    check(
      "Excluded weekends are disabled",
      await day("2026-11-07").isDisabled(),
    );
    check(
      "Days outside explicit bounds are disabled",
      await day("2026-12-01").isDisabled(),
    );
    await dismiss();
    await trigger("time").nth(0).click();
    await day("2026-11-09").click();
    check(
      "Datetime date selection waits for confirmation",
      (await out("time").textContent()).includes("2026-11-06 09:30:00"),
    );
    await panel().getByRole("combobox", { name: "时", exact: true }).click();
    check(
      "Disabled time options use custom list semantics",
      await page.getByRole("option", { name: "08", exact: true }).isDisabled(),
    );
    await page.getByRole("option", { name: "10", exact: true }).click();
    await panel().getByRole("button", { name: "确定", exact: true }).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Datetime confirmation includes the chosen hour",
      (await out("time").textContent()).includes("2026-11-09 10:30:00"),
    );
    const text = scene("input").locator(".hys-ui-date-input");
    await text.fill("31.02.2026");
    await text.press("Enter");
    await scene("input").getByRole("alert").waitFor();
    check(
      "Invalid typed dates preserve the current value",
      (await out("input").textContent()).includes("2026-11-06"),
    );
    await text.fill("2026/11/09");
    await text.press("Enter");
    await page.waitForFunction(() =>
      document
        .querySelector("#scene-input output")
        ?.textContent.includes("2026-11-09"),
    );
    check(
      "Alternate input formats normalize the display",
      (await text.inputValue()) === "09.11.2026",
    );
    await trigger("custom").click();
    check(
      "Custom headers remain inside the themed popup",
      (await panel().getByText("交付计划", { exact: true }).count()) === 1,
    );
    check(
      "Custom cells receive ISO metadata",
      (await day("2026-11-11").locator('i[title="里程碑"]').count()) === 1,
    );
    await dismiss();
    check(
      "Inline panels do not create floating dialogs",
      (await scene("inline").locator(".hys-ui-date-inline").count()) === 1 &&
        (await panel().count()) === 0,
    );
    await trigger("controlled").click();
    await day("2026-11-09").click();
    check(
      "A host can reject a date request",
      (await out("controlled").textContent()).includes("已接受：2026-11-06"),
    );
    await dismiss();
    await scene("controlled")
      .getByRole("checkbox", { name: "接受选择请求", exact: true })
      .check();
    await trigger("controlled").click();
    await day("2026-11-10").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Accepted controlled requests update the value",
      (await out("controlled").textContent()).includes("已接受：2026-11-10"),
    );
    await scene("controlled")
      .getByRole("checkbox", { name: "允许打开", exact: true })
      .uncheck();
    await trigger("controlled").click();
    check("A host can reject popup visibility", (await panel().count()) === 0);
    await scene("form")
      .getByRole("button", { name: "保存计划", exact: true })
      .click();
    await scene("form").getByText("请选择交付日期", { exact: true }).waitFor();
    check(
      "Form validation targets the date control",
      (await trigger("form").nth(0).getAttribute("aria-invalid")) === "true",
    );
    await scene("form")
      .getByRole("combobox", { name: "表单尺寸", exact: true })
      .click();
    await page.getByRole("option", { name: "小", exact: true }).click();
    await trigger("form").nth(0).click();
    check(
      "Calendar rows inherit the small form size",
      Math.abs((await day("2026-11-09").boundingBox()).height - 28) < 1,
    );
    check(
      "The small date input keeps the same 30px control height",
      Math.abs(
        (
          await scene("form")
            .locator(".hys-ui-date-control")
            .first()
            .boundingBox()
        ).height - 30,
      ) < 1,
    );
    await day("2026-11-09").click();
    await panel().waitFor({ state: "detached" });
    await trigger("form").nth(1).click();
    await day("2026-11-02").click();
    await day("2026-11-06").click();
    await panel().waitFor({ state: "detached" });
    await scene("form")
      .getByRole("button", { name: "保存计划", exact: true })
      .click();
    await scene("form").getByText("计划已保存", { exact: true }).waitFor();
    check(
      "Date and range fields participate in form submission",
      (await scene("form")
        .locator("input[type=hidden][name=delivery]")
        .inputValue()) === "2026-11-09",
    );
    await scene("form")
      .getByRole("checkbox", { name: "禁用表单", exact: true })
      .check();
    check(
      "Form disabled state reaches both date triggers",
      (await trigger("form").nth(0).isDisabled()) &&
        (await trigger("form").nth(1).isDisabled()),
    );
    await scene("keyboard")
      .getByRole("button", { name: "打开并聚焦日期", exact: true })
      .click();
    check(
      "Opening the instance focuses its selected date",
      await day("2026-11-06").evaluate((el) => el === document.activeElement),
    );
    await page.keyboard.press("End");
    check(
      "Keyboard End reaches the final day of the week",
      await day("2026-11-08").evaluate((el) => el === document.activeElement),
    );
    await page.keyboard.press("PageDown");
    await day("2026-12-08").waitFor();
    check(
      "Keyboard paging preserves the active day",
      await day("2026-12-08").evaluate((el) => el === document.activeElement),
    );
    await dismiss();
    check(
      "Escape returns focus to the date input",
      await trigger("keyboard").evaluate((el) => el === document.activeElement),
    );
    await scene("keyboard")
      .getByRole("button", { name: "定位到明年一月", exact: true })
      .click();
    await day("2027-01-01").waitFor();
    check(
      "Instance browsing does not alter the selected date",
      (await out("keyboard").textContent()).includes("2026-11-06"),
    );
    await dismiss();
    await trigger("locale").click();
    check(
      "English locale translates action labels",
      (await panel()
        .getByRole("button", { name: "Today", exact: true })
        .count()) === 1,
    );
    check(
      "A custom week start controls column labels",
      (
        await panel().locator(".hys-ui-date-weekdays span").nth(1).textContent()
      ).includes("Sun"),
    );
    await dismiss();
    await trigger("states").nth(1).click();
    check(
      "Readonly dates remain unchanged without a popup",
      (await panel().count()) === 0,
    );
    await trigger("basic").click();
    await day("2026-11-09").click();
    await panel().waitFor({ state: "detached" });
    await trigger("basic").click();
    await page.locator('a[href="/components/hys-date-range-picker"]').click();
    await trigger("dual").waitFor();
    check(
      "Leaving the cached single-date page cleans its portal",
      (await panel().count()) === 0,
    );
    check(
      "Range examples have independent named scenes",
      (await page.locator(".example-card").count()) === 13,
    );
    await trigger("basic").click();
    await day("2026-11-15").click();
    check(
      "The first endpoint does not overwrite the range",
      (await out("basic").textContent()).includes("2026-11-20"),
    );
    await day("2026-11-10").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Reverse selection orders both endpoints",
      (await out("basic").textContent()).includes("2026-11-10") &&
        (await out("basic").textContent()).includes("2026-11-15"),
    );
    check(
      "The range remains one trigger",
      (await trigger("basic").count()) === 1,
    );
    await trigger("units").nth(0).click();
    await period("2026-11-01").click();
    await period("2026-12-01").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Month ranges use the same draft workflow",
      (await out("units").textContent()).includes("2026-12"),
    );
    await trigger("dual").click();
    check(
      "Dual-panel mode renders adjacent custom calendars",
      (await panel().locator(".hys-ui-date-panel").count()) === 2,
    );
    await day("2026-11-12").click();
    await day("2026-12-18").click();
    check(
      "Explicit confirmation protects the old range",
      (await out("dual").textContent()).includes("2026-11-02"),
    );
    await panel().getByRole("button", { name: "确定", exact: true }).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Dual-panel confirmation updates both endpoints",
      (await out("dual").textContent()).includes("2026-11-12"),
    );
    await scene("dual")
      .getByRole("checkbox", { name: "独立浏览两个面板", exact: true })
      .check();
    await trigger("dual").click();
    const calendars = panel().locator(".hys-ui-date-panel"),
      leftBefore = await calendars.nth(0).getAttribute("aria-label");
    await calendars
      .nth(1)
      .getByRole("button", { name: "下个月", exact: true })
      .click();
    check(
      "Unlinked panels browse independently",
      (await calendars.nth(0).getAttribute("aria-label")) === leftBefore &&
        (await calendars.nth(1).getAttribute("aria-label")) === "2027-01",
    );
    await panel().screenshot({
      path: "output/playwright/date-picker-range-dual.png",
    });
    await dismiss();
    await trigger("shortcuts").click();
    await panel()
      .getByRole("button", { name: "发布窗口", exact: true })
      .click();
    await panel().waitFor({ state: "detached" });
    check(
      "Range shortcuts preserve two serialized values",
      (await out("shortcuts").textContent()).includes("2026-11-02") &&
        (await out("shortcuts").textContent()).includes("2026-11-20"),
    );
    await trigger("bounds").click();
    await day("2026-11-02").click();
    check(
      "Range length constraints disable distant endpoints",
      await day("2026-11-30").isDisabled(),
    );
    await dismiss();
    await trigger("time").click();
    check(
      "Each datetime endpoint has its own custom time selectors",
      (await panel().getByRole("combobox").count()) === 4,
    );
    await day("2026-11-04").click();
    await day("2026-11-06").click();
    await panel().getByRole("button", { name: "确定", exact: true }).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Range datetime preserves the default end time",
      (await out("time").textContent()).includes("2026-11-06 17:30:00"),
    );
    await scene("partial").locator(".hys-ui-date-input").first().click();
    await panel()
      .getByRole("button", { name: "清空 开始日期", exact: true })
      .click();
    await panel().getByRole("button", { name: "确定", exact: true }).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Open-ended ranges can explicitly clear one endpoint",
      (await out("partial").textContent()).replace(/\s/g, "") === '["",""]',
    );
    await trigger("locked").click();
    check(
      "Locked endpoints have disabled role buttons",
      await panel()
        .locator(".hys-ui-date-range-status button")
        .nth(0)
        .isDisabled(),
    );
    await day("2026-11-12").click();
    await panel().getByRole("button", { name: "确定", exact: true }).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Editing an unlocked endpoint retains the fixed start",
      (await out("locked").textContent()).includes("2026-11-02") &&
        (await out("locked").textContent()).includes("2026-11-12"),
    );
    await trigger("custom").click();
    await day("2026-11-03").click();
    await day("2026-11-13").click();
    await panel()
      .getByRole("button", { name: "应用范围", exact: true })
      .click();
    await panel().waitFor({ state: "detached" });
    check(
      "Custom footers can apply a valid draft",
      (await out("custom").textContent()).includes("2026-11-13"),
    );
    await scene("methods")
      .getByRole("button", { name: "设置十二月范围", exact: true })
      .click();
    await page.waitForFunction(() =>
      document
        .querySelector("#scene-methods output")
        ?.textContent.includes("2026-12-18"),
    );
    check("Instance value updates validate and serialize ranges", true);
    await page.locator('a[href="/components/hys-date-picker"]').click();
    await trigger("locale").waitFor();
    check(
      "Returning to the cached page preserves its date",
      (await out("basic").textContent()).includes("2026-11-09"),
    );
    for (const [label, theme] of [
      ["科技蓝", "blue"],
      ["深色", "dark"],
      ["清新绿", "green"],
      ["紫色", "purple"],
      ["暖橙", "orange"],
      ["森林", "forest"],
    ]) {
      await page
        .getByRole("combobox", { name: "文档主题", exact: true })
        .click();
      await page.getByRole("option", { name: label, exact: true }).click();
      await trigger("basic").click();
      check(
        theme + " theme reaches date overlays",
        (await panel().getAttribute("data-hys-theme")) === theme,
      );
      await dismiss();
    }
    await page
      .locator("#api")
      .getByText("disabledTime", { exact: true })
      .waitFor();
    check(
      "The API includes shared date/time contracts",
      (await page
        .locator("#api")
        .getByText("inputFormats", { exact: true })
        .count()) === 1,
    );
    await page
      .locator("#api")
      .getByRole("tab", { name: "实例方法", exact: true })
      .click();
    await page
      .locator("#api")
      .getByText("showMonth", { exact: true })
      .waitFor();
    check("Instance navigation is documented", true);
    await page.setViewportSize({ width: 390, height: 844 });
    await trigger("basic").click();
    const box = await panel().boundingBox();
    check(
      "Date overlays fit within narrow viewport edges",
      box.x >= 0 && box.x + box.width <= 391,
    );
    await panel().screenshot({
      path: "output/playwright/date-picker-mobile.png",
    });
    await dismiss();
    check(
      "Single-date examples do not overflow the mobile document",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.getByRole("button", { name: "切换导航", exact: true }).click();
    await page.locator('a[href="/components/hys-date-range-picker"]').click();
    await trigger("dual").waitFor();
    await trigger("dual").click();
    const dualBox = await panel().boundingBox();
    check(
      "Dual range overlays fit mobile edges",
      dualBox.x >= 0 && dualBox.x + dualBox.width <= 391,
    );
    check(
      "Dual calendars scroll inside their popup",
      await panel()
        .locator(".hys-ui-date-panels")
        .evaluate((el) => el.scrollWidth > el.clientWidth),
    );
    await dismiss();
    check(
      "Range examples do not overflow the mobile document",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    check(
      "No runtime errors or Vue warnings",
      !errors.length && !warnings.length,
    );
    return { checks, errors, warnings };
  } catch (error) {
    return {
      checks,
      errors,
      warnings,
      error: String(error.stack || error),
      popup: await page
        .locator(".hys-ui-date-popup:not(.hys-ui-date-inline)")
        .textContent()
        .catch(() => null),
    };
  }
}