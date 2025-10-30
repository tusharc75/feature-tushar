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

const TableHead = React.memo(({ columns }: TableHeadProps) => {
  if (!columns || columns.length === 0) {
    return null;
  }
  return (
    <tr>
      <th className="sticky left-0 top-0 z-10 min-w-[45px] bg-[var(--dark-primary,white)] bg-blue-50 px-1  py-2 text-center text-sm font-semibold text-gray-500 dark:bg-slate-800 dark:text-gray-400">
        <span className="relative z-[-1] ">#</span>
        <span className="absolute bottom-[0px] left-0 right-0 z-10 h-[1px] w-full bg-[var(--common-border-color)]" />
        <span className="absolute bottom-0 right-[0px] top-0 z-10 h-full w-[1px] bg-[var(--common-border-color)]" />
      </th>
      {columns.map((col) => (
        <th
          className="sticky top-0 z-[9] min-w-[150px] border-b border-r bg-[var(--dark-primary,white)] bg-blue-50  px-1 py-2 text-left text-sm font-semibold text-gray-500 dark:bg-slate-800 dark:text-gray-400 "
          key={col.id || col.accessor || (col as any)._id}
        >
          <span className="relative z-[-1]">
            {renderHeadText(col) ?? ''}
            {col.required ? '*' : ''}
          </span>
          <span className="absolute bottom-[-1px] left-0 right-0 z-10 h-[1px] w-full bg-[var(--common-border-color)]" />
        </th>
      ))}
    </tr>
  );
});

export default TableHead;
