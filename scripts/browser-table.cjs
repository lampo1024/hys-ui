async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    warnings = [];
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "warning" && e.text().includes("[Vue warn]"))
      warnings.push(e.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-table");
  const scene = (n) => page.locator("#scene-" + n),
    table = (n) => scene(n).locator(".hys-ui-table").first(),
    data = (n) => table(n).locator("tbody tr[data-row-key]");
  await table("basic").waitFor();
  check(
    "Basic usage keeps the original row and column API",
    (await data("basic").count()) === 6 &&
      (await table("basic").locator("caption").textContent()) === "团队成员",
  );
  check(
    "Pagination stays opt-in",
    (await table("basic").locator(".hys-ui-table-pagination").count()) === 0,
  );
  check(
    "Example contents have meaningful scenario names",
    (await page
      .locator(".doc-toc a")
      .filter({ hasText: "进阶用法" })
      .count()) === 0,
  );
  await scene("sort")
    .getByRole("button", { name: "清空排序", exact: true })
    .click();
  await table("sort")
    .getByRole("button", { name: "年龄降序", exact: true })
    .click();
  check(
    "Direction controls apply numeric descending sorting",
    (await data("sort").first().getAttribute("data-row-key")) === "8",
  );
  await table("sort")
    .getByRole("button", { name: "姓名升序", exact: true })
    .click();
  check(
    "Controlled multiple sort exposes both conditions",
    (await scene("sort").locator("output").textContent()).includes("age") &&
      (await scene("sort").locator("output").textContent()).includes("name"),
  );
  await table("filters")
    .getByRole("button", { name: "筛选团队", exact: true })
    .click();
  const filter = page.locator(".hys-ui-table-filter-panel");
  await filter.getByRole("checkbox", { name: "设计", exact: true }).check();
  await filter.getByRole("button", { name: "应用", exact: true }).click();
  check(
    "Option filtering combines with pagination",
    (
      await table("filters")
        .locator(".hys-ui-pf-pagination-total")
        .textContent()
    ).includes("6") && (await data("filters").count()) === 5,
  );
  await scene("filters")
    .getByRole("button", { name: "清空全部条件", exact: true })
    .click();
  await table("filters")
    .getByRole("button", { name: "筛选姓名", exact: true })
    .click();
  await filter.getByRole("textbox").fill("林");
  await filter.getByRole("textbox").press("Enter");
  check(
    "Text filtering applies from the keyboard",
    (await data("filters").count()) === 3,
  );
  await scene("filters")
    .getByRole("button", { name: "清空全部条件", exact: true })
    .click();
  await table("customfilter")
    .getByRole("button", { name: "筛选姓名", exact: true })
    .click();
  check(
    "Custom filter panel is rendered",
    (await filter.locator(".table-custom-filter").count()) === 1,
  );
  await filter.getByRole("textbox").fill("周");
  await filter.getByRole("button", { name: "应用", exact: true }).click();
  check(
    "Custom filters use the same data pipeline",
    (await data("customfilter").count()) === 1,
  );
  await scene("selection")
    .getByRole("button", { name: "选择可用行", exact: true })
    .click();
  check(
    "Select-all skips disabled rows",
    (await table("selection")
      .getByRole("checkbox", { name: "选择第3行", exact: true })
      .isDisabled()) &&
      (await scene("selection").locator("output").textContent()).includes(
        "1、2、4、5、6",
      ),
  );
  await scene("selection")
    .getByRole("button", { name: "清空选择", exact: true })
    .click();
  await table("selection")
    .getByRole("checkbox", { name: "选择第1行", exact: true })
    .check();
  check(
    "Individual selection is controlled by row identity",
    (await scene("selection").locator("output").textContent()).includes(
      "选中编号：1",
    ),
  );
  await table("current")
    .getByRole("radio", { name: "选择第2行", exact: true })
    .check();
  await data("current").nth(2).locator('[data-column-key="name"]').click();
  check(
    "Single selection and current row remain independent",
    (await scene("current").locator("output").textContent()).includes(
      "单选：2 · 当前行：3",
    ),
  );
  await scene("current")
    .getByRole("button", { name: "取消当前行高亮", exact: true })
    .click();
  check(
    "Current row can be cleared without changing radio selection",
    (await table("current").locator(".hys-ui-table-row-current").count()) === 0,
  );
  await table("reserve")
    .getByRole("checkbox", { name: "选择第1行", exact: true })
    .check();
  await table("reserve")
    .getByRole("button", { name: "下一页", exact: true })
    .click();
  await table("reserve")
    .getByRole("checkbox", { name: "选择第1行", exact: true })
    .check();
  check(
    "Pagination preserves selection across root pages",
    (await scene("reserve").locator("output").textContent()).includes("1、6"),
  );
  const detail = table("expand").locator(".hys-ui-table-detail");
  await detail
    .getByRole("textbox", { name: "展开行说明", exact: true })
    .fill("保留的草稿");
  await table("expand")
    .getByRole("button", { name: "收起第1行", exact: true })
    .click();
  await table("expand")
    .getByRole("button", { name: "展开第1行", exact: true })
    .click();
  check(
    "Preserved details retain inner control state",
    (await detail.getByRole("textbox").inputValue()) === "保留的草稿",
  );
  check(
    "Row expansion eligibility is enforced",
    (await table("expand")
      .getByRole("button", { name: "展开第4行", exact: true })
      .count()) === 0,
  );
  await table("tree")
    .getByRole("checkbox", { name: "选择第1行", exact: true })
    .check();
  check(
    "Tree selection cascades to loaded descendants",
    (await scene("tree").locator("output").textContent()).includes("product") &&
      (await scene("tree").locator("output").textContent()).includes(
        "research",
      ),
  );
  await table("tree")
    .getByRole("button", { name: "筛选工作项", exact: true })
    .click();
  await filter.getByRole("textbox").fill("组件开发");
  await filter.getByRole("button", { name: "应用", exact: true }).click();
  check(
    "Tree filtering retains the complete ancestor path",
    (await data("tree").count()) === 3 &&
      (await data("tree").allTextContents()).join().includes("工程研发"),
  );
  await table("lazy")
    .getByRole("button", { name: "展开设计任务", exact: true })
    .click();
  await table("lazy")
    .getByRole("button", { name: "重新加载子行", exact: true })
    .waitFor();
  check("Lazy failure exposes a retry action", true);
  await scene("lazy")
    .getByRole("checkbox", { name: "模拟设计任务加载失败", exact: true })
    .uncheck();
  await table("lazy")
    .getByRole("button", { name: "重新加载子行", exact: true })
    .click();
  await table("lazy").locator('[data-row-key="design-1"]').waitFor();
  check(
    "Retry loads child rows without replacing the parent",
    (await data("lazy").count()) === 4,
  );
  check(
    "Summaries use all filtered data rather than only the page",
    (await table("summary")
      .locator('tfoot [data-column-key="budget"]')
      .textContent()) === "75150",
  );
  await scene("summary")
    .getByRole("checkbox", { name: "自定义汇总文本", exact: true })
    .check();
  check(
    "Custom summaries render their returned content",
    (await table("summary").locator("tfoot").textContent()).includes(
      "75,150 元",
    ),
  );
  check(
    "Vertical span cells cover their following row",
    (await table("span")
      .locator("tbody tr")
      .first()
      .locator("td")
      .first()
      .getAttribute("rowspan")) === "2" &&
      (await table("span").locator("tbody tr").nth(1).locator("td").count()) ===
        2,
  );
  check(
    "Column and common slots render Hys components",
    (await table("templates").locator(".hys-ui-ex-avatar").count()) === 5,
  );
  await table("templates")
    .getByRole("button", { name: "查看", exact: true })
    .first()
    .click();
  check(
    "Operation slots invoke host actions",
    (await scene("templates").locator("output").textContent()).includes(
      "查看 陈晓",
    ),
  );
  const overflow = table("overflow")
    .locator("tbody tr")
    .first()
    .locator('[data-column-key="note"] .hys-ui-table-cell-text');
  await overflow.hover();
  const tip = page.getByRole("tooltip");
  await tip.waitFor();
  check(
    "Only clipped content creates a shared tooltip",
    (await tip.textContent()).includes("陈晓：负责产品设计"),
  );
  await page.keyboard.press("Escape");
  check("Escape closes a shared cell tooltip", (await tip.count()) === 0);
  const resize = table("resize"),
    first = resize.locator('thead th[data-column-key="name"]'),
    separator = resize.getByRole("separator", {
      name: "调整姓名列宽",
      exact: true,
    });
  await separator.scrollIntoViewIfNeeded();
  const initial = (await first.boundingBox()).width,
    handle = await separator.boundingBox();
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handle.x + handle.width / 2 + 65,
    handle.y + handle.height / 2,
    { steps: 5 },
  );
  await page.mouse.up();
  await settle();
  check(
    "Pointer column resize changes width without a proportion jump",
    Math.abs((await first.boundingBox()).width - initial - 65) < 3,
  );
  const resized = (await first.boundingBox()).width;
  await separator.focus();
  await page.keyboard.press("ArrowRight");
  await settle();
  check(
    "Keyboard separators adjust ten pixels",
    Math.abs((await first.boundingBox()).width - resized - 10) < 3,
  );
  await scene("resize")
    .getByRole("button", { name: "还原列宽", exact: true })
    .click();
  await settle();
  check(
    "Reset restores fitted column geometry",
    Math.abs((await first.boundingBox()).width - initial) < 3,
  );
  await table("editing")
    .getByRole("button", { name: "编辑", exact: true })
    .first()
    .click();
  await table("editing")
    .getByRole("textbox", { name: "编辑姓名", exact: true })
    .fill("新的姓名");
  await table("editing")
    .getByRole("button", { name: "保存", exact: true })
    .click();
  check(
    "Host-owned row editing works through standard slots",
    (await data("editing").first().textContent()).includes("新的姓名"),
  );
  await data("server").first().waitFor();
  await table("server")
    .getByRole("button", { name: "金额降序", exact: true })
    .click();
  await page.waitForTimeout(500);
  check(
    "Server sorting uses asynchronous host results",
    (await data("server").first().getAttribute("data-row-key")) === "72",
  );
  await scene("server")
    .getByRole("checkbox", { name: "模拟失败", exact: true })
    .check();
  await scene("server")
    .getByRole("button", { name: "重新加载", exact: true })
    .click();
  await scene("server").getByRole("alert").waitFor();
  check("Server failure is visible without a stale response", true);
  await scene("server")
    .getByRole("checkbox", { name: "模拟失败", exact: true })
    .uncheck();
  await scene("server")
    .getByRole("button", { name: "重新加载", exact: true })
    .click();
  await data("server").first().waitFor();
  const fixed = table("fixed"),
    view = fixed.locator(".hys-ui-table-scroll");
  await view.scrollIntoViewIfNeeded();
  const geometry = () =>
    fixed.evaluate((root) => {
      const port = root.querySelector(".hys-ui-table-scroll"),
        v = port.getBoundingClientRect(),
        head = [...root.querySelectorAll("th[data-leaf]")];
      return {
        aligned: head.every((th) => {
          const key = th.dataset.columnKey,
            td = root.querySelector(
              'tbody tr[data-row-key] td[data-column-key="' + key + '"]',
            );
          return (
            Math.abs(
              td.getBoundingClientRect().left - th.getBoundingClientRect().left,
            ) < 1.5 &&
            Math.abs(
              td.getBoundingClientRect().width -
                th.getBoundingClientRect().width,
            ) < 1.5
          );
        }),
        pinned: ["id", "budget"].every((key) => {
          const th = root.querySelector('th[data-column-key="' + key + '"]'),
            r = th.getBoundingClientRect();
          return (
            document
              .elementFromPoint(
                r.left + Math.min(35, r.width / 2),
                r.top + r.height / 2,
              )
              ?.closest("th")?.dataset.columnKey === key
          );
        }),
        top: head[0].getBoundingClientRect().top,
        portTop: v.top,
        scrollTop: port.scrollTop,
      };
    });
  for (const amount of [0, 0.5, 1]) {
    await view.evaluate(
      (e, v) => (e.scrollLeft = (e.scrollWidth - e.clientWidth) * v),
      amount,
    );
    await settle();
    const g = await geometry();
    check(
      "Fixed columns align and stay visible at horizontal position " + amount,
      g.aligned && g.pinned,
    );
  }
  await view.evaluate((e) => (e.scrollTop = 200));
  await settle();
  let g = await geometry();
  check(
    "Two-axis scrolling preserves the fixed header",
    g.aligned && Math.abs(g.top - g.portTop) < 2,
  );
  check(
    "Grouped headers span their expected leaf columns",
    (await table("grouped").locator("thead tr").count()) === 3 &&
      (await table("grouped")
        .locator('thead th[data-column-key="profile"]')
        .getAttribute("colspan")) === "3",
  );
  await fixed.screenshot({ path: "output/playwright/table-fixed.png" });
  await table("grouped").screenshot({
    path: "output/playwright/table-grouped.png",
  });
  await table("filters")
    .getByRole("button", { name: "筛选姓名", exact: true })
    .click();
  await page.locator('a[href="/components/hys-select"]').click();
  await page.locator("#scene-basic").waitFor();
  check(
    "Cached-page leave removes filter and tooltip layers",
    (await page
      .locator(".hys-ui-table-filter-panel,.hys-ui-table-tooltip")
      .count()) === 0,
  );
  await page.locator('a[href="/components/hys-table"]').click();
  await table("filters").waitFor();
  check(
    "Returning to the cached page retains row selections",
    (await scene("reserve").locator("output").textContent()).includes("1、6"),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  check(
    "All Table examples stay inside the document viewport",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await table("selection").screenshot({
    path: "output/playwright/table-mobile.png",
  });
  check(
    "No Table runtime errors or Vue warnings",
    !errors.length && !warnings.length,
  );
  return { checks, errors, warnings };
}
