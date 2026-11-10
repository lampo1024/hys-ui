<script setup lang="ts">
import { useRouter, type RouteLocationRaw } from "vue-router";
import { HysBreadcrumb, type HysBreadcrumbItem } from "hys-ui";
const router = useRouter(),
  items: HysBreadcrumbItem[] = [
    { label: "文档首页", to: "/" },
    {
      label: "组件导航",
      to: "/components/hys-breadcrumb",
      children: [
        { label: "按钮", to: "/components/hys-button" },
        { label: "面包屑", to: "/components/hys-breadcrumb" },
      ],
    },
    { label: "路由适配" },
  ];
function href(item: HysBreadcrumbItem) {
  return router.resolve(item.to as RouteLocationRaw).href;
}
</script>
<template>
  <div class="demo-stack">
    <HysBreadcrumb :items="items"
      ><template #link="{ item, attrs }"
        ><a
          v-bind="attrs"
          :href="href(item)"
          @click.prevent="
            router[item.replace ? 'replace' : 'push'](
              item.to as RouteLocationRaw,
            )
          "
          >{{ item.label }}</a
        ></template
      ></HysBreadcrumb
    >
    <p class="scenario-note">
      组件库不依赖路由。to 保留宿主的路由对象，link 插槽负责生成 href
      和导航；replace 可由适配器传给宿主路由方法，同级菜单复用同一适配器。
    </p>
  </div>
</template>
