import { useState } from 'react';
import { TableBodyProps } from './types';

export const TableCell = ({
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
  const [isEditing, setIsEditing] = useState(false);
  return (
    <td
      onClick={() => setIsEditing(true)}
      className="border"
      data-cell-index={cellIndex}
      data-key={column.id || column.accessor}
      data-row-index={rowIndex}
    >
      {isEditing ? <input /> : renderCellText(data, column)}
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
