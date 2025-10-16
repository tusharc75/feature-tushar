import { ClickAwayListener } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import EditableCells from 'src/components/EditableExcelTable/TableComponents/Cells';
import { cn } from 'src/constants/helpers';
import { TableCellProps } from '../types';

export const TableCell = React.memo(({ data, column, cellIndex, rowIndex, onMouseDown }: TableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const placeholderInput = useRef<HTMLInputElement>(null);
  const allowedEditing = useMemo(() => {
    return !['action'].includes(column.id || column.accessor);
  }, [column]);

  useEffect(() => {
    const placeholder = placeholderInput.current;
    if (isSelected && !isEditing) {
      placeholder.focus();
    }
    return () => {
      placeholder.blur();
    };
  }, [isSelected, isEditing]);

  const exitEditMode = () => {
    setIsSelected(false);
    setIsEditing(false);
  };

  return (
    <ClickAwayListener
      onClickAway={() => {
        exitEditMode();
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
        <input
          ref={placeholderInput}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              exitEditMode();
            }
            if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && e.key.length === 1) {
              setIsEditing(true);
            }
          }}
          onDoubleClick={() => setIsEditing(true)}
          className="sr-only"
        />

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
