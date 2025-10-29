import { useEffect, useState } from 'react';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import DropDownHelper from 'src/components/EditableExcelTable/TableComponents/Cells/DropDownHelper';
import { CellProps, Option } from 'src/components/EditableExcelTable/types';
import { cleanDirtyRowData, getDropdownOptionValue, setValidRows } from 'src/components/EditableExcelTable/utils';

const DropDownCell = ({ cellIndex, column, data, exitEditMode, isEditing, rowIndex, allowedEditing, isSelected, ...rest }: CellProps) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);
  const [value, setValue] = useState<Option | null>(getDropdownOptionValue(column, data) as Option);
  const [, setStore] = useEditableTableStore((prev) => prev.pasteKey);
  const [columns] = useEditableTableStore((prev) => prev.columns);

  useEffect(() => {
    if (!hasFocus) return;
    setOptions(column?.option || []);
    setLoading(false);
  }, [column, hasFocus]);

  const handleCleanDirtyRows = (dirtyRows) => {
    return cleanDirtyRowData(
      dirtyRows,
      columns.map((d) => d.id ?? d.accessor)
    );
  };

  useEffect(() => {
    let errorMessage = '';
    if (column.required && !value?.optionValue) {
      errorMessage = `${column.Header} is required`;
    } else {
      errorMessage = '';
    }
    setStore((prev) => setValidRows({ prev, accessor: column.id || column.accessor, rowIndex, errorMessage }));
  }, [value, column.id, column.accessor, column.required, setStore, rowIndex, column.Header]);

  const setValueToState = (newValue: Option | null) => {
    setHasFocus(false);
    setValue(newValue as Option);
    setStore((prev) => {
      const tableData = [...prev.tableData];
      const dirtyRows = [...prev.dirtyRows];
      const key = column.accessor || column.id;
      if (newValue) {
        tableData[rowIndex][key] = newValue.optionLabel;
        if (column.lookup) {
          tableData[rowIndex][key] = newValue.optionLabel;
          tableData[rowIndex][`${key}Id`] = newValue.optionValue;
        }
        dirtyRows[rowIndex] = handleCleanDirtyRows({ ...tableData[rowIndex], [key]: newValue.optionValue });
      } else {
        tableData[rowIndex][key] = '';
        if (column.lookup) {
          tableData[rowIndex][key] = '';
          tableData[rowIndex][`${key}Id`] = '';
        }
        dirtyRows[rowIndex] = handleCleanDirtyRows({ ...tableData[rowIndex], [key]: '' });
      }
      return {
        dirtyRows,
        tableData
      };
    });
  };

  return (
    <>
      <DropDownHelper
        allowPointer={isSelected}
        options={options}
        loading={hasFocus && loading}
        value={value}
        onChange={(e, value) => setValueToState(value)}
        id={`${column.id}-${rowIndex}-selector`}
        getOptionLabel={(option: Option) => option.optionLabel || ''}
        inputProps={{
          onFocus: () => setHasFocus(true)
        }}
      />
    </>
  );
};

export default DropDownCell;
