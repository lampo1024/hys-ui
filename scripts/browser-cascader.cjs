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
    await page.goto("http://127.0.0.1:5174/components/hys-cascader");
    const scene = (n) => page.locator("#scene-" + n),
      combo = (n) => scene(n).locator(".hys-ui-cascader-control"),
      panel = () =>
        page.locator(".hys-ui-cascader-menu:not(.hys-ui-cascader-inline)"),
      token = (path) => JSON.stringify(path.map((v) => [typeof v, v]));
    const item = (path) =>
      panel().locator(
        "[data-cascader-key=" + JSON.stringify(token(path)) + "]",
      );
    const out = (n) => scene(n).locator("output"),
      dismiss = async () => {
        await page.keyboard.press("Escape");
        await panel().waitFor({ state: "detached" });
      };
    await combo("basic").waitFor();
    check(
      "Cascader examples are separated into named scenarios",
      (await page.locator(".example-card").count()) === 19,
    );
    await combo("basic").click();
    await item(["rd"]).click();
    await item(["rd", "backend"]).waitFor();
    check(
      "Branch navigation leaves the bound path unchanged",
      (await out("basic").textContent()).includes("未选择"),
    );
    check(
      "Disabled leaves are inaccessible for selection",
      (await item(["rd", "qa"]).getAttribute("aria-disabled")) === "true",
    );
    const triggerBounds = await combo("basic").boundingBox(),
      popupBounds = await panel().boundingBox();
    check(
      "Default popup matches the trigger width",
      Math.abs(triggerBounds.width - popupBounds.width) < 2,
    );
    await panel().screenshot({ path: "output/playwright/cascader-basic.png" });
    await item(["rd", "frontend"]).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Leaf selection emits the complete path",
      (await out("basic").textContent()).includes("rd / frontend"),
    );
    check(
      "Closing after selection restores the trigger focus",
      await combo("basic").evaluate((el) => el === document.activeElement),
    );
    await combo("basic")
      .getByRole("button", { name: "清空选择", exact: true })
      .click();
    check(
      "Clear uses the public empty path",
      (await out("basic").textContent()).includes("未选择"),
    );
    await combo("hover").nth(1).click();
    await item(["rd"]).hover();
    await item(["rd", "backend"]).waitFor();
    check(
      "Hover expands without selecting",
      (await out("hover").textContent()).includes("悬停：[]"),
    );
    await dismiss();
    await combo("multiple").click();
    await item(["rd"]).locator("input[type=checkbox]").check();
    await page.waitForFunction(() =>
      document
        .querySelector("#scene-multiple output")
        ?.textContent.includes("frontend"),
    );
    check(
      "Checking a parent selects usable descendants without disabled leaves",
      !(await out("multiple").textContent()).includes("qa"),
    );
    await item(["rd"]).locator("button").click();
    await item(["rd", "backend"]).locator("input").uncheck();
    check(
      "A partial parent has a semantic mixed state",
      (await item(["rd"]).getAttribute("aria-checked")) === "mixed",
    );
    await dismiss();
    await scene("multiple")
      .getByRole("combobox", { name: "回填方式", exact: true })
      .click();
    await page
      .getByRole("option", { name: "合并完整父级", exact: true })
      .click();
    await combo("multiple").click();
    await item(["rd"]).locator("input").check();
    await dismiss();
    check(
      "Parent projection collapses complete descendant selections",
      (await out("multiple").textContent()).replace(/\s/g, "") === '[["rd"]]',
    );
    await combo("multiple").getByRole("button", { name: /移除/ }).click();
    check(
      "Removing a parent tag removes the linked subtree",
      (await out("multiple").textContent()).trim() === "[]",
    );
    await combo("strict").nth(0).click();
    await item(["product"]).locator("input").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Strict single selection permits a branch",
      (await out("strict").textContent()).includes("product"),
    );
    await combo("strict").nth(1).click();
    await item(["product"]).locator("button").click();
    check(
      "Strict parent selection does not select its children",
      (await item(["product", "design"]).getAttribute("aria-checked")) ===
        "false",
    );
    await item(["product", "design"]).locator("input").check();
    await dismiss();
    await combo("strict").nth(2).click();
    await item(["rd"]).click();
    await page.waitForFunction(() =>
      document
        .querySelector("#scene-strict output")
        ?.textContent.replace(/\s/g, "")
        .includes('即时回填：["rd"]'),
    );
    check(
      "Legacy changeOnSelect commits a browsed branch",
      (await out("strict").textContent())
        .replace(/\s/g, "")
        .includes('即时回填：["rd"]'),
    );
    await dismiss();
    check(
      "Collapsed tags preserve all values",
      (await combo("tags")
        .locator(".hys-ui-cascader-tag:not(.hys-ui-cascader-more)")
        .count()) === 1 &&
        (await combo("tags").locator(".hys-ui-cascader-more").textContent()) ===
          "+3",
    );
    await combo("tags").getByRole("button", { name: /移除/ }).click();
    check(
      "Tag removal updates only the requested path",
      !(await out("tags").textContent()).includes("backend") &&
        (await out("tags").textContent()).includes("frontend"),
    );
    check(
      "Mapped numeric zero is a valid selected value",
      (await combo("mapping").textContent()).includes("总部") &&
        (await out("mapping").textContent()).includes("number"),
    );
    await combo("mapping").click();
    await item([0]).locator("button").click();
    await item([0, 1]).locator("input").click();
    await panel().waitFor({ state: "detached" });
    check(
      "Mapped fields return the numeric leaf value",
      (await out("mapping").textContent()).includes("编号：1"),
    );
    await combo("search").click();
    const search = panel().getByRole("textbox", {
      name: "搜索分类",
      exact: true,
    });
    await search.fill("研发");
    await item(["rd", "frontend"]).waitFor();
    check(
      "Search matches loaded complete label paths",
      (await panel().getByRole("option").count()) === 2,
    );
    await search.press("Home");
    check(
      "Search Home remains text editing",
      await search.evaluate((el) => el === document.activeElement),
    );
    await search.press("ArrowDown");
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await panel().waitFor({ state: "detached" });
    check(
      "Search keyboard commits the highlighted leaf",
      (await out("search").textContent()).includes("frontend"),
    );
    await scene("async")
      .getByRole("checkbox", { name: "下次加载失败", exact: true })
      .check();
    await combo("async").click();
    await item(["cn"]).click();
    await item(["cn"]).getByRole("button", { name: /重试/ }).waitFor();
    check(
      "Failed lazy data keeps the current selection",
      (await out("async").textContent()).startsWith("[]"),
    );
    await item(["cn"]).getByRole("button", { name: /重试/ }).click();
    await item(["cn", "east"]).waitFor();
    await item(["cn", "east"]).click();
    await item(["cn", "east", "sh"]).waitFor();
    await item(["cn", "east", "sh"]).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Retry can load multiple lazy levels",
      (await out("async").textContent()).includes("sh") &&
        (await out("async").textContent()).includes("请求 3 次"),
    );
    await combo("async").click();
    await item(["cn", "east", "sh"]).waitFor();
    check(
      "Reopening reuses accepted lazy children",
      (await out("async").textContent()).includes("请求 3 次"),
    );
    await dismiss();
    check(
      "Root data can display cached labels before opening",
      (await combo("root").textContent()).includes("上海"),
    );
    await combo("root").click();
    await item(["cn", "sh"]).waitFor();
    await dismiss();
    await combo("root").click();
    await item(["cn", "sh"]).waitFor();
    check(
      "Root data loads once and locates the current path",
      (await out("root").textContent()).includes("根数据加载 1 次"),
    );
    await dismiss();
    await combo("custom").click();
    await panel().getByText("选择知识分类", { exact: true }).waitFor();
    check(
      "Custom header and footer share the panel",
      (await panel()
        .getByRole("button", { name: "完成", exact: true })
        .count()) === 1,
    );
    await item(["knowledge"]).click();
    await item(["knowledge", "api"]).waitFor();
    check(
      "Custom options receive original business fields",
      (await item(["knowledge", "api"]).textContent()).includes("16"),
    );
    await panel().getByRole("textbox").fill("接口");
    await panel().getByRole("option").waitFor();
    check(
      "Custom search template receives label paths and original data",
      (await panel().getByRole("option").textContent()).includes("16 份资料"),
    );
    await panel().screenshot({ path: "output/playwright/cascader-custom.png" });
    await panel().getByRole("button", { name: "完成", exact: true }).click();
    await panel().waitFor({ state: "detached" });
    const inline = scene("inline").locator(".hys-ui-cascader-inline");
    check(
      "Inline panels do not create a portal",
      (await inline.count()) === 1 && (await panel().count()) === 0,
    );
    await inline
      .locator(
        "[data-cascader-key=" + JSON.stringify(token(["rd", "frontend"])) + "]",
      )
      .click();
    check(
      "Inline panels reuse parent and leaf checks",
      (await out("inline").textContent()).includes("frontend"),
    );
    await inline.screenshot({ path: "output/playwright/cascader-inline.png" });
    await scene("virtual")
      .getByRole("button", { name: "定位最后一个条目", exact: true })
      .click();
    await item(["group-199", 19999]).waitFor();
    check(
      "Virtual columns bound the rendered DOM",
      (await panel().locator("[data-cascader-key]").count()) < 45,
    );
    check(
      "Public scrollTo reveals and focuses distant leaves",
      await item(["group-199", 19999]).evaluate(
        (el) => el === document.activeElement,
      ),
    );
    await page.keyboard.press("Enter");
    await panel().waitFor({ state: "detached" });
    check(
      "Virtual leaf selection retains the typed full path",
      (await out("virtual").textContent()).includes("19999"),
    );
    await combo("controlled").click();
    await item(["rd"]).click();
    await item(["rd", "backend"]).click();
    check(
      "A controlled host can reject a selection",
      (await out("controlled").textContent())
        .replace(/\s/g, "")
        .includes('已接受：["business"]'),
    );
    await dismiss();
    await scene("controlled")
      .getByRole("checkbox", { name: "接受选择请求", exact: true })
      .check();
    await combo("controlled").click();
    await item(["rd"]).click();
    await item(["rd", "frontend"]).click();
    await panel().waitFor({ state: "detached" });
    check(
      "Accepted controlled requests update the display",
      (await combo("controlled").textContent()).includes("前端研发"),
    );
    await scene("controlled")
      .getByRole("checkbox", { name: "允许打开浮层", exact: true })
      .uncheck();
    await combo("controlled").click();
    check(
      "A controlled host can reject popup opening",
      (await panel().count()) === 0,
    );
    await scene("methods")
      .getByRole("button", { name: "设置前端研发", exact: true })
      .click();
    await scene("methods")
      .getByRole("button", { name: "读取已选路径", exact: true })
      .click();
    check(
      "Public value and item methods retain original paths",
      (await out("methods").textContent()).includes("frontend"),
    );
    await scene("methods")
      .getByRole("button", { name: "定位交互设计", exact: true })
      .click();
    await item(["product", "design"]).waitFor();
    check(
      "Public navigation does not overwrite the selected value",
      (await combo("methods").textContent()).includes("前端研发"),
    );
    await dismiss();
    await scene("form")
      .getByRole("button", { name: "保存配置", exact: true })
      .click();
    await scene("form").getByText("请选择交付分类", { exact: true }).waitFor();
    check(
      "Required validation targets the composite field",
      (await combo("form").getAttribute("aria-invalid")) === "true",
    );
    await scene("form")
      .getByRole("combobox", { name: "表单尺寸", exact: true })
      .click();
    await page.getByRole("option", { name: "小", exact: true }).click();
    await combo("form").click();
    await item(["rd"]).waitFor();
    check(
      "The popup inherits the small form size",
      (await panel().getAttribute("class")).includes("hys-ui-cascader-sm"),
    );
    check(
      "Rows scale with form size",
      Math.abs((await item(["rd"]).boundingBox()).height - 30) < 1,
    );
    await item(["business"]).click();
    await panel().waitFor({ state: "detached" });
    await scene("form")
      .getByRole("button", { name: "保存配置", exact: true })
      .click();
    await scene("form").getByText("分类配置已保存", { exact: true }).waitFor();
    check(
      "A selected path passes the parent form validation",
      (await scene("form")
        .locator("input[type=hidden][name=category]")
        .inputValue()) === '["business"]',
    );
    await scene("form")
      .getByRole("checkbox", { name: "禁用表单", exact: true })
      .check();
    check(
      "Form disabled state reaches the trigger",
      (await combo("form").getAttribute("aria-disabled")) === "true",
    );
    await scene("keyboard")
      .getByRole("button", { name: "展开并聚焦分类", exact: true })
      .click();
    await item(["rd"]).waitFor();
    check(
      "Opening through the instance focuses the first usable row",
      await item(["rd"]).evaluate((el) => el === document.activeElement),
    );
    await page.keyboard.press("ArrowRight");
    await item(["rd", "backend"]).waitFor();
    await page.keyboard.press("End");
    check(
      "Keyboard End skips the disabled last leaf",
      await item(["rd", "frontend"]).evaluate(
        (el) => el === document.activeElement,
      ),
    );
    await page.keyboard.press("ArrowLeft");
    check(
      "Keyboard Left returns to the parent column",
      await item(["rd"]).evaluate((el) => el === document.activeElement),
    );
    await dismiss();
    check(
      "Escape restores the keyboard trigger",
      await combo("keyboard").evaluate((el) => el === document.activeElement),
    );
    await combo("states").nth(3).click();
    await panel().getByText("暂无分类", { exact: true }).waitFor();
    check("Empty data uses the custom empty state", true);
    await dismiss();
    await combo("states")
      .nth(5)
      .getByRole("button", { name: "清空选择", exact: true })
      .click();
    check(
      "Clearing preserves selected disabled nodes",
      (await out("states").textContent()).includes("qa") &&
        !(await out("states").textContent()).includes("business"),
    );
    await combo("basic").click();
    await item(["business"]).click();
    await panel().waitFor({ state: "detached" });
    await combo("basic").click();
    await page.locator('a[href="/components/hys-select"]').click();
    await page.locator("#scene-basic .hys-ui-select").first().waitFor();
    check(
      "Leaving a cached page cleans Cascader portals",
      (await panel().count()) === 0,
    );
    await page.locator('a[href="/components/hys-cascader"]').click();
    await combo("basic").waitFor();
    check(
      "Returning preserves independent example selection",
      (await out("basic").textContent()).includes("business"),
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
      await combo("basic").click();
      check(
        theme + " theme reaches the portal",
        (await panel().getAttribute("data-hys-theme")) === theme,
      );
      await dismiss();
    }
    await page
      .locator("#api")
      .getByText("showCheckedStrategy", { exact: true })
      .waitFor();
    check(
      "The API includes path, lazy and virtual contracts",
      (await page
        .locator("#api")
        .getByText("loadRoot", { exact: true })
        .count()) === 1,
    );
    await page
      .locator("#api")
      .getByRole("tab", { name: "实例方法", exact: true })
      .click();
    await page
      .locator("#api")
      .getByText("setExpandedPath", { exact: true })
      .waitFor();
    check("Instance navigation is documented", true);
    await page.setViewportSize({ width: 390, height: 844 });
    await combo("basic").click();
    await item(["rd"]).click();
    await item(["rd", "backend"]).waitFor();
    const narrow = await panel().boundingBox();
    check(
      "Popup stays within mobile viewport edges",
      narrow.x >= 0 && narrow.x + narrow.width <= 391,
    );
    check(
      "Nested columns scroll inside their constrained panel",
      await panel()
        .locator(".hys-ui-cascader-columns")
        .evaluate((el) => el.scrollWidth > el.clientWidth),
    );
    await panel().screenshot({ path: "output/playwright/cascader-mobile.png" });
    await dismiss();
    check(
      "Examples do not overflow the mobile document",
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
    return { checks, errors, warnings, error: String(error.stack || error) };
  }
}