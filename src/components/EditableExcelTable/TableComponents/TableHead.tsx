import React from 'react';
import { TableHeadProps } from '../types';

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
      <th className="sticky left-[0px] top-[-1px] z-10 bg-[var(--dark-primary,white)] text-sm font-semibold text-gray-500 dark:text-gray-400">
        <span className="relative z-[-1]">#</span>
        <span className="absolute bottom-[-1px] left-0 right-0 z-10 h-[1px] w-full bg-[var(--common-border-color)]" />
        <span className="absolute bottom-0 right-[-1px] top-0 z-10 h-full w-[1px] bg-[var(--common-border-color)]" />
      </th>
      {columns.map((col) => (
        <th
          className="sticky top-[-1px] z-[9] min-w-[150px] border bg-[var(--dark-primary,white)] p-1 text-left text-sm font-semibold text-gray-500 "
          key={col.id || col.accessor || (col as any)._id}
        >
          <span className="relative z-[-1]">{renderHeadText(col)}</span>
          <span className="absolute bottom-[-1px] left-0 right-0 z-10 h-[1px] w-full bg-[var(--common-border-color)]" />
        </th>
      ))}
    </tr>
  );
};

export default TableHead;
