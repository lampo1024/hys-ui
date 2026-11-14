<script setup lang="ts">
import {
  HysSpreadsheet,
  type HysSpreadsheetCollaboration,
  type HysSpreadsheetPresence,
  type HysSpreadsheetWorkbook,
} from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const workbook: HysSpreadsheetWorkbook = {
  sheets: [
    {
      id: "review",
      name: "预算复核",
      rows: [
        ["项目", "预算"],
        ["展台", 2500],
        ["物料", 800],
        ["合计", "=SUM(B2:B3)"],
      ],
    },
  ],
};
type Handlers = Parameters<HysSpreadsheetCollaboration["connect"]>[0];
const listeners = new Map<string, Handlers>();
const users = new Map<string, HysSpreadsheetPresence>();
let revision: string | undefined;
let current = workbook;

function broadcastPresence() {
  for (const [id, handlers] of listeners)
    handlers.presence([...users.values()].filter((user) => user.id !== id));
}

function participant(
  id: string,
  name: string,
  color: string,
): HysSpreadsheetCollaboration {
  return {
    connect(handlers) {
      listeners.set(id, handlers);
      if (revision) handlers.update(current, revision);
      return () => {
        listeners.delete(id);
        users.delete(id);
        broadcastPresence();
      };
    },
    update(next, baseRevision) {
      if (baseRevision !== revision) {
        const handlers = listeners.get(id);
        handlers?.conflict("工作簿已被另一位参与者修改。");
        if (revision) handlers?.update(current, revision);
        return;
      }
      revision = String(Number(revision ?? 0) + 1);
      current = next;
      for (const handlers of listeners.values())
        handlers.update(next, revision, name);
    },
    presence(selection, editing) {
      users.set(id, { id, name, color, selection, editing });
      broadcastPresence();
    },
  };
}

const left = participant("draft", "制表人", "#3769d4");
const right = participant("review", "复核人", "#a35626");
</script>

<template>
  <div class="demo-stack">
    <section class="peers" aria-label="协作双方">
      <div>
        <h3>制表人</h3>
        <HysSpreadsheet
          :default-workbook="workbook"
          :collaboration="left"
          author="制表人"
        />
      </div>
      <div>
        <h3>复核人</h3>
        <HysSpreadsheet
          :default-workbook="workbook"
          :collaboration="right"
          author="复核人"
        />
      </div>
    </section>
    <p class="scenario-note">
      在任意一侧改动
      B2，另一侧同步显示预算和合计。选中单元格或添加批注后，可从另一侧查看。
    </p>
  </div>
</template>

<style scoped>
.peers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 12px;
}
.peers > div {
  min-width: 0;
}
h3 {
  margin: 0 0 8px;
  font-size: 14px;
}
</style>
