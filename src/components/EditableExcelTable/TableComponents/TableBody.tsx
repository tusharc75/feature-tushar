import React from 'react';
import { TableBodyProps, TableRowProps } from '../types';
import { TableCell } from './TableCell';
import { useTableRange } from 'src/components/EditableExcelTable/hooks/useTableRange';

const TableBody = ({ columns, data, tableBodyRef, containerRef, rangeRef }: TableBodyProps) => {
  const { onMouseDown } = useTableRange({ tableBodyRef, columns, data, containerRef, rangeRef });

  return (
    <>
      {data.map((d, i) => (
        <TableRow rowIndex={i} key={`${i}_${d?._id}`} columns={columns} data={d} onMouseDown={onMouseDown} />
      ))}
    </>
  );
};

export default TableBody;

const TableRow = React.memo(({ data, columns, rowIndex, onMouseDown }: TableRowProps) => {
  return (
    <tr>
      <td className="sticky left-0 z-[9] min-w-[40px] border bg-[var(--dark-primary,white)] text-center text-gray-500 dark:text-gray-400">
        {rowIndex + 1}
        <span className="absolute bottom-0 right-[-1px] top-0 z-10 h-full w-[1px] bg-[var(--common-border-color)]" />
      </td>
      {columns.map((c, i) => (
        <TableCell cellIndex={i} key={c.id || c.accessor} column={c} data={data} rowIndex={rowIndex} onMouseDown={onMouseDown} />
      ))}
    </tr>
  );
});
