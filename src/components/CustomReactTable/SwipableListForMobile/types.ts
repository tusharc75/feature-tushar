import { Row } from '@tanstack/react-table';
import { Dispatch, ReactNode } from 'react';
import type { TInitialState } from 'src/components/CustomReactTable/hooks/useTableReducer';

export type TSwipableListInputProps = {
  table: any;
  allColumns: any;
  allowSelection: boolean;
  dataRows?: Row<any>[];
  dispatch: Dispatch<any>;
  loading?: boolean;
  expander: boolean;
  backgroundColorClass?: (data: any) => string | null;
  renderedFrom: string;
  state: TInitialState;
  submitInput: any;
  cellValue: any;
  setCellValue: any;
  isClientSideGrid: boolean;
  onRowClick?: (row: Row<any>) => void;
};
