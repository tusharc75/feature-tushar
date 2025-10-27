import { ClickAwayListener } from '@mui/material';
import React, { useMemo } from 'react';
import useSelectedCell from 'src/components/EditableExcelTable/hooks/useSelectedCell';
import EditableCells from 'src/components/EditableExcelTable/TableComponents/Cells';
import { cn } from 'src/constants/helpers';
import { TableCellProps } from '../types';

export const TableCell = React.memo(({ data, column, cellIndex, rowIndex, onMouseDown, totalColumns, totalRows }: TableCellProps) => {
  const { handleKeyDown, exitEditMode, cellRef, isEditing, isSelected, setIsEditing, handleClick } = useSelectedCell({
    colIndex: cellIndex,
    rowIndex,
    totalColumns,
    totalRows
  });

  const allowedEditing = useMemo(() => {
    return !['action'].includes(column.id || column.accessor);
  }, [column]);

  return (
    <ClickAwayListener
      onClickAway={() => {
        exitEditMode();
      }}
    >
      <td
        ref={cellRef}
        tabIndex={0}
        onClick={handleClick}
        onDoubleClick={() => setIsEditing(true)}
        className={cn(
          'relative min-w-[150px] cursor-cell select-none border p-1 [&_*:not(.no-inherit)]:!text-sm [&_*:not(.no-inherit)]:font-normal',
          isSelected || isEditing ? 'outline-offset-[-2px] [outline:2px_solid_var(--new-theme-color)]' : ''
        )}
        onKeyDown={handleKeyDown}
        data-col={cellIndex}
        data-key={column.id || column.accessor}
        data-row={rowIndex}
        onMouseDown={onMouseDown}
        data-selected={isSelected}
      >
        <EditableCells
          allowedEditing={allowedEditing}
          cellIndex={cellIndex}
          rowIndex={rowIndex}
          column={column}
          data={data}
          exitEditMode={exitEditMode}
          isEditing={isEditing}
          isSelected={isSelected}
        />
      </td>
    </ClickAwayListener>
  );
});
