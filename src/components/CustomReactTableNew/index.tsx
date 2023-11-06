import { useTableReducer } from './useTableReducer';
import type { TInitialState, TActios } from './useTableReducer';
import CustomReactTable from './CustomReactTable';
import Pagination from './Pagination';
import useColumns, {
  headerName,
  isRenderWithCopy,
  detailPagePath,
  disabledColumns,
  getStaticFields,
  getColumnHiddenStatus,
  checkStaticField,
  getSortedColumns,
  staticColumns
} from './useColumnsReactTable';

export default CustomReactTable;
export {
  useTableReducer,
  Pagination,
  useColumns,
  headerName,
  isRenderWithCopy,
  detailPagePath,
  disabledColumns,
  getStaticFields,
  getColumnHiddenStatus,
  checkStaticField,
  getSortedColumns,
  staticColumns
};
export type { TInitialState, TActios };
export * from './utils';
