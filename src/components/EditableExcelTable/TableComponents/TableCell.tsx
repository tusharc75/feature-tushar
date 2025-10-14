import React, { useMemo, useState } from 'react';
import { TableBodyProps, TableCellProps } from '../types';
import { ClickAwayListener } from '@mui/material';
import { getCellValueText } from 'src/components/EditableExcelTable/utils';
import { cn } from 'src/constants/helpers';

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

export const TableCell = React.memo(({ data, column, cellIndex, rowIndex, onMouseDown }: TableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const isNotAllowedColumn = useMemo(() => {
    return ['action'].includes(column.id || column.accessor);
  }, [column]);

  const [inputValue, setInputValue] = useState(getCellValueText(column, data));

  return (
    <ClickAwayListener
      onClickAway={() => {
        setIsSelected(false);
        setIsEditing(false);
      }}
    >
      <td
        onClick={() => setIsSelected(true)}
        onDoubleClick={() => setIsEditing(true)}
        className={cn(
          'relative min-w-[150px] cursor-cell select-none border p-1 [&_*]:!text-sm [&_*]:font-normal',
          isSelected || isEditing ? 'outline-offset-[-2px] [outline:2px_solid_var(--new-theme-color)]' : ''
        )}
        data-col={cellIndex}
        data-key={column.id || column.accessor}
        data-row={rowIndex}
        onMouseDown={onMouseDown}
      >
        {isSelected && !isEditing && (
          <input
            ref={(node) => {
              if (node) {
                node.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(true);
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            className="sr-only"
          />
        )}
        {isEditing && !isNotAllowedColumn ? (
          <input
            className="absolute inset-0 min-w-0 bg-transparent p-2 text-sm text-[currentcolor] outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            ref={(node) => {
              if (node) {
                node.focus();
              }
            }}
          />
        ) : (
          renderCellText(data, column)
        )}
      </td>
    </ClickAwayListener>
  );
});
