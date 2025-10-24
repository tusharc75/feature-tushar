import React, { useRef, useState } from 'react';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { CellProps } from 'src/components/EditableExcelTable/types';
import { cleanDirtyRowData, getCellValue, renderCellText } from 'src/components/EditableExcelTable/utils';
import { handleAutoCalculation } from 'src/constants/formulaUtility';
import { cn } from 'src/constants/helpers';

function isValidNumberString(allowNegative: boolean, input: string, decimalPlaces: number): boolean {
  if (input === '' || input === '.') {
    return true;
  }
  if (allowNegative && input === '-') {
    return true;
  }

  // Build regex dynamically based on decimalPlaces
  const decimalPart = decimalPlaces > 0 ? `(\\.\\d{0,${decimalPlaces}})?` : '';
  const signPart = allowNegative ? '-?' : '';
  const regex = new RegExp(`^${signPart}\\d*${decimalPart}$`);

  return regex.test(input);
}

const Input = ({
  cellIndex,
  column,
  data,
  exitEditMode,
  isEditing,
  isSelected,
  rowIndex,
  allowedEditing,
  type = 'text',
  ...rest
}: CellProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const [, setStore] = useEditableTableStore((prev) => prev.pasteKey);
  const [columns] = useEditableTableStore((prev) => prev.columns);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(getCellValue(column, data));
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const setValueToState = (newValue: string | number) => {
    const key = column.accessor || column.id;
    if (type === 'number') {
      newValue = `${newValue}`.replace(/,/g, '');
      newValue = Number(newValue);
    }
    setInputValue(newValue);
    setStore((prev) => {
      const tableData = [...prev.tableData];
      const dirtyRows = [...prev.dirtyRows];
      const result = handleAutoCalculation(column, columns, tableData[rowIndex], key, '', '', newValue);
      tableData[rowIndex][key] = newValue;
      dirtyRows[rowIndex] = { ...tableData[rowIndex], [key]: newValue };
      if (Object.keys(result).length > 0) {
        tableData[rowIndex] = { ...tableData[rowIndex], ...result };
        dirtyRows[rowIndex] = cleanDirtyRowData(
          { ...tableData[rowIndex], ...result },
          columns.map((d) => d.id ?? d.accessor)
        );
      }
      return {
        dirtyRows,
        tableData
      };
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<any>) => {
    if (['Enter', 'Escape'].includes(e.key)) {
      exitEditMode();
      inputRef.current.blur();
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setValueToState(value);
    }, 1000);
    if (type === 'number') {
      const input = value.replace(/,/g, '');
      if (isValidNumberString(column?.isAllowedMinus, input, column.decimalPlaces || 0)) {
        setInputValue(value);
      }
    } else {
      setInputValue(value);
    }
  };

  return (
    <>
      <input
        ref={(node) => {
          if (node) {
            node.focus();
            if (isSelected && !isEditing) {
              node.select();
            }
          }
          inputRef.current = node;
        }}
        {...rest}
        onBlur={() => setValueToState(inputValue)}
        onKeyDown={handleKeyDown}
        className={cn(
          'absolute inset-0 min-w-0 bg-transparent p-1 text-sm text-[currentcolor] outline-none',
          isEditing && allowedEditing ? 'block' : 'hidden'
        )}
        value={inputValue}
        onChange={handleOnChange}
      />
      <span className={cn('truncate', isEditing && allowedEditing ? 'hidden' : 'block')}>{renderCellText(data, column)}</span>
    </>
  );
};

export default Input;
