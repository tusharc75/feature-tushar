import { GridViewSavedData } from 'src/components/CustomReactTable/ArrangeView/ArrangeViewMenu';
import { Table } from '@tanstack/react-table';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { FormikErrors, FormikTouched } from 'formik';
import useArrangeView from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog1/useArrangeView';

export type ArrangeViewDialogProps = {
  onClose: () => void;
  data: GridViewSavedData | null;
  getAllSavedViews: () => void;
  renderedFrom: string;
  columns: any[];
  hideSelection: boolean;
  expander: boolean;
  table: Table<any>;
  oldSerializedSizes: React.MutableRefObject<string>;
};
export type UseArrangeViewProps = ArrangeViewDialogProps;

export type SidebarProps = {
  state: UseArrangeView;
  values: FormSchema;
  setFieldValue: SetFieldValue;
};
export type ContentProps = {
  state: UseArrangeView;
  values: FormSchema;
  setFieldValue: SetFieldValue;
};
export type RenderListItemProps = {
  column: TColType;
  index: number;
  handleRemoveItem: (colName: string) => void;
  hidden?: boolean;
};
export type HeadInputProps = {
  state: UseArrangeView;
  values: FormSchema;
  setFieldValue: SetFieldValue;
  touched: Touched;
  errors: Errors;
};
type Errors = FormikErrors<FormSchema>;
type Touched = FormikTouched<FormSchema>;
export type FormSchema = {
  name: string;
  access: string;
  default: boolean;
  order: string[];
  hide: string[];
};

export type SetFieldValue = (field: string, value: any, shouldValidate?: boolean) => Promise<void | FormikErrors<FormSchema>>;

export type InitialState = {
  loading: boolean;
  resized: boolean;
  search: string;
  sortedColumns: TColType[];
  activeItem: RenderListItemProps | null;
  isSidebarOpen: boolean;
};

export type Action =
  | { action: 'setLoading'; payload: InitialState['loading'] }
  | { action: 'setResized'; payload: InitialState['resized'] }
  | { action: 'setSearch'; payload: InitialState['search'] }
  | { action: 'setSortedColumns'; payload: InitialState['sortedColumns'] }
  | { action: 'setActiveItem'; payload: InitialState['activeItem'] }
  | { action: 'setIsSidebarOpen'; payload: InitialState['isSidebarOpen'] };

export type UseArrangeView = ReturnType<typeof useArrangeView>;
