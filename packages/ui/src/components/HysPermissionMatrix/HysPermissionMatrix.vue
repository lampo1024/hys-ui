<script setup lang="ts">
import { computed } from "vue";
import { useHysControlState } from "../../composables/formContext";
import { useHysRootAttrs } from "../../config";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import type {
  HysPermissionCell,
  HysPermissionMatrixProps,
} from "./permissionMatrixTypes";

const props = withDefaults(defineProps<HysPermissionMatrixProps>(), {
  showSelectAll: true,
  emptyText: "暂无可配置权限",
});
const emit = defineEmits<{
  "update:modelValue": [value: Record<string, boolean>];
  change: [value: Record<string, boolean>];
  cellsChange: [cells: HysPermissionCell[]];
}>();
defineSlots<{
  role?: (scope: { role: string }) => unknown;
  resource?: (scope: { resource: string }) => unknown;
  empty?: () => unknown;
}>();
const { disabled: controlDisabled } = useHysControlState(props);
const hysRootAttrs = useHysRootAttrs();
const visibleResources = computed(() => {
  const term = props.filter?.trim().toLowerCase();
  return term ? props.resources.filter((resource) => resource.toLowerCase().includes(term)) : props.resources;
});

const rows = computed(() =>
  visibleResources.value.map((resource) => {
    const cells = props.roles.map((role) => {
      const key = resource + ":" + role;
      const cell: HysPermissionCell = {
        resource,
        role,
        key,
        checked: !!props.modelValue[key],
      };
      return { ...cell, locked: !!props.cellDisabled?.(cell) };
    });
    return { resource, cells, group: groupState(cells) };
  }),
);
const columns = computed(() =>
  props.roles.map((role, index) => ({
    role,
    group: groupState(rows.value.map(({ cells }) => cells[index])),
  })),
);
const whole = computed(() =>
  groupState(rows.value.flatMap(({ cells }) => cells)),
);

function groupState(cells: (HysPermissionCell & { locked: boolean })[]) {
  const editable = cells.filter((cell) => !cell.locked);
  const state = editable.length ? editable : cells;
  const checked = state.length > 0 && state.every((cell) => cell.checked);
  return {
    editable,
    checked,
    mixed: !checked && state.some((cell) => cell.checked),
  };
}

function toggle(cells: readonly HysPermissionCell[], checked: boolean) {
  if (controlDisabled.value || props.readonly) return;
  const changes = cells
    .filter((cell) => cell.checked !== checked)
    .map((cell) => ({
      resource: cell.resource,
      role: cell.role,
      key: cell.key,
      checked,
    }));
  if (!changes.length) return;
  const next = { ...props.modelValue };
  for (const cell of changes) next[cell.key] = checked;
  emit("update:modelValue", next);
  emit("change", next);
  emit("cellsChange", changes);
}
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-table-scroll hys-ui-scrollbar">
    <table class="hys-ui-ent-matrix">
      <caption v-if="caption">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">
            <HysCheckbox
              v-if="showSelectAll"
              class="hys-ui-matrix-group"
              :model-value="whole.checked"
              :indeterminate="whole.mixed"
              :disabled="controlDisabled || !whole.editable.length"
              :readonly="readonly"
              aria-label="全选所有权限"
              label="资源 / 角色"
              @change="toggle(whole.editable, $event)"
            />
            <template v-else>资源 / 角色</template>
          </th>
          <th v-for="{ role, group } in columns" :key="role" scope="col">
            <HysCheckbox
              v-if="showSelectAll"
              class="hys-ui-matrix-group"
              :model-value="group.checked"
              :indeterminate="group.mixed"
              :disabled="controlDisabled || !group.editable.length"
              :readonly="readonly"
              :aria-label="'全选角色 ' + role"
              @change="toggle(group.editable, $event)"
              ><slot name="role" :role="role">{{ role }}</slot></HysCheckbox
            >
            <slot v-else name="role" :role="role">{{ role }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length || !columns.length">
          <td class="hys-ui-matrix-empty" :colspan="columns.length + 1">
            <slot name="empty">{{ emptyText }}</slot>
          </td>
        </tr>
        <template v-else>
          <tr v-for="{ resource, cells, group } in rows" :key="resource">
            <th scope="row">
              <HysCheckbox
                v-if="showSelectAll"
                class="hys-ui-matrix-group"
                :model-value="group.checked"
                :indeterminate="group.mixed"
                :disabled="controlDisabled || !group.editable.length"
                :readonly="readonly"
                :aria-label="'全选资源 ' + resource"
                @change="toggle(group.editable, $event)"
                ><slot name="resource" :resource="resource">{{
                  resource
                }}</slot></HysCheckbox
              >
              <slot v-else name="resource" :resource="resource">{{
                resource
              }}</slot>
            </th>
            <td v-for="cell in cells" :key="cell.role">
              <HysCheckbox
                :aria-label="cell.resource + ' - ' + cell.role"
                :model-value="cell.checked"
                :disabled="controlDisabled || cell.locked"
                :readonly="readonly"
                @change="toggle([cell], $event)"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.hys-ui-matrix-group :deep(.hys-ui-checkbox-label) {
  font-weight: 600;
}
.hys-ui-ent-matrix th {
  white-space: nowrap;
}
@media (max-width: 480px) {
  .hys-ui-ent-matrix th,
  .hys-ui-ent-matrix td {
    padding-inline: 5px;
  }
  .hys-ui-matrix-group {
    gap: 4px;
    font-size: 12px;
  }
}
caption {
  padding: 10px 14px;
  font-weight: 600;
  text-align: start;
}
.hys-ui-ent-matrix td.hys-ui-matrix-empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--hys-ui-theme-muted);
}
</style>
