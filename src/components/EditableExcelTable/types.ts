import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

export type EditableExcelTableProps = {
  columns: TColType[];
  data: any[];
  onChange: (data: any[]) => void;
};

export type TableHeadProps = {
  columns: EditableExcelTableProps['columns'];
};

export type TableBodyProps = {
  columns: EditableExcelTableProps['columns'];
  data: any[];
};
