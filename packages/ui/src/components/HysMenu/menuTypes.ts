import type { Component } from "vue";
import type { HysMenuKey } from "../../composables/menu";

export interface MenuItemBase {
  icon?: Component;
  disabled?: boolean;
  hidden?: boolean;
  danger?: boolean;
}

export type NavigationMenuItem =
  | (MenuItemBase & {
      key: HysMenuKey;
      label: string;
      type?: "item";
      children?: readonly NavigationMenuItem[];
      href?: string;
      target?: string;
      rel?: string;
      keywords?: readonly string[];
      badge?: string | number;
      shortcut?: string;
    })
  | {
      type: "group";
      label: string;
      children?: readonly NavigationMenuItem[];
      hidden?: boolean;
      disabled?: boolean;
    }
  | { type: "divider"; hidden?: boolean };

export interface NavigationMenuSelection {
  item: NavigationMenuItem;
  path: readonly NavigationMenuItem[];
  event: MouseEvent | KeyboardEvent;
}

export type NavigationMenuMode = "vertical" | "actions";

export interface NavigationMenuProps {
  /** 菜单项、组标题和分隔线。操作项与子菜单的 key 在菜单内唯一。 */
  items: readonly NavigationMenuItem[];
  /** 受控选中键，配合 v-model:selectedKeys。 */
  selectedKeys?: readonly HysMenuKey[];
  /** 非受控的初始选中键。 */
  defaultSelectedKeys?: readonly HysMenuKey[];
  /** 受控展开键，配合 v-model:openKeys。 */
  openKeys?: readonly HysMenuKey[];
  /** 非受控的初始展开键。 */
  defaultOpenKeys?: readonly HysMenuKey[];
  /** vertical 提供导航语义，actions 提供菜单与菜单项语义。默认 vertical。 */
  mode?: NavigationMenuMode;
  /** 禁止菜单项和分支操作，默认 false。 */
  disabled?: boolean;
  /** 菜单的可访问名称。 */
  ariaLabel?: string;
  /** 可滚动菜单的最大高度，支持像素数值和 CSS 长度。 */
  maxHeight?: number | string;
  /** 搜索标签及 keywords，保留祖先路径。清空恢复原展开状态。 */
  search?: string;
  /** 在同级只保留一个展开分支，默认 false。 */
  accordion?: boolean;
  /** 操作模式下启用单选或多选状态，保留普通导航的激活事件。 */
  selectionMode?: "single" | "multiple";
  /** 空菜单或无匹配项的提示。 */
  emptyText?: string;
}
