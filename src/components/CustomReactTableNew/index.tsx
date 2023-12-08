import { useTableReducer } from './hooks/useTableReducer';
import type { TInitialState, TActios } from './hooks/useTableReducer';
// import CustomReactTable from './CustomReactTable';
import CustomReactTable from './CustomReactTableV8';
import Pagination from './TableComponents/Pagination';
import useColumns, {
  headerName,
  detailPagePath,
  getStaticFields,
  getColumnHiddenStatus,
  checkStaticField,
  getSortedColumns,
  staticColumns
} from './hooks/useColumnsReactTable';

export default CustomReactTable;
export {
  useTableReducer,
  Pagination,
  useColumns,
  headerName,
  detailPagePath,
  getStaticFields,
  getColumnHiddenStatus,
  checkStaticField,
  getSortedColumns,
  staticColumns
};
export type { TInitialState, TActios };
export * from './utils';
