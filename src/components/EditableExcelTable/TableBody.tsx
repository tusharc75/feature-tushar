import React from 'react';
import { TableBodyProps } from './types';
import { TableCell } from './TableCell';

const TableBody = ({ columns, data }: TableBodyProps) => {
  return (
    <>
      {data.map((d, i) => (
        <TableRow rowIndex={i} key={`${i}_${d?._id}`} columns={columns} data={d} />
      ))}
    </>
  );
};

export default TableBody;

const TableRow = ({ data, columns, rowIndex }: { data: any; columns: TableBodyProps['columns']; rowIndex: number }) => {
  return (
    <tr>
      {columns.map((c, i) => (
        <TableCell cellIndex={i} key={c.id || c.accessor} column={c} data={data} rowIndex={rowIndex} />
      ))}
    </tr>
  );
};
