import React from 'react';
import { TableBodyProps } from './types';

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

const TableCell = ({
  data,
  column,
  cellIndex,
  rowIndex
}: {
  data: any;
  column: TableBodyProps['columns'][number];
  cellIndex: number;
  rowIndex: number;
}) => {
  return (
    <td data-cell-index={cellIndex} data-key={column.id || column.accessor} data-row-index={rowIndex} contentEditable={'true'}>
      {renderCellText(data, column)}
    </td>
  );
};

function renderCellText(data: any, column: TableBodyProps['columns'][number]) {
  const cell = column.cell;
  if (typeof cell === 'string') {
    return cell;
  } else if (typeof cell === 'function') {
    const props = {
      row: {
        original: data
      }
    } as any;
    return cell(props);
  }
  return null;
}
