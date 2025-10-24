import React from 'react';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { useTableRange } from 'src/components/EditableExcelTable/hooks/useTableRange';
import IndexCell from 'src/components/EditableExcelTable/TableComponents/IndexCell';
import { TableBodyProps, TableRowProps } from '../types';
import { TableCell } from './TableCell';

const TableBody = ({ tableBodyRef, containerRef, rangeRef, rowLineRef, onDelete }: TableBodyProps) => {
  const [{ data, columns }] = useEditableTableStore((prev) => ({ data: prev.tableData, columns: prev.columns }));
  const { onMouseDown } = useTableRange({ tableBodyRef, columns, data, containerRef, rangeRef });

  return (
    <>
      {data.map((d, i) => (
        <TableRow
          rowIndex={i}
          key={`${i}_${d?._id}`}
          columns={columns}
          data={d}
          onMouseDown={onMouseDown}
          containerRef={containerRef}
          rowLineRef={rowLineRef}
          totalRows={data.length}
          totalColumns={columns.length}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

export default TableBody;

const TableRow = React.memo(
  ({ data, columns, rowIndex, onMouseDown, rowLineRef, containerRef, totalRows, totalColumns, onDelete }: TableRowProps) => {
    const [pasteKey] = useEditableTableStore((prev) => prev.pasteKey);
    return (
      <tr className="group">
        <IndexCell onDelete={onDelete} rowIndex={rowIndex} rowLineRef={rowLineRef} containerRef={containerRef} />
        {columns.map((c, i) => (
          <TableCell
            cellIndex={i}
            key={`${c.id || c.accessor}_${pasteKey}`}
            totalColumns={totalColumns}
            totalRows={totalRows}
            column={c}
            data={data}
            rowIndex={rowIndex}
            onMouseDown={onMouseDown}
          />
        ))}
      </tr>
    );
  }
);
