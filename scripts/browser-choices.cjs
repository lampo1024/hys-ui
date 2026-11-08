async (page) => {
  const checks = [],
    errors = [],
    warnings = [],
    check = (name, pass) => {
      checks.push({ name, pass: !!pass });
      if (!pass) throw Error(name);
    },
    scene = (name) => page.locator("#scene-" + name),
    text = async (name) => scene(name).locator("output").textContent(),
    route = async (name, slug) => {
      await page.goto("http://127.0.0.1:5174/components/" + slug);
      await page.locator("h1").filter({ hasText: name }).waitFor();
      await scene("basic").locator("input,button").first().waitFor();
    };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" && m.text().includes("[Vue warn]"))
      warnings.push(m.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  try {
    await route("HysCheckbox", "hys-checkbox");
    await scene("basic")
      .getByRole("checkbox", { name: "接收更新通知", exact: true })
      .check();
    check(
      "Checkbox accepts boolean values",
      (await text("basic")).includes("是"),
    );
    check(
      "Uncontrolled checkbox defaults render checked",
      await scene("basic")
        .getByRole("checkbox", { name: "默认选中，无需绑定状态", exact: true })
        .isChecked(),
    );
    await scene("values")
      .getByRole("checkbox", { name: "字符串值", exact: true })
      .check();
    await scene("values")
      .getByRole("checkbox", { name: "数字值", exact: true })
      .check();
    check(
      "Checkbox maps string and numeric state",
      (await text("values")).includes("yes") &&
        (await text("values")).includes("1"),
    );
    await scene("array")
      .getByRole("checkbox", { name: "字符串 1", exact: true })
      .check();
    await scene("array")
      .getByRole("checkbox", { name: "布尔 false", exact: true })
      .check();
    check(
      "Array checkbox values retain exact types",
      (await text("array")).includes('[1,"1",false]'),
    );
    check(
      "Master checkbox has mixed semantics",
      (await scene("all")
        .getByRole("checkbox", { name: "选择全部角色", exact: true })
        .getAttribute("aria-checked")) === "mixed",
    );
    await scene("all")
      .getByRole("checkbox", { name: "选择全部角色", exact: true })
      .check();
    check(
      "Master checkbox selects all roles",
      await scene("all")
        .getByRole("checkbox")
        .evaluateAll((els) => els.every((el) => el.checked)),
    );
    await scene("methods")
      .getByRole("button", { name: "聚焦复选框", exact: true })
      .click();
    check(
      "Checkbox public focus reaches its native control",
      await scene("methods")
        .getByRole("checkbox")
        .evaluate((el) => el === document.activeElement),
    );
    await scene("methods").getByRole("checkbox").press("Space");
    check(
      "Checkbox supports Space selection",
      (await text("methods")).includes("true"),
    );
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Checkbox form validation is shown",
      (await scene("form").textContent()).includes("请确认此项"),
    );
    await scene("form").getByRole("checkbox").check();
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Checkbox form submits accepted values",
      (await text("form")).includes("提交成功"),
    );
    await scene("configure")
      .getByRole("checkbox", { name: "按钮外观", exact: true })
      .check();
    await scene("configure")
      .getByRole("checkbox", { name: "部分选中", exact: true })
      .check();
    check(
      "Button checkboxes visibly represent mixed state",
      await scene("configure")
        .locator(
          ".hys-ui-checkbox-button[data-indeterminate] .hys-ui-checkbox-box",
        )
        .evaluate((el) => getComputedStyle(el).display !== "none"),
    );
    await scene("appearance").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "output/playwright/choice-checkbox-wide.png",
    });
    await route("HysCheckboxGroup", "hys-checkbox-group");
    await scene("basic")
      .getByRole("checkbox", { name: "研发", exact: true })
      .check();
    check(
      "Checkbox groups update data options",
      (await text("basic")).includes("dev"),
    );
    check(
      "Disabled checkbox options stay unavailable",
      await scene("basic")
        .getByRole("checkbox", { name: "测试", exact: true })
        .isDisabled(),
    );
    await scene("all")
      .getByRole("button", { name: "全选", exact: true })
      .click();
    check(
      "Group checkAll includes every editable item",
      (await text("all")).includes("Alex") &&
        (await text("all")).includes("Amy"),
    );
    await scene("all")
      .getByRole("button", { name: "清除可选项", exact: true })
      .click();
    check(
      "Group clear preserves locked values",
      (await text("all")).trim() === "fixed",
    );
    await scene("limits")
      .getByRole("button", { name: "选至上限", exact: true })
      .click();
    check(
      "Group max limits a bulk selection",
      await scene("limits")
        .getByRole("checkbox")
        .evaluateAll((els) => els.filter((el) => el.checked).length === 2),
    );
    check(
      "Group max disables unchecked choices",
      await scene("limits")
        .getByRole("checkbox", { name: "c", exact: true })
        .isDisabled(),
    );
    await scene("limits")
      .getByRole("button", { name: "保留最少项", exact: true })
      .click();
    check(
      "Group clear preserves minimum selection",
      await scene("limits")
        .getByRole("checkbox")
        .evaluateAll((els) => els.filter((el) => el.checked).length === 1),
    );
    await scene("values")
      .getByRole("checkbox", { name: "字符串零", exact: true })
      .check();
    await scene("values")
      .getByRole("checkbox", { name: "布尔值", exact: true })
      .check();
    check(
      "Group field mapping preserves typed identifiers",
      (await text("values")).includes('[0,"0",false]'),
    );
    await scene("dynamic")
      .getByRole("button", { name: "添加选项", exact: true })
      .click();
    await scene("dynamic")
      .getByRole("checkbox", { name: "新增 1", exact: true })
      .check();
    await scene("dynamic")
      .getByRole("button", { name: "删除末项", exact: true })
      .click();
    check(
      "Dynamic removals preserve host-owned selections",
      (await text("dynamic")).includes("新增 1") &&
        (await scene("dynamic").getByRole("checkbox").count()) === 2,
    );
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Checkbox group array validation is shown",
      (await scene("form").textContent()).includes("请至少选择一项"),
    );
    await scene("form")
      .getByRole("checkbox", { name: "设计", exact: true })
      .check();
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Checkbox groups integrate with valid forms",
      (await text("form")).includes("提交成功"),
    );
    await scene("grid").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "output/playwright/choice-grid-wide.png" });
    await route("HysRadio", "hys-radio");
    await scene("basic")
      .getByRole("radio", { name: "研发", exact: true })
      .check();
    check(
      "Standalone radio peers remain mutually exclusive",
      (await scene("basic")
        .getByRole("radio")
        .evaluateAll((els) => els.filter((el) => el.checked).length === 1)) &&
        (await text("basic")).includes("dev"),
    );
    await scene("values")
      .getByRole("radio", { name: "布尔假", exact: true })
      .check();
    check(
      "Radio supports false as a selected value",
      (await text("values")).includes("false") &&
        (await text("values")).includes("boolean"),
    );
    await scene("methods")
      .getByRole("button", { name: "选中此项", exact: true })
      .click();
    check(
      "Radio public select works",
      (await text("methods")).includes("choice"),
    );
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Radio required validation is shown",
      (await scene("form").textContent()).includes("请选择一项"),
    );
    await scene("form").getByRole("radio").check();
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Radio participates in valid forms",
      (await text("form")).includes("提交成功"),
    );
    await route("HysRadioGroup", "hys-radio-group");
    await scene("keyboard")
      .getByRole("button", { name: "聚焦当前选项", exact: true })
      .click();
    let radios = scene("keyboard").getByRole("radio");
    check(
      "Radio group has a single Tab stop",
      await radios.evaluateAll(
        (els) => els.filter((el) => el.tabIndex === 0).length === 1,
      ),
    );
    await radios.first().press("ArrowRight");
    check(
      "Radio arrow navigation skips disabled items",
      (await text("keyboard")).trim() === "c",
    );
    await radios.last().press("ArrowRight");
    check(
      "Radio arrow navigation loops to the beginning",
      (await text("keyboard")).trim() === "a",
    );
    await radios.first().press("End");
    check(
      "Radio End key reaches the final option",
      (await text("keyboard")).trim() === "c",
    );
    await radios.last().press("Home");
    check(
      "Radio Home key returns to the first option",
      (await text("keyboard")).trim() === "a",
    );
    const rtl = scene("rtl").getByRole("radio");
    await rtl.first().focus();
    await rtl.first().press("ArrowLeft");
    check(
      "RTL arrow navigation follows the visual direction",
      (await text("rtl")).trim() === "b",
    );
    await rtl.nth(1).press("ArrowRight");
    check(
      "RTL reverse arrow returns to the first option",
      (await text("rtl")).trim() === "a",
    );
    check(
      "Solid radio buttons use selected theme surfaces",
      await scene("buttons")
        .locator(".hys-ui-radio-solid.hys-ui-radio-selected")
        .evaluate(
          (el) => getComputedStyle(el).backgroundColor !== "rgb(255, 255, 255)",
        ),
    );
    check(
      "Block radios divide their available width",
      await scene("buttons")
        .locator(".hys-ui-radio-block .hys-ui-radio-option")
        .evaluateAll(
          (els) =>
            Math.max(...els.map((el) => el.getBoundingClientRect().width)) -
              Math.min(...els.map((el) => el.getBoundingClientRect().width)) <
            2,
        ),
    );
    check(
      "Radio button errors remain below all choices",
      await scene("states")
        .getByRole("radiogroup", { name: "按钮组错误", exact: true })
        .evaluate(
          (el) =>
            el
              .querySelector(".hys-ui-radio-group-error")
              .getBoundingClientRect().top >=
            Math.max(
              ...Array.from(el.querySelectorAll(".hys-ui-radio-option")).map(
                (item) => item.getBoundingClientRect().bottom,
              ),
            ),
        ),
    );
    await scene("buttons").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "output/playwright/choice-radio-buttons-wide.png",
    });
    await route("HysSwitch", "hys-switch");
    const basic = scene("basic").getByRole("switch", {
      name: "自动保存",
      exact: true,
    });
    await basic.click();
    check(
      "Switch toggles through native button interaction",
      (await basic.getAttribute("aria-checked")) === "true",
    );
    check(
      "Uncontrolled switch defaults render on",
      (await scene("basic")
        .getByRole("switch")
        .nth(1)
        .getAttribute("aria-checked")) === "true",
    );
    await scene("values").getByRole("switch").first().click();
    await scene("values").getByRole("switch").nth(1).click();
    check(
      "Switch mappings preserve numbers and strings",
      (await text("values")).includes("1") &&
        (await text("values")).includes("on"),
    );
    const content = scene("content").getByRole("switch"),
      before = await content
        .nth(1)
        .evaluate((el) => el.getBoundingClientRect().width);
    await content.first().click();
    const after = await content
      .nth(1)
      .evaluate((el) => el.getBoundingClientRect().width);
    check(
      "Inline prompts keep a stable width between states",
      Math.abs(before - after) < 1,
    );
    check(
      "Switch supports custom rail and thumb icons",
      (await scene("icons").locator(".hys-ui-switch-thumb svg").count()) ===
        2 &&
        (await scene("icons").locator(".hys-ui-switch-prompt svg").count()) ===
          1,
    );
    await scene("controlled").getByRole("switch").click();
    check(
      "Controlled switch veto preserves the actual state",
      (await scene("controlled")
        .getByRole("switch")
        .getAttribute("aria-checked")) === "false" &&
        (await text("controlled")).includes("true"),
    );
    await scene("controlled")
      .getByRole("checkbox", { name: "允许更新状态", exact: true })
      .check();
    await scene("controlled").getByRole("switch").click();
    check(
      "Controlled switch accepts permitted updates",
      (await scene("controlled")
        .getByRole("switch")
        .getAttribute("aria-checked")) === "true",
    );
    const asyncSwitch = scene("async").getByRole("switch");
    const saving = await asyncSwitch.evaluate(async (el) => {
      el.click();
      await Promise.resolve();
      return { busy: el.getAttribute("aria-busy"), disabled: el.disabled };
    });
    check(
      "Async switch is busy while saving",
      saving.busy === "true" && saving.disabled,
    );
    await asyncSwitch.and(page.locator("[aria-checked=true]")).waitFor();
    check(
      "Async approval commits the requested value",
      (await asyncSwitch.getAttribute("aria-checked")) === "true",
    );
    await scene("async")
      .getByRole("checkbox", { name: "模拟保存失败", exact: true })
      .check();
    await asyncSwitch.click();
    await scene("async")
      .locator("output")
      .filter({ hasText: "网络暂不可用" })
      .waitFor();
    check(
      "Async failure leaves the original switch value intact",
      (await asyncSwitch.getAttribute("aria-checked")) === "true",
    );
    await scene("async")
      .getByRole("checkbox", { name: "模拟保存失败", exact: true })
      .uncheck();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await asyncSwitch.click();
    await page
      .locator('.docs-sidebar a[href="/components/hys-radio-group"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysRadioGroup" }).waitFor();
    await page
      .locator('.docs-sidebar a[href="/components/hys-switch"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysSwitch" }).waitFor();
    await scene("async").getByRole("switch").waitFor();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    check(
      "Cached-page leave cancels pending switch updates",
      (await text("async")).includes("取消") &&
        (await scene("async")
          .getByRole("switch")
          .getAttribute("aria-checked")) === "true",
    );
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Switch form validation is shown",
      (await scene("form").textContent()).includes("请确认此项"),
    );
    await scene("form").getByRole("switch").click();
    await scene("form")
      .getByRole("button", { name: "提交", exact: true })
      .click();
    check(
      "Switch form submits accepted values",
      (await text("form")).includes("提交成功"),
    );
    await scene("form")
      .getByRole("button", { name: "重置表单", exact: true })
      .click();
    check(
      "Form reset restores the switch model",
      (await scene("form").getByRole("switch").getAttribute("aria-checked")) ===
        "false",
    );
    await scene("content").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "output/playwright/choice-switch-wide.png" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const colors = [];
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
      check(
        "Choice controls inherit " + theme + " theme",
        (await scene("basic")
          .locator(".hys-ui-switch-wrap")
          .first()
          .getAttribute("data-hys-theme")) === theme,
      );
      colors.push(
        await basic.evaluate((el) => getComputedStyle(el).backgroundColor),
      );
    }
    check(
      "Switch rails use the current theme colors",
      new Set(colors).size === 6,
    );
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: "科技蓝", exact: true }).click();
    await scene("async").locator("summary").click();
    await scene("async").locator(".source-code code").waitFor();
    check(
      "Async examples expose executable component source",
      (
        await scene("async").locator(".source-code code").textContent()
      ).includes("beforeChange"),
    );
    await page
      .locator("#api")
      .getByRole("tab", { name: "实例方法", exact: true })
      .click();
    check(
      "Switch public methods are source documented",
      (
        await page.locator("#api tbody td:first-child code").allTextContents()
      ).includes("toggle"),
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const overflowing = {};
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [name, slug] of [
      ["HysSwitch", "hys-switch"],
      ["HysCheckbox", "hys-checkbox"],
      ["HysCheckboxGroup", "hys-checkbox-group"],
      ["HysRadio", "hys-radio"],
      ["HysRadioGroup", "hys-radio-group"],
    ]) {
      await route(name, slug);
      overflowing[name] = await page
        .locator(".example-stage")
        .evaluateAll((els) =>
          els
            .filter((el) => el.scrollWidth > el.clientWidth + 2)
            .map((el) => el.closest("section").id),
        );
      check(
        name + " scenarios fit mobile width",
        overflowing[name].length === 0,
      );
      if (name === "HysSwitch" || name === "HysCheckboxGroup") {
        await scene(
          name === "HysSwitch" ? "configure" : "grid",
        ).scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "output/playwright/choice-" + slug + "-mobile.png",
        });
      }
    }
    check(
      "No choice runtime errors or Vue warnings",
      errors.length === 0 && warnings.length === 0,
    );
    await page.setViewportSize({ width: 1680, height: 1000 });
    return { checks, errors, warnings, overflowing };
  } catch (error) {
    throw Error(
      "After " +
        checks.at(-1)?.name +
        ": " +
        error.message +
        "; errors=" +
        JSON.stringify(errors) +
        "; warnings=" +
        JSON.stringify(warnings),
    );
  }
}
