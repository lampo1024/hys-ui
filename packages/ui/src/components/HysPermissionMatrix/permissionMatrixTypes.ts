export interface HysPermissionCell {
  resource: string;
  role: string;
  key: string;
  checked: boolean;
}

export interface HysPermissionMatrixProps {
  roles: string[];
  resources: string[];
  modelValue: Record<string, boolean>;
  disabled?: boolean;
  readonly?: boolean;
  showSelectAll?: boolean;
  cellDisabled?: (cell: HysPermissionCell) => boolean;
  caption?: string;
  emptyText?: string;
  filter?: string;
}
