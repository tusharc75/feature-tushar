import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import useEditableExcelTable from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { useTableRange } from 'src/components/EditableExcelTable/hooks/useTableRange';

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
  state: UseEditableExcelTable;
  containerRef: React.MutableRefObject<HTMLDivElement>;
  rangeRef: React.MutableRefObject<HTMLDivElement>;
};
export type TableRowProps = {
  data: any;
  columns: EditableExcelTableProps['columns'];
  rowIndex: number;
  onMouseDown: UseTableRange['onMouseDown'];
};

export type TableCellProps = {
  data: any;
  column: EditableExcelTableProps['columns'][number];
  cellIndex: number;
  rowIndex: number;
  onMouseDown: UseTableRange['onMouseDown'];
};

export type UseEditableExcelTable = ReturnType<typeof useEditableExcelTable>;
export type UseTableRange = ReturnType<typeof useTableRange>;

export type CellPosition = { row: number; col: number };
