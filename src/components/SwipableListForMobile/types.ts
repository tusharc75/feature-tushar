import { Dispatch, ReactNode } from 'react';

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
  backgroundColor?: (data: any) => string | null;
};
