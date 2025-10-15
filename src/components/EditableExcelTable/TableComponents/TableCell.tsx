import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const placeholderInput = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLDivElement>(null);
  const isNotAllowedColumn = useMemo(() => {
    return ['action'].includes(column.id || column.accessor);
  }, [column]);

  const [inputValue, setInputValue] = useState(getCellValueText(column, data));

  useEffect(() => {
    const placeholder = placeholderInput.current;
    const mainInputContainer = mainInputRef.current;
    if (isSelected && !isEditing) {
      mainInputContainer.style.display = 'none';
      placeholder.focus();
    }
    if (isSelected && !isNotAllowedColumn && isEditing) {
      mainInputContainer.style.display = 'block';
      mainInputContainer.querySelector('input').focus();
    }
    return () => {
      mainInputContainer.style.display = 'none';
      mainInputContainer.querySelector('input').blur();
      placeholder.blur();
    };
  }, [isSelected, isEditing, isNotAllowedColumn]);

  const exitEditMode = () => {
    setIsSelected(false);
    setIsEditing(false);
    setInputValue(getCellValueText(column, data));
    mainInputRef.current.style.display = 'none';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      exitEditMode();
    }
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
              setInputValue('');
            }
          }}
          className="sr-only"
        />

        <div style={{ display: 'none' }} ref={mainInputRef} className="absolute inset-0 min-w-0 text-sm text-[currentcolor] outline-none">
          <input
            onKeyDown={handleKeyDown}
            className="absolute inset-0 min-w-0 bg-transparent p-2 text-sm text-[currentcolor] outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        {(!isEditing || isNotAllowedColumn) && renderCellText(data, column)}
      </td>
    </ClickAwayListener>
  );
});
