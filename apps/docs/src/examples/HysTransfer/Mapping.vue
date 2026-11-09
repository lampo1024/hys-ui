<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer } from "hys-ui";
interface Employee {
  employeeNo: number;
  profile: { name: string };
  locked?: boolean;
}
const value = ref<number[]>([0]),
  options: Employee[] = [
    { employeeNo: 0, profile: { name: "林工" } },
    { employeeNo: 101, profile: { name: "周工" } },
    { employeeNo: 102, profile: { name: "陈工" } },
    { employeeNo: 103, profile: { name: "管理员" }, locked: true },
  ];
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      v-model="value"
      :options="options"
      :row-key="(employee) => employee.employeeNo"
      :field-names="{ label: 'profile.name', disabled: 'locked' }"
      :titles="['待选员工', '已选员工']"
    />
  </div>
  <output>员工编号：{{ value.join("、") }}</output>
  <p class="hint">
    rowKey 可从业务对象生成编号；也可以用 fieldNames.value 映射字段。支持数值
    0，字符串编号和数值编号分别处理。选项插槽接收原始业务对象。
  </p>
</template>
