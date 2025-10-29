import { ClickAwayListener, Tooltip } from '@mui/material';
import React, { useMemo } from 'react';
import useSelectedCell from 'src/components/EditableExcelTable/hooks/useSelectedCell';
import EditableCells from 'src/components/EditableExcelTable/TableComponents/Cells';
import { cn } from 'src/constants/helpers';
import { TableCellProps } from '../types';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { Info, Warning } from '@mui/icons-material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

export const TableCell = React.memo(({ data, column, cellIndex, rowIndex, onMouseDown, totalColumns, totalRows }: TableCellProps) => {
  const { handleKeyDown, exitEditMode, cellRef, isEditing, isSelected, setIsEditing, handleClick } = useSelectedCell({
    colIndex: cellIndex,
    rowIndex,
    totalColumns,
    totalRows
  });
  const [isRowTouched] = useEditableTableStore((store) => store.touchedRows.get(rowIndex));
  const [rowErrors] = useEditableTableStore((store) => store.rowErrors[rowIndex]);

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
          'relative isolate min-w-[150px] cursor-cell select-none border p-1 [&_*:not(.no-inherit)]:!text-sm [&_*:not(.no-inherit)]:font-normal',
          isSelected || isEditing ? 'outline-offset-[-2px] [outline:2px_solid_var(--new-theme-color)]' : ''
        )}
        onKeyDown={handleKeyDown}
        data-col={cellIndex}
        data-key={column.id || column.accessor}
        data-row={rowIndex}
        onMouseDown={onMouseDown}
        data-selected={isSelected}
      >
        <span
          className={cn(
            'absolute inset-0 z-[-1] block ',
            isRowTouched && rowErrors?.get?.(column.id || column.accessor) ? 'border border-red-500' : ''
          )}
        >
          {isRowTouched && rowErrors?.get?.(column.id || column.accessor) ? (
            <Tooltip
              title={
                <p className="text-center">
                  <Warning color="warning" className="mx-auto" />
                  {rowErrors?.get?.(column.id || column.accessor)}, <p>Data cannot be saved.</p>
                </p>
              }
              className="block"
              arrow
              placement="top"
              enterTouchDelay={0}
            >
              <span className="absolute right-[2px] top-[2px] block cursor-help">
                <Warning color="error" />
              </span>
            </Tooltip>
          ) : null}
        </span>
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
