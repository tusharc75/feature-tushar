import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import useEditableExcelTable from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { useTableRange } from 'src/components/EditableExcelTable/hooks/useTableRange';

export type EditableExcelTableProps = {
  columns: TColType[];
  data: any[];
  onChange: (data: any[]) => void;
  onDelete: (row: any) => void;
};

export type TableHeadProps = {
  columns: EditableExcelTableProps['columns'];
};

export type TableBodyProps = {
  tableBodyRef: UseEditableExcelTable['tableBodyRef'];
  containerRef: React.MutableRefObject<HTMLDivElement>;
  rangeRef: React.MutableRefObject<HTMLDivElement>;
  rowLineRef: React.MutableRefObject<HTMLDivElement>;
  onDelete: (row: any) => void;
};
export type TableRowProps = {
  data: any;
  columns: EditableExcelTableProps['columns'];
  rowIndex: number;
  onMouseDown: UseTableRange['onMouseDown'];
  containerRef: React.MutableRefObject<HTMLDivElement>;
  rowLineRef: React.MutableRefObject<HTMLDivElement>;
  totalRows: number;
  totalColumns: number;
  onDelete: (row: any) => void;
};

export type TableCellProps = {
  data: any;
  column: EditableExcelTableProps['columns'][number];
  cellIndex: number;
  rowIndex: number;
  onMouseDown: UseTableRange['onMouseDown'];
  totalRows: number;
  totalColumns: number;
};

export type UseEditableExcelTable = ReturnType<typeof useEditableExcelTable>;
export type UseTableRange = ReturnType<typeof useTableRange>;

export type CellPosition = { row: number; col: number };

export type CellProps = {
  cellIndex: number;
  rowIndex: number;
  data: any;
  column: TColType;
  isEditing: boolean;
  exitEditMode: () => void;
  allowedEditing: boolean;
  isSelected: boolean;
};

export type Option = { optionLabel: string; optionValue: string } & Record<string, any>;
