import React from 'react';
import { TableBodyProps, TableRowProps } from '../types';
import { TableCell } from './TableCell';
import { useTableRange } from 'src/components/EditableExcelTable/hooks/useTableRange';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import IndexCell from 'src/components/EditableExcelTable/TableComponents/IndexCell';

const TableBody = ({ tableBodyRef, containerRef, rangeRef, rowLineRef }: TableBodyProps) => {
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
        />
      ))}
    </>
  );
};

export default TableBody;

const TableRow = React.memo(({ data, columns, rowIndex, onMouseDown, rowLineRef, containerRef }: TableRowProps) => {
  const [pasteKey] = useEditableTableStore((prev) => prev.pasteKey);
  return (
    <tr className="group">
      <IndexCell rowIndex={rowIndex} rowLineRef={rowLineRef} containerRef={containerRef} />
      {columns.map((c, i) => (
        <TableCell cellIndex={i} key={`${c.id || c.accessor}_${pasteKey}`} column={c} data={data} rowIndex={rowIndex} onMouseDown={onMouseDown} />
      ))}
    </tr>
  );
});
