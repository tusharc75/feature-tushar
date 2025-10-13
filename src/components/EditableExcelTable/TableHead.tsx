import React from 'react';
import { TableHeadProps } from './types';

const renderHeadText = (column: TableHeadProps['columns'][number]): string => {
  const head = column.Header || column.header;
  if (typeof head === 'string') {
    return head;
  }
  if (typeof head === 'function') {
    return (head as any)();
  }
  return null;
};

const TableHead = ({ columns }: TableHeadProps) => {
  if (!columns || columns.length === 0) {
    return null;
  }
  return (
    <tr>
      {columns.map((col) => (
        <th key={col.id || col.accessor || (col as any)._id}>{renderHeadText(col)}</th>
      ))}
    </tr>
  );
};

export default TableHead;
