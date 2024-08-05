import { useTableReducer } from './hooks/useTableReducer';
import type { TInitialState, TActios } from './hooks/useTableReducer';
import CustomReactTable from './CustomReactTable';
import Pagination from './TableComponents/Pagination';
import useColumns, {
  headerName,
  detailPagePath,
  getStaticFields,
  getCompletedByField,
  getSortedColumns,
  staticColumns
} from './hooks/useColumnsReactTable';
export default CustomReactTable;
export { useTableReducer, Pagination, useColumns, headerName, detailPagePath, getStaticFields, getCompletedByField, getSortedColumns, staticColumns };
export type { TInitialState, TActios };
export * from './utils';
