import { Dispatch, ReactNode } from 'react';

export type TSwipableListInputProps = {
  dispatch: Dispatch<any>;
  allowSelection: boolean;
  renderPrimaryField: (data: any) => ReactNode | string;
  renderSecondaryField?: (data: any) => ReactNode | string;
  renderIcons?: (data: any) => ReactNode | string;
  dataRows: any[];
  rowCount: number;
  page: number;
  loading: boolean;
  renderedFrom: string;

  chips?: TChip[];
  backgroundColor?: (data: any) => string;
};

type TChip = {
  label: string;
  field: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  forceShow?: boolean;
  fieldType?: 'date' | 'string';
} & React.HTMLAttributes<HTMLSpanElement>;
