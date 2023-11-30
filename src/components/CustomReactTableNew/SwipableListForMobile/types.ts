import { Dispatch, ReactNode } from 'react';
import type { TInitialState } from 'src/components/CustomReactTableNew/useTableReducer';

export type TSwipableListInputProps = {
  toggleAllRowsSelected: (value?: boolean) => void;
  dispatch: Dispatch<any>;
  allowSelection: boolean;
  dataRows: any[];
  rowCount: number;
  page: number;
  loading: boolean;
  renderedFrom: string;
  allColumns: any;
  expander: boolean;
  prepareRow: any;
  handleCellSelection: any;
  IndeterminateCheckbox: any;
  backgroundColorClass?: (data: any) => string | null;
  submitInput: any;
  cellValue: any;
  setCellValue: any;
  handleCellClick: any;
  handleKeyDown: any;
  state: TInitialState;
  isClientSideGrid: boolean;
  footerGroups: any;
};
